import { createClient } from "@supabase/supabase-js";

// Client-side Supabase client for file uploads
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Configuration
const BUCKET_NAME = "question-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

/**
 * Validates an image file before upload
 * @param {File} file - The file to validate
 * @returns {object} - {valid: boolean, error?: string}
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "File must be an image (JPEG, PNG, GIF, or WebP)",
    };
  }

  return { valid: true };
}

/**
 * Generates a unique filename for uploaded images
 * @param {string} originalName - Original filename
 * @param {string} prefix - Prefix for the filename (e.g., 'question', 'choice')
 * @returns {string} - Unique filename
 */
export function generateUniqueFilename(originalName, prefix = "image") {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop();
  return `${prefix}_${timestamp}_${random}.${extension}`;
}

/**
 * Verifies storage bucket configuration
 * @returns {Promise<object>} - {success: boolean, error?: string}
 */
export async function verifyStorageBucket() {
  try {
    // Try to list bucket contents (this will fail if bucket doesn't exist)
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list("", {
      limit: 1,
    });

    if (error) {
      return {
        success: false,
        error: `Storage bucket '${BUCKET_NAME}' error: ${error.message}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Storage verification failed: ${error.message}`,
    };
  }
}

/**
 * Uploads an image to Supabase Storage
 * @param {File} file - The image file to upload
 * @param {string} folder - The folder within the bucket ('questions' or 'choices')
 * @param {string} prefix - Prefix for the filename
 * @returns {Promise<object>} - {success: boolean, url?: string, error?: string}
 */
export async function uploadImage(
  file,
  folder = "questions",
  prefix = "image"
) {
  try {
    // Validate file first
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate unique filename
    const filename = generateUniqueFilename(file.name, prefix);
    const filePath = `${folder}/${filename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      // Provide more specific error messages
      if (error.message?.includes("duplicate")) {
        return {
          success: false,
          error: "File already exists. Please try again.",
        };
      } else if (error.message?.includes("policy")) {
        return {
          success: false,
          error: "Storage permission denied. Please check bucket policies.",
        };
      } else if (error.message?.includes("not found")) {
        return {
          success: false,
          error: "Storage bucket not found. Please check configuration.",
        };
      }
      return { success: false, error: `Upload failed: ${error.message}` };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return { success: false, error: "Failed to generate public URL" };
    }

    // Verify the URL is properly formatted
    const publicUrl = urlData.publicUrl;
    if (!publicUrl.includes("/storage/v1/object/public/")) {
      return {
        success: false,
        error: "Invalid public URL format. Check bucket permissions.",
      };
    }

    return {
      success: true,
      url: publicUrl,
      path: filePath,
    };
  } catch (error) {
    return { success: false, error: `Upload failed: ${error.message}` };
  }
}

/**
 * Deletes an image from Supabase Storage
 * @param {string} filePath - The path of the file to delete
 * @returns {Promise<object>} - {success: boolean, error?: string}
 */
export async function deleteImage(filePath) {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      return { success: false, error: `Delete failed: ${error.message}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Delete failed due to unexpected error" };
  }
}

/**
 * Extracts file path from Supabase Storage URL
 * @param {string} url - The public URL
 * @returns {string|null} - The file path or null if invalid URL
 */
export function extractFilePathFromUrl(url) {
  if (!url) return null;

  try {
    // Supabase storage URLs format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const bucketIndex = pathParts.indexOf(BUCKET_NAME);

    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
      return pathParts.slice(bucketIndex + 1).join("/");
    }

    return null;
  } catch (error) {
    console.error("[IMAGE UTILS] Invalid URL:", url);
    return null;
  }
}

/**
 * Creates a preview URL for a File object
 * @param {File} file - The file to create preview for
 * @returns {string} - Object URL for preview
 */
export function createPreviewUrl(file) {
  return URL.createObjectURL(file);
}

/**
 * Revokes a preview URL to free up memory
 * @param {string} url - The object URL to revoke
 */
export function revokePreviewUrl(url) {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
