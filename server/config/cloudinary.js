import cloudinaryPkg from 'cloudinary';
import { env } from './env.js';

const cloudinary = cloudinaryPkg.v2;
let configuredFor = '';

/** The Cloudinary client, configured from the environment, or null when not set up. */
export function getCloudinary() {
  const cfg = env.cloudinary;
  if (!cfg) return null;
  if (configuredFor !== cfg.cloudName + cfg.apiKey) {
    cloudinary.config({ cloud_name: cfg.cloudName, api_key: cfg.apiKey, api_secret: cfg.apiSecret, secure: true });
    configuredFor = cfg.cloudName + cfg.apiKey;
  }
  return cloudinary;
}
