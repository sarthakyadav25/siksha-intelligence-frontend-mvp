import { useState, useRef } from "react";
import { UserAvatar } from "./UserAvatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, UploadCloud, X, Check } from "lucide-react";
import { toast } from "sonner";
import { compressImage } from "@/lib/imageCompression";
import { executeMediaUpload } from "@/lib/mediaUploadAdapter";
import { profileService } from "@/services/profile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProfileImageUploaderProps {
  currentProfileUrl?: string | null;
  name?: string | null;
  onUploadSuccess?: (newUrl: string) => void;
  className?: string; // Additional classes for the avatar itself
}

/**
 * A comprehensive Image Uploader for the User Profile.
 * Orchestrates the full lifecycle: Pick -> Preview -> Confirm -> Compress -> Init Auth -> Upload -> Complete
 */
export function ProfileImageUploader({
  currentProfileUrl,
  name,
  onUploadSuccess,
  className = "w-24 h-24 text-2xl",
}: ProfileImageUploaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sessionPreview, setSessionPreview] = useState<string | null>(null); // Temp preview in modal
  const [isUploading, setIsUploading] = useState(false);
  const [finalDisplayUrl, setFinalDisplayUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = finalDisplayUrl || currentProfileUrl;

  const validTypes = ["image/jpeg", "image/png", "image/webp"];

  const processFile = (file: File) => {
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload a JPEG, PNG, or WEBP image.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("Image is too large. Please select an image under 15MB.");
      return;
    }

    setSelectedFile(file);
    setSessionPreview(URL.createObjectURL(file));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const confirmAndUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);

      // 1. Compress the image
      const compressedFile = await compressImage(selectedFile, {
        maxSizeMB: 0.195, // strict 200 KB limit
        maxWidthOrHeight: 800,
        quality: 0.85
      });

      // 2. Request Upload Instruction
      const initResponse = await profileService.initProfileImageUpload({
        fileName: compressedFile.name,
        contentType: compressedFile.type,
        sizeBytes: compressedFile.size
      });

      // 3. Execute cloud upload
      const uploadResult = await executeMediaUpload(compressedFile, initResponse.data);

      // 4. Notify backend of completion
      const completeResponse = await profileService.completeProfileImageUpload({
        objectKey: uploadResult.objectKey,
        secureUrl: uploadResult.secureUrl,
        etag: uploadResult.etag,
        metadata: uploadResult.metadata
      });

      toast.success("Profile image updated successfully!");

      // Update local visible state & bubble up
      setFinalDisplayUrl(sessionPreview);
      setIsModalOpen(false);

      if (onUploadSuccess && completeResponse.data.profileUrl) {
         onUploadSuccess(completeResponse.data.profileUrl);
      }

    } catch (err: any) {
      console.error("Profile image upload failed:", err);
      toast.error(err.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      resetModalState();
    }
  };

  const resetModalState = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setSessionPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Safe wrapper for Dialog onOpenChange
  const handleOpenChange = (open: boolean) => {
    // Prevent closing the modal if a network upload is actively running
    if (isUploading) return;
    
    if (!open) resetModalState();
    setIsModalOpen(open);
  };

  return (
    <>
      {/* ── Hidden Input for the whole component ── */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        disabled={isUploading}
      />

      {/* ── Trigger Component (Avatar + Edit Button) ── */}
      <div className="relative inline-block group">
        <UserAvatar 
          profileUrl={displayUrl} 
          name={name} 
          className={`${className} transition-opacity group-hover:opacity-80`} 
        />

        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full shadow-md border border-border opacity-0 group-hover:opacity-100 transition-opacity translate-x-1/4 translate-y-1/4 z-10 hover:bg-primary hover:text-primary-foreground"
          onClick={() => setIsModalOpen(true)}
        >
          <Camera className="w-4 h-4" />
        </Button>
      </div>

      {/* ── Dialog Upload Modal ── */}
      <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
            <DialogDescription>
              Choose a new photo. We'll automatically compress it before uploading.
            </DialogDescription>
          </DialogHeader>

          {!selectedFile ? (
            <div 
              className="mt-4 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-xl bg-muted/20 p-10 py-16 text-center cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="p-4 bg-background rounded-full shadow-sm mb-4">
                <UploadCloud className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Click to upload</h3>
              <p className="text-sm text-muted-foreground">or drag and drop</p>
              <p className="text-xs text-muted-foreground block mt-4">SVG, PNG, JPG or GIF (max. 15MB)</p>
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-6">
              <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-muted shadow-lg ring-4 ring-background">
                <img 
                  src={sessionPreview!} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}
              </div>

              {!isUploading && (
                <div className="flex w-full gap-3 mt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={resetModalState}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Replace
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={confirmAndUpload}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Confirm & Upload
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
