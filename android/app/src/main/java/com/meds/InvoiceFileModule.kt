package com.meds

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileOutputStream

class InvoiceFileModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "InvoiceFileModule"

    private fun cleanBase64(raw: String): ByteArray {
        val cleanString = if (raw.contains(",")) {
            raw.substringAfter(",")
        } else {
            raw
        }
        return Base64.decode(cleanString.trim(), Base64.DEFAULT)
    }

    @ReactMethod
    fun saveToDownloads(
        base64Data: String,
        fileName: String,
        mimeType: String?,
        promise: Promise
    ) {
        try {
            val bytes = cleanBase64(base64Data)
            val effectiveMime = if (mimeType.isNullOrBlank()) "application/pdf" else mimeType
            val effectiveFileName = if (fileName.endsWith(".pdf", ignoreCase = true)) {
                fileName
            } else {
                "$fileName.pdf"
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val resolver = reactContext.contentResolver
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, effectiveFileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, effectiveMime)
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                    put(MediaStore.MediaColumns.IS_PENDING, 1)
                }

                val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                    ?: throw Exception("Failed to create MediaStore entry in Downloads")

                resolver.openOutputStream(uri)?.use { outputStream ->
                    outputStream.write(bytes)
                    outputStream.flush()
                } ?: throw Exception("Failed to open output stream for Downloads URI")

                contentValues.clear()
                contentValues.put(MediaStore.MediaColumns.IS_PENDING, 0)
                resolver.update(uri, contentValues, null, null)

                promise.resolve(effectiveFileName)
            } else {
                @Suppress("DEPRECATION")
                val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                if (!downloadsDir.exists()) {
                    downloadsDir.mkdirs()
                }
                val destinationFile = File(downloadsDir, effectiveFileName)
                FileOutputStream(destinationFile).use { fos ->
                    fos.write(bytes)
                    fos.flush()
                }

                // Trigger media scanner so file appears immediately
                val mediaScanIntent = Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE).apply {
                    data = Uri.fromFile(destinationFile)
                }
                reactContext.sendBroadcast(mediaScanIntent)

                promise.resolve(destinationFile.absolutePath)
            }
        } catch (e: Exception) {
            promise.reject("SAVE_FAILED", "Failed to save invoice to Downloads: ${e.localizedMessage}", e)
        }
    }

    @ReactMethod
    fun sharePdfFile(
        base64Data: String,
        fileName: String,
        chooserTitle: String?,
        text: String?,
        promise: Promise
    ) {
        try {
            val bytes = cleanBase64(base64Data)
            val effectiveFileName = if (fileName.endsWith(".pdf", ignoreCase = true)) {
                fileName
            } else {
                "$fileName.pdf"
            }

            val cacheInvoicesDir = File(reactContext.cacheDir, "invoices").apply {
                if (!exists()) mkdirs()
            }
            val cachedFile = File(cacheInvoicesDir, effectiveFileName)
            FileOutputStream(cachedFile).use { fos ->
                fos.write(bytes)
                fos.flush()
            }

            val authority = "${reactContext.packageName}.fileprovider"
            val contentUri: Uri = FileProvider.getUriForFile(reactContext, authority, cachedFile)

            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = "application/pdf"
                putExtra(Intent.EXTRA_STREAM, contentUri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                if (!text.isNullOrBlank()) {
                    putExtra(Intent.EXTRA_TEXT, text)
                }
                putExtra(Intent.EXTRA_SUBJECT, effectiveFileName)
            }

            val chooser = Intent.createChooser(
                shareIntent,
                if (chooserTitle.isNullOrBlank()) "Share Invoice" else chooserTitle
            ).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            reactContext.startActivity(chooser)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SHARE_FAILED", "Failed to share invoice PDF: ${e.localizedMessage}", e)
        }
    }

    @ReactMethod
    fun openPdfFile(
        base64Data: String,
        fileName: String,
        promise: Promise
    ) {
        try {
            val bytes = cleanBase64(base64Data)
            val effectiveFileName = if (fileName.endsWith(".pdf", ignoreCase = true)) {
                fileName
            } else {
                "$fileName.pdf"
            }

            val cacheInvoicesDir = File(reactContext.cacheDir, "invoices").apply {
                if (!exists()) mkdirs()
            }
            val cachedFile = File(cacheInvoicesDir, effectiveFileName)
            FileOutputStream(cachedFile).use { fos ->
                fos.write(bytes)
                fos.flush()
            }

            val authority = "${reactContext.packageName}.fileprovider"
            val contentUri: Uri = FileProvider.getUriForFile(reactContext, authority, cachedFile)

            val viewIntent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(contentUri, "application/pdf")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            val chooser = Intent.createChooser(viewIntent, "Open Invoice").apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            reactContext.startActivity(chooser)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("OPEN_FAILED", "Failed to open invoice PDF: ${e.localizedMessage}", e)
        }
    }
}
