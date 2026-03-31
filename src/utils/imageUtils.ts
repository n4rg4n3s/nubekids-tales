// src/utils/imageUtils.ts

/**
 * IMAGE UTILITIES
 * 
 * Client-side image compression and resizing.
 * Reduces file size before sending to Gemini API.
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

const DEFAULT_OPTIONS: CompressOptions = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.85,
  format: 'image/jpeg',
};

/**
 * Compress and resize an image file.
 * Returns base64 string without the data URL prefix.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const { width, height } = calculateDimensions(
          img.width,
          img.height,
          opts.maxWidth!,
          opts.maxHeight!
        );
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Use better image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get base64 without prefix
        const dataUrl = canvas.toDataURL(opts.format, opts.quality);
        const base64 = dataUrl.split(',')[1];
        
        resolve(base64);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Calculate new dimensions maintaining aspect ratio.
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;
  
  // Scale down if necessary
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }
  
  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Convert a base64 string to a data URL.
 */
export function base64ToDataUrl(
  base64: string,
  mimeType: string = 'image/jpeg'
): string {
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Extract base64 from a data URL.
 */
export function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(',')[1] || dataUrl;
}

/**
 * Get file size in human-readable format.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Estimate base64 string size in bytes.
 */
export function estimateBase64Size(base64: string): number {
  // Base64 increases size by ~33%
  return Math.round((base64.length * 3) / 4);
}
