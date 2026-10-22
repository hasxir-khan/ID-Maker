import QRCode from 'qrcode';
import { buildCardVerificationUrl } from './verificationUrl';

export async function generateCardQrDataUrl(
  cardId: string,
  customText?: string
): Promise<string> {
  try {
    const textToEncode = customText || buildCardVerificationUrl(cardId);
    
    return await QRCode.toDataURL(textToEncode, {
      errorCorrectionLevel: 'M',
      margin: 1,
      scale: 6,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return '';
  }
}
