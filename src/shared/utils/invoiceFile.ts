import { NativeModules, Platform, Share } from 'react-native';

const { InvoiceFileModule } = NativeModules;

export interface SaveToDownloadsResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface SharePdfResult {
  success: boolean;
  error?: string;
}

/**
 * Saves a base64 encoded PDF directly into the device's public Downloads directory on Android.
 * On iOS, falls back to the native Share Sheet (which provides "Save to Files").
 */
export const saveInvoiceToDownloads = async (
  base64Data: string,
  fileName: string,
  mimeType: string = 'application/pdf',
): Promise<SaveToDownloadsResult> => {
  const effectiveFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

  if (Platform.OS === 'android' && InvoiceFileModule?.saveToDownloads) {
    try {
      const filePath = await InvoiceFileModule.saveToDownloads(
        base64Data,
        effectiveFileName,
        mimeType,
      );
      return { success: true, filePath };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to save file to Downloads directory.',
      };
    }
  }

  // iOS fallback: Native Share Sheet with Save to Files
  try {
    const dataUrl = base64Data.startsWith('data:')
      ? base64Data
      : `data:${mimeType};base64,${base64Data}`;

    await Share.share({
      title: effectiveFileName,
      url: dataUrl,
    });
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to save invoice.',
    };
  }
};

/**
 * Shares an actual PDF file directly to apps (WhatsApp, Mail, Drive, Bluetooth, etc.)
 * using Android's FileProvider. On iOS, uses the native UIActivityViewController with the PDF.
 */
export const shareInvoicePdf = async (
  base64Data: string,
  fileName: string,
  chooserTitle: string = 'Share Invoice PDF',
  summaryText?: string,
): Promise<SharePdfResult> => {
  const effectiveFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

  if (Platform.OS === 'android' && InvoiceFileModule?.sharePdfFile) {
    try {
      await InvoiceFileModule.sharePdfFile(
        base64Data,
        effectiveFileName,
        chooserTitle,
        summaryText || null,
      );
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to share invoice PDF.',
      };
    }
  }

  // iOS fallback
  try {
    const dataUrl = base64Data.startsWith('data:')
      ? base64Data
      : `data:application/pdf;base64,${base64Data}`;

    await Share.share({
      title: effectiveFileName,
      message: summaryText,
      url: dataUrl,
    });
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to share invoice.',
    };
  }
};

/**
 * Opens the PDF directly in the device's default PDF viewer (e.g. Google Drive PDF Viewer).
 */
export const openInvoicePdf = async (
  base64Data: string,
  fileName: string,
): Promise<{ success: boolean; error?: string }> => {
  const effectiveFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

  if (Platform.OS === 'android' && InvoiceFileModule?.openPdfFile) {
    try {
      await InvoiceFileModule.openPdfFile(base64Data, effectiveFileName);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to open invoice PDF.',
      };
    }
  }

  return shareInvoicePdf(base64Data, effectiveFileName);
};
