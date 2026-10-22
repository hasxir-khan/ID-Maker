import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { storage } from './firebase';
import { CardData, CardElement, BrandKit, normalizeCardElements } from '../types/card';

export interface ImageOptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number;
}

const FIRESTORE_DOC_MAX_BYTES = 1048576; // 1 MB hard limit
const FIRESTORE_DOC_SAFETY_LIMIT = 900000; // 900 KB safe limit

/**
 * Checks if a string is a genuine Base64 / data: URL payload.
 */
export function isBase64DataUrl(str?: string | null): boolean {
  if (!str || typeof str !== 'string') return false;
  return (
    str.startsWith('data:image/') ||
    str.startsWith('data:application/') ||
    (str.startsWith('data:') && str.includes(';base64,'))
  );
}

/**
 * Calculates estimated UTF-8 byte size of an object when serialized for Firestore.
 */
export function getEstimatedDocumentSize(obj: any): number {
  try {
    const jsonStr = JSON.stringify(obj);
    return new Blob([jsonStr]).size;
  } catch {
    return 0;
  }
}

/**
 * Validates that the card document size does not exceed Firestore limits.
 * Logs comprehensive size diagnostics.
 */
export function validateCardDocumentSize(card: CardData, maxBytes = FIRESTORE_DOC_SAFETY_LIMIT): { sizeBytes: number; sizeKb: number; percentageOfLimit: number } {
  const sizeBytes = getEstimatedDocumentSize(card);
  const sizeKb = Number((sizeBytes / 1024).toFixed(2));
  const percentageOfLimit = Number(((sizeBytes / FIRESTORE_DOC_MAX_BYTES) * 100).toFixed(1));

  console.log(`[AssetStorage:SizeValidation] Document Size: ${sizeBytes} bytes (${sizeKb} KB) — ${percentageOfLimit}% of 1MB limit (Safety threshold: ${(maxBytes / 1024).toFixed(0)} KB)`);

  if (sizeBytes > maxBytes) {
    const errorMsg = `Card document payload (${sizeKb} KB) exceeds the Firestore safe limit of ${(maxBytes / 1024).toFixed(0)} KB. Please remove excessive large embedded media.`;
    console.error(`[AssetStorage:SizeValidation] REJECTED: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  return { sizeBytes, sizeKb, percentageOfLimit };
}

/**
 * Compresses and scales an image using HTMLCanvasElement.
 * Preserves transparency for PNG (logos/signatures), optimizes JPEG for portraits.
 */
export async function optimizeImageBlob(
  input: string | File | Blob,
  options: ImageOptimizeOptions = {}
): Promise<{ blob: Blob; mimeType: string; dataUrl: string }> {
  const maxWidth = options.maxWidth || 800;
  const maxHeight = options.maxHeight || 1000;
  const targetFormat = options.format || 'image/jpeg';
  const quality = options.quality !== undefined ? options.quality : 0.85;

  // Environment guard for non-browser or SSR contexts
  if (typeof window === 'undefined' || typeof Image === 'undefined' || typeof document === 'undefined') {
    const rawData = typeof input === 'string' ? input : '';
    const fallbackBlob = new Blob([rawData], { type: targetFormat });
    return { blob: fallbackBlob, mimeType: targetFormat, dataUrl: rawData };
  }

  return new Promise((resolve, reject) => {
    let srcUrl = '';
    let isCreatedObjectURL = false;
    let isSettled = false;

    // Safety timeout: Never let image loading freeze the UI or save pipeline
    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        if (isCreatedObjectURL) URL.revokeObjectURL(srcUrl);
        const fallbackUrl = typeof input === 'string' ? input : '';
        const fallbackBlob = typeof input === 'string' ? new Blob([input], { type: targetFormat }) : input;
        resolve({ blob: fallbackBlob, mimeType: targetFormat, dataUrl: fallbackUrl });
      }
    }, 2000);

    if (typeof input === 'string') {
      srcUrl = input;
    } else {
      srcUrl = URL.createObjectURL(input);
      isCreatedObjectURL = true;
    }

    const img = new Image();

    // Only set crossOrigin if input is NOT a local data URL
    if (typeof input === 'string' && !input.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timer);
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Failed to obtain 2D canvas context for image optimization.');
        }

        // For non-PNG formats (like JPEG), paint a white background to avoid dark transparent artifacts
        if (targetFormat === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL(targetFormat, quality);

        canvas.toBlob(
          (blob) => {
            if (isCreatedObjectURL) {
              URL.revokeObjectURL(srcUrl);
            }
            if (blob) {
              resolve({ blob, mimeType: targetFormat, dataUrl });
            } else {
              const fallbackBlob = new Blob([dataUrl], { type: targetFormat });
              resolve({ blob: fallbackBlob, mimeType: targetFormat, dataUrl });
            }
          },
          targetFormat,
          quality
        );
      } catch (err) {
        if (isCreatedObjectURL) URL.revokeObjectURL(srcUrl);
        const fallbackUrl = typeof input === 'string' ? input : '';
        const fallbackBlob = typeof input === 'string' ? new Blob([input], { type: targetFormat }) : input;
        resolve({ blob: fallbackBlob, mimeType: targetFormat, dataUrl: fallbackUrl });
      }
    };

    img.onerror = () => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timer);
      if (isCreatedObjectURL) URL.revokeObjectURL(srcUrl);
      const fallbackUrl = typeof input === 'string' ? input : '';
      const fallbackBlob = typeof input === 'string' ? new Blob([input], { type: targetFormat }) : input;
      resolve({ blob: fallbackBlob, mimeType: targetFormat, dataUrl: fallbackUrl });
    };

    img.src = srcUrl;
  });
}

/**
 * Uploads an asset (photo, logo, signature, background, element) to Firebase Storage
 * and returns the permanent Firebase Storage download URL.
 * Falls back to a highly-compressed compact data URL if Storage upload is interrupted.
 */
export async function uploadCardAsset(
  input: string | File | Blob,
  userId: string,
  cardId: string,
  assetType: 'photo' | 'logo' | 'signature' | 'student_signature' | 'principal_signature' | 'background' | 'element'
): Promise<string> {
  // If already a remote URL (not data URL), no upload needed
  if (
    typeof input === 'string' &&
    !isBase64DataUrl(input) &&
    (input.startsWith('http://') || input.startsWith('https://'))
  ) {
    return input;
  }

  // Determine optimal compression strategy per asset type
  let format: 'image/jpeg' | 'image/png' = 'image/jpeg';
  let maxWidth = 300;
  let maxHeight = 380;
  let quality = 0.8;

  if (assetType === 'logo') {
    format = 'image/png';
    maxWidth = 200;
    maxHeight = 200;
    quality = 0.85;
  } else if (
    assetType === 'signature' ||
    assetType === 'student_signature' ||
    assetType === 'principal_signature'
  ) {
    format = 'image/png';
    maxWidth = 240;
    maxHeight = 80;
    quality = 0.85;
  } else if (assetType === 'background') {
    format = 'image/jpeg';
    maxWidth = 600;
    maxHeight = 400;
    quality = 0.75;
  } else if (assetType === 'photo') {
    format = 'image/jpeg';
    maxWidth = 300;
    maxHeight = 380;
    quality = 0.8;
  }

  const { blob, mimeType, dataUrl } = await optimizeImageBlob(input, {
    format,
    maxWidth,
    maxHeight,
    quality,
  });

  try {
    const uploadPromise = (async () => {
      const ext = format === 'image/png' ? 'png' : 'jpg';
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const storagePath = `users/${userId}/cards/${cardId}/${assetType}_${timestamp}_${randomSuffix}.${ext}`;
      const storageRef = ref(storage, storagePath);

      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: mimeType,
        customMetadata: {
          ownerId: userId,
          cardId,
          assetType,
        },
      });

      return await getDownloadURL(snapshot.ref);
    })();

    // Enforce 1.8s timeout so unreachable storage buckets never freeze the browser UI
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Storage upload timeout')), 1800)
    );

    const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
    console.info(`[AssetStorage] Successfully uploaded ${assetType} to Storage: ${downloadUrl}`);
    return downloadUrl;
  } catch (storageErr: any) {
    console.warn(`[AssetStorage] Storage upload fallback for ${assetType} (${storageErr?.message || storageErr}): using compact optimized asset payload (${(dataUrl.length / 1024).toFixed(1)} KB)`);
    // Return the compressed compact dataUrl (< 15 KB) so card save never fails
    return dataUrl;
  }
}

/**
 * Uploads an asset for an organization Brand Kit (logo or signature).
 */
export async function uploadBrandKitAsset(
  input: string | File | Blob,
  userId: string,
  kitId: string,
  assetType: 'logo' | 'signature'
): Promise<string> {
  if (
    typeof input === 'string' &&
    !isBase64DataUrl(input) &&
    (input.startsWith('http://') || input.startsWith('https://'))
  ) {
    return input;
  }

  const format = 'image/png';
  const maxWidth = assetType === 'logo' ? 400 : 400;
  const maxHeight = assetType === 'logo' ? 400 : 200;

  const { blob, mimeType, dataUrl } = await optimizeImageBlob(input, {
    format,
    maxWidth,
    maxHeight,
    quality: 0.85,
  });

  try {
    const ext = 'png';
    const timestamp = Date.now();
    const storagePath = `users/${userId}/brandKits/${kitId}/${assetType}_${timestamp}.png`;
    const storageRef = ref(storage, storagePath);

    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: mimeType,
      customMetadata: {
        ownerId: userId,
        brandKitId: kitId,
        assetType,
      },
    });

    return await getDownloadURL(snapshot.ref);
  } catch (storageErr) {
    console.warn(`[AssetStorage] BrandKit storage upload fallback:`, storageErr);
    return dataUrl;
  }
}

/**
 * Migration & Sanitization pipeline:
 * Scans a CardData object for any legacy or newly attached Base64 image payloads,
 * uploads each to Firebase Storage, replaces the payload with clean permanent URLs,
 * and verifies document limits.
 */
export async function migrateCardAssetsToStorage(card: CardData, userId: string): Promise<CardData> {
  const cardId = card.id;
  const updated: CardData = { ...card };

  // 1. Process card.photoUrl
  if (updated.photoUrl && isBase64DataUrl(updated.photoUrl)) {
    try {
      updated.photoUrl = await uploadCardAsset(updated.photoUrl, userId, cardId, 'photo');
    } catch (err) {
      console.warn('Failed to upload card photo to Firebase Storage:', err);
    }
  }

  // 2. Process card.logoUrl
  if (updated.logoUrl && isBase64DataUrl(updated.logoUrl)) {
    try {
      updated.logoUrl = await uploadCardAsset(updated.logoUrl, userId, cardId, 'logo');
    } catch (err) {
      console.warn('Failed to upload card logo to Firebase Storage:', err);
    }
  }

  // 3a. Process card.studentSignatureUrl
  if (updated.studentSignatureUrl && isBase64DataUrl(updated.studentSignatureUrl)) {
    try {
      updated.studentSignatureUrl = await uploadCardAsset(updated.studentSignatureUrl, userId, cardId, 'student_signature');
    } catch (err) {
      console.warn('Failed to upload student signature to Firebase Storage:', err);
    }
  }

  // 3b. Process card.principalSignatureUrl
  if (updated.principalSignatureUrl && isBase64DataUrl(updated.principalSignatureUrl)) {
    try {
      updated.principalSignatureUrl = await uploadCardAsset(updated.principalSignatureUrl, userId, cardId, 'principal_signature');
    } catch (err) {
      console.warn('Failed to upload principal signature to Firebase Storage:', err);
    }
  }

  // 3c. Process legacy card.signatureUrl
  if (updated.signatureUrl && isBase64DataUrl(updated.signatureUrl)) {
    try {
      updated.signatureUrl = await uploadCardAsset(updated.signatureUrl, userId, cardId, 'signature');
    } catch (err) {
      console.warn('Failed to upload legacy card signature to Firebase Storage:', err);
    }
  }

  // 4. Process fieldValues for embedded images
  if (updated.fieldValues) {
    const nextFieldValues: Record<string, string> = { ...updated.fieldValues };
    for (const [key, val] of Object.entries(nextFieldValues)) {
      if (val && isBase64DataUrl(val)) {
        try {
          const typeTag = key.toLowerCase().includes('student')
            ? 'student_signature'
            : key.toLowerCase().includes('principal') || key.toLowerCase().includes('authorized')
            ? 'principal_signature'
            : 'element';
          nextFieldValues[key] = await uploadCardAsset(val, userId, cardId, typeTag);
        } catch (err) {
          console.warn(`Failed to upload field image ${key}:`, err);
        }
      }
    }
    // Synchronize uploaded URLs back to fieldValues
    if (updated.studentSignatureUrl) {
      nextFieldValues['studentSignature'] = updated.studentSignatureUrl;
    }
    if (updated.principalSignatureUrl) {
      nextFieldValues['principalSignature'] = updated.principalSignatureUrl;
    }
    updated.fieldValues = nextFieldValues;
  }

  // 5. Process card.elementsFront & card.elementsBack independently
  const normalized = normalizeCardElements(updated);
  
  const processElementList = async (elements: CardElement[]): Promise<CardElement[]> => {
    const nextElements: CardElement[] = [];
    for (let i = 0; i < elements.length; i++) {
      const el = { ...elements[i] };
      const elType = el.type;

      // Check element content if Base64
      if (el.content && isBase64DataUrl(el.content)) {
        try {
          const typeTag =
            elType === 'photo'
              ? 'photo'
              : elType === 'logo'
              ? 'logo'
              : elType === 'signature'
              ? 'signature'
              : 'element';
          el.content = await uploadCardAsset(el.content, userId, cardId, typeTag);
        } catch (err) {
          console.warn(`Failed to upload element[${i}] content:`, err);
        }
      }

      // Check element background-image style if Base64
      if (el.style?.backgroundImage && isBase64DataUrl(el.style.backgroundImage)) {
        try {
          const uploadedBg = await uploadCardAsset(el.style.backgroundImage, userId, cardId, 'background');
          el.style = { ...el.style, backgroundImage: uploadedBg };
        } catch (err) {
          console.warn(`Failed to upload element[${i}] backgroundImage:`, err);
        }
      }

      nextElements.push(el);
    }
    return nextElements;
  };

  updated.elementsFront = await processElementList(normalized.elementsFront);
  updated.elementsBack = await processElementList(normalized.elementsBack);
  updated.elements = [...updated.elementsFront, ...updated.elementsBack];

  // Final document size verification before returning
  validateCardDocumentSize(updated);

  return updated;
}

/**
 * Migration & Sanitization pipeline for Brand Kits:
 * Converts Base64 logo/signature into Firebase Storage URLs.
 */
export async function migrateBrandKitAssetsToStorage(kit: BrandKit, userId: string): Promise<BrandKit> {
  const kitId = kit.id || `bk_${Date.now()}`;
  const updated: BrandKit = { ...kit, id: kitId };

  if (updated.logoUrl && isBase64DataUrl(updated.logoUrl)) {
    try {
      updated.logoUrl = await uploadBrandKitAsset(updated.logoUrl, userId, kitId, 'logo');
    } catch (err) {
      console.warn('Failed to upload brand kit logo to Firebase Storage:', err);
    }
  }

  if (updated.signatureUrl && isBase64DataUrl(updated.signatureUrl)) {
    try {
      updated.signatureUrl = await uploadBrandKitAsset(updated.signatureUrl, userId, kitId, 'signature');
    } catch (err) {
      console.warn('Failed to upload brand kit signature to Firebase Storage:', err);
    }
  }

  return updated;
}
