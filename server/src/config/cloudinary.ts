import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isCloudinaryConfigured = Boolean(
  cloudName &&
  apiKey &&
  apiSecret &&
  cloudName !== 'your_cloudinary_cloud_name' &&
  apiKey !== 'your_cloudinary_api_key'
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Uploads a file buffer to Cloudinary or falls back to local uploads directory in local dev
 */
export const uploadFileBuffer = async (
  buffer: Buffer,
  filename: string,
  folder = 'anchor_ai_documents'
): Promise<UploadResult> => {
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'raw',
          public_id: `${Date.now()}-${path.parse(filename).name}`,
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Cloudinary upload returned empty response'));
            return;
          }
          resolve({
            url: result.secure_url || result.url,
            publicId: result.public_id,
          });
        }
      );
      uploadStream.end(buffer);
    });
  }

  // Local storage fallback for development
  const localUploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
  }

  const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filePath = path.join(localUploadDir, safeFilename);
  fs.writeFileSync(filePath, buffer);

  const localUrl = `/uploads/${safeFilename}`;
  return {
    url: localUrl,
    publicId: safeFilename,
  };
};
