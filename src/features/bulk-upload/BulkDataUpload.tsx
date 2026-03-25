import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  Download,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";

import type { BulkUploadState, BulkImportUserType, BulkImportReportDTO } from "./types";
import { USER_TYPE_OPTIONS } from "./types";
import { parseExcelFile } from "./utils/parseExcel";
import { fetchSse } from "./utils/fetchSse";
import { submitBulkImport, buildSseUrl } from "./services/bulkUploadApi";
import { downloadCsvTemplate } from "./utils/csvTemplate";
import { validateCsvData } from "./utils/csvValidation";
import FileDropzone from "./components/FileDropzone";
import TableShimmer from "./components/TableShimmer";
import DataPreviewTable from "./components/DataPreviewTable";
import UploadingProgress, { type RowStatus } from "./components/UploadingProgress";

const INITIAL_STATE: BulkUploadState = {
  phase: "idle",
  file: null,
  data: null,
  errorMessage: null,
  report: null,
};

interface BulkDataUploadProps {
  defaultUserType?: BulkImportUserType;
  hideTypeSelector?: boolean;
  onUploadComplete?: (report: BulkImportReportDTO) => void;
}

export default function BulkDataUpload({
  defaultUserType,
  hideTypeSelector = false,
  onUploadComplete,
}: BulkDataUploadProps) {
  const [state, setState] = useState<BulkUploadState>(INITIAL_STATE);
  const [userType, setUserType] = useState<BulkImportUserType>(defaultUserType ?? "students");
  const accessToken = useAppSelector((s) => s.auth.accessToken);

  // ── SSE live progress state ───────────────────────────────────────
  const [rowProgress, setRowProgress] = useState<Map<number, RowStatus>>(new Map());
  const [activeRowNumber, setActiveRowNumber] = useState(1);
  const sseCtrlRef = useRef<AbortController | null>(null);

  // ── Handle file accepted from dropzone ───────────────────────────
  const handleFileAccepted = useCallback(async (file: File) => {
    setState({ phase: "processing", file, data: null, errorMessage: null, report: null });
    const shimmerDelay = new Promise((r) => setTimeout(r, 1200));
    try {
      const [parsedData] = await Promise.all([parseExcelFile(file), shimmerDelay]);

      // Client-side CSV validation logic mapping to backend's CsvValidationHelper
      const validationError = validateCsvData(userType, parsedData);
      if (validationError) {
        throw new Error(validationError);
      }

      setState({ phase: "preview", file, data: parsedData, errorMessage: null, report: null });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred while processing the file.";
      setState({ phase: "error", file, data: null, errorMessage: message, report: null });
      toast.error("Upload Failed", { description: message });
    }
  }, []);

  // ── Handle confirm & upload (with SSE) ──────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!state.file) return;

    // 1. Generate a unique session ID
    const sessionId = crypto.randomUUID();

    // 2. Reset progress
    setRowProgress(new Map());
    setActiveRowNumber(1);

    // 3. Open SSE BEFORE firing the upload (using fetch so we can send auth header)
    const sseUrl = buildSseUrl(sessionId);
    const sseCtrl = fetchSse(
      sseUrl,
      accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      {
        onEvent: (eventType, data) => {
          try {
            if (eventType === "ROW_SUCCESS") {
              const d = JSON.parse(data) as { rowNumber: number; identifier: string };
              setRowProgress((prev) => { const next = new Map(prev); next.set(d.rowNumber, { kind: "success" }); return next; });
              setActiveRowNumber(d.rowNumber + 1);
            } else if (eventType === "ROW_FAILURE") {
              const d = JSON.parse(data) as { rowNumber: number; identifier: string; errorMessage: string };
              setRowProgress((prev) => { const next = new Map(prev); next.set(d.rowNumber, { kind: "failure", error: d.errorMessage }); return next; });
              setActiveRowNumber(d.rowNumber + 1);
            } else if (eventType === "JOB_COMPLETE") {
              sseCtrlRef.current = null;
              try {
                const d = JSON.parse(data) as { successCount: number; failureCount: number; totalRows: number };
                const report: BulkImportReportDTO = { status: d.failureCount === 0 ? "SUCCESS" : "PARTIAL", totalRows: d.totalRows, successCount: d.successCount, failureCount: d.failureCount, errorMessages: [] };
                setState((prev) => ({ ...prev, phase: "success", report }));
                if (d.failureCount === 0) {
                  toast.success("Upload Successful", { description: `${d.successCount} of ${d.totalRows} records imported.` });
                } else {
                  toast.warning("Upload Completed with Errors", { description: `${d.successCount} succeeded, ${d.failureCount} failed.` });
                }
                onUploadComplete?.(report);
              } catch { setState((prev) => ({ ...prev, phase: "success" })); }
            } else if (eventType === "JOB_FAILED") {
              sseCtrlRef.current = null;
              let message = "Import aborted by the server.";
              try { const d = JSON.parse(data) as { errorMessage?: string }; if (d.errorMessage) message = d.errorMessage; } catch {/* ignore */}
              setState((prev) => ({ ...prev, phase: "error", errorMessage: message }));
              toast.error("Upload Failed", { description: message });
            }
          } catch {/* ignore json parse errors */}
        },
        onError: (err) => {
          console.warn("SSE error (will fall back to HTTP response):", err.message);
          sseCtrlRef.current = null;
        },
        onDone: () => { sseCtrlRef.current = null; },
      }
    );
    sseCtrlRef.current = sseCtrl;

    // 4. Switch to uploading phase
    setState((prev) => ({ ...prev, phase: "uploading" }));

    // 5. Fire the upload (the HTTP response is the final fallback if SSE missed JOB_COMPLETE)
    try {
      const report = await submitBulkImport(state.file, userType, sessionId);
      // Only use the HTTP response if SSE didn't already move us to success/error
      setState((prev) => {
        if (prev.phase !== "uploading") return prev; // SSE already handled it
        const nextPhase = "success";
        if (report.failureCount === 0) {
          toast.success("Upload Successful", {
            description: `${report.successCount} of ${report.totalRows} records imported.`,
          });
        } else {
          toast.warning("Upload Completed with Errors", {
            description: `${report.successCount} succeeded, ${report.failureCount} failed.`,
          });
        }
        onUploadComplete?.(report);
        return { ...prev, phase: nextPhase, report };
      });
    } catch (error) {
      // Only show error if SSE didn't already transition us out of uploading
      setState((prev) => {
        if (prev.phase !== "uploading") return prev;
        const message =
          error instanceof Error ? error.message : "Upload failed. Please try again.";
        toast.error("Upload Failed", { description: message });
        return { ...prev, phase: "error", errorMessage: message };
      });
    } finally {
      // Clean up SSE if still open
      if (sseCtrlRef.current) {
        sseCtrlRef.current.abort();
        sseCtrlRef.current = null;
      }
    }
  }, [state.file, userType, accessToken, onUploadComplete]);

  // ── Reset ────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    if (sseCtrlRef.current) { sseCtrlRef.current.abort(); sseCtrlRef.current = null; }
    setRowProgress(new Map());
    setActiveRowNumber(1);
    setState(INITIAL_STATE);
  }, []);

  const selectedTypeLabel =
    USER_TYPE_OPTIONS.find((opt) => opt.value === userType)?.label ?? "Users";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Bulk Data Upload
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a CSV matching the template. Download it first if you haven't.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          {/* Download Template button — always visible */}
          <button
            type="button"
            onClick={() => downloadCsvTemplate(userType, accessToken)}
            disabled={state.phase === "processing" || state.phase === "uploading"}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Download Template
          </button>

          {/* User type selector */}
          {!hideTypeSelector && (
            <div className="relative">
              <label
                htmlFor="bulk-upload-user-type"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Import as
              </label>
              <div className="relative">
                <select
                  id="bulk-upload-user-type"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as BulkImportUserType)}
                  disabled={state.phase === "processing" || state.phase === "uploading"}
                  className={cn(
                    "h-9 w-44 appearance-none rounded-md border border-input bg-background px-3 pr-8 text-sm font-medium text-foreground shadow-sm",
                    "transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  {USER_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic content */}
      <AnimatePresence mode="wait">
        {/* IDLE */}
        {state.phase === "idle" && (
          <motion.div key="dropzone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <FileDropzone onFileAccepted={handleFileAccepted} />
          </motion.div>
        )}

        {/* PROCESSING */}
        {state.phase === "processing" && (
          <motion.div key="shimmer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing <span className="font-medium text-foreground">{state.file?.name}</span>…
            </div>
            <TableShimmer rows={8} columns={5} />
          </motion.div>
        )}

        {/* PREVIEW */}
        {state.phase === "preview" && state.data && (
          <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            <DataPreviewTable data={state.data} />
            <div className="flex items-center gap-3">
              <Button onClick={handleSubmit} className="gap-2">
                <Upload className="h-4 w-4" />
                Confirm &amp; Upload {selectedTypeLabel}
              </Button>
              <Button variant="outline" onClick={handleReset}>Cancel</Button>
            </div>
          </motion.div>
        )}

        {/* UPLOADING — real-time SSE progress */}
        {state.phase === "uploading" && state.data && (
          <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <UploadingProgress
              data={state.data}
              typeLabel={selectedTypeLabel}
              rowProgress={rowProgress}
              activeRowNumber={activeRowNumber}
            />
          </motion.div>
        )}

        {/* SUCCESS */}
        {state.phase === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 w-full text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Upload Complete</p>
              {state.report ? (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{state.report.successCount}</span>
                    {" "}of{" "}
                    <span className="font-semibold text-foreground">{state.report.totalRows}</span>
                    {" "}records imported successfully.
                  </p>
                  {state.report.failureCount > 0 && (
                    <p className="text-sm text-destructive">
                      {state.report.failureCount} record{state.report.failureCount !== 1 ? "s" : ""} failed to import.
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">Records have been successfully imported.</p>
              )}
            </div>

            {/* Detailed Row-by-Row Report */}
            {state.data?.rows && state.data.rows.length > 0 && (
              <div className="mt-4 w-full max-h-[350px] overflow-auto rounded-lg border bg-background text-left shadow-sm">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur text-muted-foreground w-full shadow-sm">
                    <tr>
                      <th className="px-4 py-2.5 font-medium w-16 text-center border-b">Row</th>
                      <th className="px-4 py-2.5 font-medium border-b">Record Identifier</th>
                      <th className="px-4 py-2.5 font-medium w-32 border-b">Status</th>
                      <th className="px-4 py-2.5 font-medium border-b w-1/2">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {state.data.rows.map((r, i) => {
                      const rowNum = i + 1; // 1-indexed to match SSE
                      const status = rowProgress.get(rowNum);
                      
                      // Fallback: If SSE missed it, check the report's errorMessages array
                      const fallbackError = Array.isArray(state.report?.errorMessages) 
                        ? state.report.errorMessages.find(
                            (msg) => msg.startsWith(`Row ${rowNum}:`) || msg.startsWith(`Row ${rowNum} `)
                          )
                        : undefined;
                      
                      const errorText = status?.kind === "failure" ? status.error : fallbackError;
                      const isSuccess = !errorText; // If no error text exists, it succeeded
                      
                      // First name + last name usually in column 0 and 1
                      const identifier = r[0] ? `${r[0]} ${r[1] ?? ""}`.trim() : `Row ${rowNum}`;

                      return (
                        <tr key={rowNum} className={isSuccess ? "bg-green-500/5 hover:bg-green-500/10 transition-colors" : "bg-destructive/5 hover:bg-destructive/10 transition-colors"}>
                          <td className="px-4 py-3 text-center text-muted-foreground">{rowNum}</td>
                          <td className="px-4 py-3 font-medium truncate max-w-[200px]" title={identifier}>{identifier}</td>
                          <td className="px-4 py-3">
                            {isSuccess ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                                <CheckCircle2 className="h-3 w-3" />
                                Success
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/20 px-2.5 py-0.5 text-xs font-medium text-destructive">
                                <AlertTriangle className="h-3 w-3" />
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {errorText || "Imported successfully."}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Upload Another File
            </Button>
          </motion.div>
        )}

        {/* ERROR */}
        {state.phase === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-10 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Something went wrong</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">{state.errorMessage}</p>
            </div>
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
