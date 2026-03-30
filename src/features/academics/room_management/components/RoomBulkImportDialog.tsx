import { useState, useCallback, useRef, useEffect } from 'react';
import {
    Upload,
    FileSpreadsheet,
    Download,
    Loader2,
    CheckCircle2,
    XCircle,
    AlertCircle,
    X,
    Minimize2,
    Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { toast } from 'sonner';

// ── CSV Template ─────────────────────────────────────────────────────

const ROOM_CSV_HEADERS = [
    'name', 'roomType', 'seatingType', 'rowCount', 'columnsPerRow',
    'seatsPerUnit', 'floorNumber', 'building', 'hasProjector', 'hasAC',
    'hasWhiteboard', 'isAccessible', 'otherAmenities',
];

const SAMPLE_ROWS = [
    ['Room 101', 'CLASSROOM', 'BENCH', '5', '4', '3', '1', 'Block A', 'true', 'false', 'true', 'false', ''],
    ['Room 102', 'CLASSROOM', 'DESK_CHAIR', '6', '5', '1', '1', 'Block A', 'false', 'false', 'true', 'false', ''],
    ['Physics Lab', 'LABORATORY', 'WORKSTATION', '4', '6', '2', '0', 'Block B', 'true', 'true', 'true', 'true', 'Fume Hood'],
    ['Computer Lab 1', 'COMPUTER_LAB', 'TERMINAL', '5', '8', '1', '2', 'Block A', 'true', 'true', 'false', 'false', ''],
    ['Library', 'LIBRARY', 'DESK_CHAIR', '10', '6', '1', '0', 'Main Building', 'false', 'true', 'true', 'true', ''],
];

function escapeCsv(val: string): string {
    return `"${val.replace(/"/g, '""')}"`;
}

function downloadRoomTemplate() {
    const allRows = [ROOM_CSV_HEADERS, ...SAMPLE_ROWS];
    const csvText = allRows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rooms_bulk_import_template.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── SSE URL builder ──────────────────────────────────────────────────

function buildSseUrl(sessionId: string): string {
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? 'http://localhost:8080';
    const prefix = (import.meta.env.VITE_API_PREFIX ?? '/api').replace(/\/+$/, '');
    const version = (import.meta.env.VITE_API_VERSION ?? 'v1').replace(/^\/+/, '').replace(/\/+$/, '');
    return `${baseUrl}${prefix}/${version}/bulk-import/stream/${sessionId}`;
}

// ── Types ────────────────────────────────────────────────────────────

interface SseRowEvent {
    rowNumber: number;
    identifier: string;
    errorMessage?: string;
    totalCapacity?: number;
}

interface ImportResult {
    status: 'idle' | 'uploading' | 'complete';
    totalRows: number;
    successCount: number;
    failureCount: number;
    errors: string[];
    events: SseRowEvent[];
}

// ── Component ────────────────────────────────────────────────────────

interface RoomBulkImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RoomBulkImportDialog({ open, onOpenChange }: RoomBulkImportDialogProps) {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const toastIdRef = useRef<string | number | null>(null);
    const [result, setResult] = useState<ImportResult>({
        status: 'idle',
        totalRows: 0,
        successCount: 0,
        failureCount: 0,
        errors: [],
        events: [],
    });

    // Cleanup SSE on unmount
    useEffect(() => {
        return () => {
            eventSourceRef.current?.close();
        };
    }, []);

    const resetState = useCallback(() => {
        setSelectedFile(null);
        setIsMinimized(false);
        if (toastIdRef.current) { toast.dismiss(toastIdRef.current); toastIdRef.current = null; }
        setResult({ status: 'idle', totalRows: 0, successCount: 0, failureCount: 0, errors: [], events: [] });
        eventSourceRef.current?.close();
    }, []);

    const handleClose = () => {
        if (result.status === 'uploading') return;
        resetState();
        onOpenChange(false);
    };

    // ── Toast progress renderer ────────────────────────────────────────────────
    const showProgressToast = useCallback((
        success: number, failed: number, total: number, onRestore: () => void
    ) => {
        const done = success + failed;
        const toastContent = (
            <div className="w-full">
                <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-semibold flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        Importing Rooms…
                    </p>
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {success} ✓ {failed > 0 ? `· ${failed} ✗` : ''}
                    </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden flex mb-1.5">
                    <div className="h-full rounded-l-full bg-green-500 transition-all duration-300" style={{ width: `${total > 0 ? (success / total) * 100 : 0}%` }} />
                    <div className="h-full bg-destructive transition-all duration-300" style={{ width: `${total > 0 ? (failed / total) * 100 : 0}%` }} />
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{done} rows processed</span>
                    <button type="button" onClick={onRestore} className="text-xs text-primary underline-offset-2 hover:underline">
                        View Full Progress
                    </button>
                </div>
            </div>
        );
        if (toastIdRef.current) {
            toast.custom(() => toastContent, { id: toastIdRef.current as string, duration: Infinity });
        } else {
            const id = toast.custom(() => toastContent, { duration: Infinity });
            toastIdRef.current = id;
        }
    }, []);

    const handleRestore = useCallback(() => {
        setIsMinimized(false);
        if (toastIdRef.current) { toast.dismiss(toastIdRef.current); toastIdRef.current = null; }
    }, []);

    const handleFileSelect = (file: File) => {
        const isValid = file.name.endsWith('.csv') || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel';
        if (!isValid) {
            toast.error('Please select a CSV file.');
            return;
        }
        setSelectedFile(file);
        setResult({ status: 'idle', totalRows: 0, successCount: 0, failureCount: 0, errors: [], events: [] });
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        const sessionId = crypto.randomUUID();
        setResult({ status: 'uploading', totalRows: 0, successCount: 0, failureCount: 0, errors: [], events: [] });

        // 1. Connect SSE first
        const sseUrl = buildSseUrl(sessionId);
        const eventSource = new EventSource(sseUrl);
        eventSourceRef.current = eventSource;

        eventSource.addEventListener('ROW_SUCCESS', (e) => {
            const data: SseRowEvent = JSON.parse(e.data);
            setResult(prev => {
                const next = { ...prev, successCount: prev.successCount + 1, events: [...prev.events, data] };
                if (isMinimized) showProgressToast(next.successCount, next.failureCount, next.totalRows, handleRestore);
                return next;
            });
        });

        eventSource.addEventListener('ROW_FAILURE', (e) => {
            const data: SseRowEvent = JSON.parse(e.data);
            setResult(prev => {
                const next = { ...prev, failureCount: prev.failureCount + 1, errors: [...prev.errors, `Row ${data.rowNumber} (${data.identifier}): ${data.errorMessage}`], events: [...prev.events, data] };
                if (isMinimized) showProgressToast(next.successCount, next.failureCount, next.totalRows, handleRestore);
                return next;
            });
        });

        eventSource.addEventListener('JOB_COMPLETE', (e) => {
            const data = JSON.parse(e.data);
            setResult(prev => ({ ...prev, status: 'complete', totalRows: data.totalRows, successCount: data.successCount, failureCount: data.failureCount }));
            eventSource.close();
            setIsMinimized(false);
            if (toastIdRef.current) { toast.dismiss(toastIdRef.current); toastIdRef.current = null; }
            queryClient.invalidateQueries({ queryKey: ['academics', 'rooms'] });
            if (data.failureCount === 0) {
                toast.success(`Successfully imported ${data.successCount} rooms!`);
            } else {
                toast.warning(`Imported ${data.successCount} rooms with ${data.failureCount} errors.`);
            }
        });

        eventSource.onerror = () => {
            eventSource.close();
        };

        // 2. Submit file
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            await api.post('/auth/bulk-import/rooms', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-Session-Id': sessionId,
                },
            });
        } catch (err: any) {
            eventSource.close();
            const msg = err?.response?.data?.message || 'Upload failed. Please check your CSV format.';
            setResult(prev => ({
                ...prev,
                status: 'complete',
                errors: [...prev.errors, msg],
            }));
            toast.error(msg);
        }
    };

    const progressPercent = result.totalRows > 0
        ? Math.round(((result.successCount + result.failureCount) / result.totalRows) * 100)
        : result.status === 'uploading' ? undefined : 0;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5 text-primary" />
                        Bulk Import Rooms
                    </DialogTitle>
                    <DialogDescription>
                        Upload a CSV file to import multiple rooms at once. Make sure buildings are configured first.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Step 1: Download Template */}
                    <div className="flex items-center justify-between bg-muted/30 rounded-lg border border-border/50 p-4">
                        <div className="flex items-center gap-3">
                            <FileSpreadsheet className="w-5 h-5 text-primary" />
                            <div>
                                <p className="text-sm font-medium">Download Template</p>
                                <p className="text-xs text-muted-foreground">Pre-filled CSV with sample data</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={downloadRoomTemplate} className="gap-2">
                            <Download className="w-4 h-4" /> Template
                        </Button>
                    </div>

                    {/* Step 2: Upload File */}
                    {result.status === 'idle' && (
                        <>
                            <div
                                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                                    dragActive
                                        ? 'border-primary bg-primary/5'
                                        : selectedFile
                                        ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20'
                                        : 'border-border hover:border-primary/30 hover:bg-muted/20'
                                }`}
                                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                onDragLeave={() => setDragActive(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                />
                                {selectedFile ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                                        <p className="text-sm font-semibold text-foreground">{selectedFile.name}</p>
                                        <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                        <Button
                                            variant="ghost" size="sm"
                                            className="mt-1 text-xs"
                                            onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                        >
                                            <X className="w-3 h-3 mr-1" /> Remove
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="w-8 h-8 text-muted-foreground/50" />
                                        <p className="text-sm font-medium">Drop your CSV file here or click to browse</p>
                                        <p className="text-xs text-muted-foreground">Only .csv files are accepted</p>
                                    </div>
                                )}
                            </div>

                            {selectedFile && (
                                <Button onClick={handleUpload} className="w-full gap-2">
                                    <Upload className="w-4 h-4" /> Start Import
                                </Button>
                            )}
                        </>
                    )}

                    {/* Step 3: Progress */}
                    {result.status === 'uploading' && (
                        isMinimized ? (
                            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    Import running in background…
                                </div>
                                <Button variant="outline" size="sm" onClick={handleRestore} className="gap-1.5 h-7 text-xs">
                                    <Maximize2 className="w-3.5 h-3.5" />
                                    Show Progress
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                    <p className="text-sm font-medium flex-1">Importing rooms...</p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsMinimized(true);
                                            showProgressToast(result.successCount, result.failureCount, result.totalRows, handleRestore);
                                        }}
                                        title="Minimize to toast"
                                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    >
                                        <Minimize2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <Progress value={progressPercent} className="h-2" />
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="text-green-600 font-medium">{result.successCount} success</span>
                                    {result.failureCount > 0 && (
                                        <span className="text-red-600 font-medium">{result.failureCount} failed</span>
                                    )}
                                </div>
                                {/* Live event feed */}
                                <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-muted/20 p-3 space-y-1.5">
                                    {result.events.map((evt, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs">
                                            {evt.errorMessage ? (
                                                <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                            ) : (
                                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                            )}
                                            <span className="text-muted-foreground">Row {evt.rowNumber}:</span>
                                            <span className="font-medium truncate">{evt.identifier}</span>
                                            {evt.errorMessage && (
                                                <span className="text-red-500 truncate ml-auto">— {evt.errorMessage}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    )}


                    {/* Step 4: Results */}
                    {result.status === 'complete' && (
                        <div className="space-y-4">
                            <div className={`rounded-lg border p-4 ${
                                result.failureCount === 0
                                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                                    : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                            }`}>
                                <div className="flex items-center gap-3 mb-3">
                                    {result.failureCount === 0 ? (
                                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                                    ) : (
                                        <AlertCircle className="w-6 h-6 text-amber-600" />
                                    )}
                                    <h4 className="font-semibold">
                                        {result.failureCount === 0 ? 'Import Complete!' : 'Import Completed with Errors'}
                                    </h4>
                                </div>
                                <div className="flex gap-4">
                                    <Badge variant="secondary" className="gap-1">Total: {result.totalRows}</Badge>
                                    <Badge className="gap-1 bg-green-600 hover:bg-green-700 text-white">Success: {result.successCount}</Badge>
                                    {result.failureCount > 0 && (
                                        <Badge variant="destructive" className="gap-1">Failed: {result.failureCount}</Badge>
                                    )}
                                </div>
                            </div>

                            {result.errors.length > 0 && (
                                <div className="max-h-40 overflow-y-auto rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 p-3 space-y-1.5">
                                    {result.errors.map((err, i) => (
                                        <div key={i} className="flex items-start gap-2 text-xs">
                                            <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-red-700 dark:text-red-400">{err}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Button variant="outline" className="w-full" onClick={resetState}>
                                Import Another File
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
