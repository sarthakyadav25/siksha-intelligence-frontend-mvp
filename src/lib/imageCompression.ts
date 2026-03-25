/**
 * Utility for compressing images client-side before sending to cloud providers.
 * Uses native HTML5 Canvas to resize and reduce file size, avoiding heavy external modules.
 */

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number; // 0.1 to 1.0 (default 0.8)
}

export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const {
    maxSizeMB = 5,
    maxWidthOrHeight = 1024,
    quality = 0.8,
  } = options;

  // Attempt to short-circuit if the file is already extremely small natively
  if (file.size / 1024 / 1024 < maxSizeMB * 0.5) {
     return file; // Already very light, no need to risk degrading quality
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = async () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio safe resizing
        if (width > height) {
          if (width > maxWidthOrHeight) {
            height = Math.round((height *= maxWidthOrHeight / width));
            width = maxWidthOrHeight;
          }
        } else {
          if (height > maxWidthOrHeight) {
            width = Math.round((width *= maxWidthOrHeight / height));
            height = maxWidthOrHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Failed to get canvas context for compression"));
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        const getBlob = (q: number): Promise<Blob> => {
          return new Promise((res, rej) => {
            canvas.toBlob((b) => (b ? res(b) : rej(new Error("Blob failed"))), "image/jpeg", q);
          });
        };

        try {
          let currentQuality = quality;
          let blob = await getBlob(currentQuality);
          const targetBytes = maxSizeMB * 1024 * 1024;

          // Iteratively step down quality if the blob is too large
          while (blob.size > targetBytes && currentQuality > 0.1) {
            currentQuality -= 0.1;
            blob = await getBlob(currentQuality);
          }

          // Create a new file instance matching the blob exactly
          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error("Failed to load image for compression"));
    };

    reader.onerror = () => reject(new Error("Failed to read original file"));
    reader.readAsDataURL(file);
  });
};
