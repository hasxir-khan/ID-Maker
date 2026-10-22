/**
 * ID Maker — Centralized Production Verification URL Engine
 * 
 * Generates canonical, environment-aware HTTPS verification URLs for physical QR codes.
 * Ensures QR codes generated on localhost, CI, or preview environments point to the
 * configured public HTTPS application domain (e.g. on Vercel) so that external mobile
 * devices can scan and verify credentials seamlessly.
 */

export interface VerificationUrlConfig {
  baseUrl: string;
  isCustomUrlConfigured: boolean;
  environment: 'production' | 'preview' | 'development';
}

/**
 * Normalizes a URL by ensuring HTTPS and trimming trailing slashes.
 */
function normalizeUrl(url: string): string {
  let cleaned = url.trim().replace(/\/+$/, '');
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned;
}

/**
 * Returns the canonical public HTTPS base URL for production QR code generation.
 *
 * Precedence:
 * 1. VITE_PUBLIC_APP_URL / VITE_APP_URL (explicit Vercel / custom production domain)
 * 2. Vercel deployment URL via VITE_VERCEL_URL / VERCEL_URL (if provided)
 * 3. Live browser origin if on a public HTTPS domain (e.g. *.vercel.app)
 * 4. Fallback for local development
 */
export function getPublicAppBaseUrl(): string {
  // 1. Check explicit public environment variable (recommended for Vercel)
  const envUrl = (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PUBLIC_APP_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_PUBLIC_APP_URL) ||
    ''
  ).trim();

  if (envUrl) {
    return normalizeUrl(envUrl);
  }

  // 2. Check Vercel system environment variable if exposed to client
  const vercelUrl = (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_VERCEL_URL) ||
    ''
  ).trim();

  if (vercelUrl) {
    return normalizeUrl(vercelUrl);
  }

  // 3. In browser runtime, inspect window.location
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const hostname = window.location.hostname;

    // Detect if origin is a local loopback
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local');

    // If running on a live public domain (e.g. my-app.vercel.app), use the actual origin
    if (!isLocalhost && origin.startsWith('https://')) {
      return origin;
    }
  }

  // 4. Development mode or unconfigured production
  if (typeof import.meta !== 'undefined' && import.meta.env?.PROD) {
    console.warn(
      '[ID Maker:QR Engine] ⚠️ VITE_PUBLIC_APP_URL is not configured in production settings. ' +
      'Set VITE_PUBLIC_APP_URL in Vercel Project Settings (e.g., https://your-app.vercel.app) ' +
      'so printed cards and exported PDFs contain scannable public URLs.'
    );
  }

  // Safe fallback
  return typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://idmaker.vercel.app';
}

/**
 * Builds the canonical public verification URL for a given card ID.
 * Uses hash routing (/#verify/{cardId}) to guarantee that client-side
 * mobile scanners and camera previews route immediately to the verification
 * record on any web server or static host.
 */
export function buildCardVerificationUrl(cardId: string): string {
  const base = getPublicAppBaseUrl();
  const safeId = encodeURIComponent((cardId || '').trim());
  return `${base}/#verify/${safeId}`;
}

/**
 * Builds the clean path verification URL (/verify/{cardId}).
 * SPA rewrites in vercel.json redirect this to index.html where App.tsx parses it.
 */
export function buildCleanPathVerificationUrl(cardId: string): string {
  const base = getPublicAppBaseUrl();
  const safeId = encodeURIComponent((cardId || '').trim());
  return `${base}/verify/${safeId}`;
}

/**
 * Parses card ID from either path (/verify/:id) or hash (#verify/:id).
 */
export function parseVerificationUrl(urlOrPath: string): string | null {
  if (!urlOrPath) return null;
  
  // 1. Hash match: #verify/ID or #/verify/ID
  const hashMatch = urlOrPath.match(/#\/?verify\/([^?#]+)/);
  if (hashMatch && hashMatch[1]) {
    return decodeURIComponent(hashMatch[1]);
  }

  // 2. Path match: /verify/ID
  const pathMatch = urlOrPath.match(/\/verify\/([^?#]+)/);
  if (pathMatch && pathMatch[1]) {
    return decodeURIComponent(pathMatch[1]);
  }

  return null;
}
