import React, { useState, useRef, useEffect } from "react";
import {
  uploadImage,
  deleteImage,
  validateImageFile,
  createPreviewUrl,
  revokePreviewUrl,
  extractFilePathFromUrl,
} from "@/utils/imageUpload";
import styles from "./ImageUpload.module.css";

export default function ImageUpload({
  currentImageUrl,
  onImageChange,
  folder = "questions",
  prefix = "image",
  placeholder = "Drop image here or click to upload",
  className = "",
  disabled = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [showUploader, setShowUploader] = useState(!!currentImageUrl); // Show if there's already an image
  const fileInputRef = useRef(null);

  // Sync with currentImageUrl prop changes
  useEffect(() => {
    setPreviewUrl(currentImageUrl);
    setShowUploader(!!currentImageUrl);
  }, [currentImageUrl]);

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Process selected file
  const handleFile = async (file) => {
    setError("");

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Create preview
    const preview = createPreviewUrl(file);
    setPreviewUrl(preview);
    setUploading(true);

    try {
      // Upload file
      const result = await uploadImage(file, folder, prefix);

      if (result.success) {
        // Clean up preview URL
        revokePreviewUrl(preview);

        // Update with final URL
        setPreviewUrl(result.url);
        onImageChange(result.url);
      } else {
        setError(`Upload failed: ${result.error}`);
        // Revert to previous image or no image
        setPreviewUrl(currentImageUrl || "");
        revokePreviewUrl(preview);
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error?.message || "Upload failed";
      setError(`Upload error: ${errorMessage}`);
      setPreviewUrl(currentImageUrl || "");
      revokePreviewUrl(preview);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle remove image
  const handleRemove = async () => {
    if (currentImageUrl) {
      // Try to delete from storage
      const filePath = extractFilePathFromUrl(currentImageUrl);
      if (filePath) {
        await deleteImage(filePath);
      }
    }

    // Clean up preview if it's a blob URL
    if (previewUrl && previewUrl.startsWith("blob:")) {
      revokePreviewUrl(previewUrl);
    }

    setPreviewUrl("");
    onImageChange("");
    setError("");
    setShowUploader(false); // Hide uploader after removing image
  };

  // Handle click to open file dialog
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`${styles.imageUpload} ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Show Add Image Button or Upload Area */}
      {!showUploader && !previewUrl ? (
        <button
          type="button"
          className={`${styles.addImageBtn} ${disabled ? styles.disabled : ""}`}
          onClick={disabled ? undefined : () => setShowUploader(true)}
          disabled={disabled}
        >
          + Add Image
        </button>
      ) : (
        <>
          {/* Upload Area */}
          <div
            className={`${styles.uploadArea} ${
              dragActive ? styles.dragActive : ""
            } ${previewUrl ? styles.hasImage : ""} ${
              disabled ? styles.disabled : ""
            }`}
            onDragEnter={disabled ? undefined : handleDrag}
            onDragLeave={disabled ? undefined : handleDrag}
            onDragOver={disabled ? undefined : handleDrag}
            onDrop={disabled ? undefined : handleDrop}
            onClick={disabled ? undefined : handleClick}
          >
            {/* Upload content */}
            {previewUrl ? (
              <div className={styles.imagePreview}>
                <img src={previewUrl} alt="Preview" />
                {uploading && (
                  <div className={styles.uploadingOverlay}>
                    <div className={styles.spinner}></div>
                    <span>Uploading...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.uploadPlaceholder}>
                <div className={styles.uploadIcon}>📸</div>
                <div className={styles.uploadText}>{placeholder}</div>
                <div className={styles.uploadSubtext}>
                  JPEG, PNG, GIF, WebP (max 5MB)
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          {!disabled && (
            <div className={styles.imageControls}>
              {previewUrl && !uploading && (
                <>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={handleRemove}
                  >
                    Remove Image
                  </button>
                  <button
                    type="button"
                    className={styles.replaceBtn}
                    onClick={handleClick}
                  >
                    Replace Image
                  </button>
                </>
              )}

              {!previewUrl && (
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowUploader(false)}
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Error message */}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
