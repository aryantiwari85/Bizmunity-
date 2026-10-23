import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';
import { compressImage } from '../utils/imageCompressor';

/**
 * Uploads a profile photo or media to Firebase Storage and returns the permanent download URL.
 * Falls back gracefully to optimized compressed image if Storage bucket permissions fail.
 */
export async function uploadImageToStorage(
  fileOrBase64: File | string,
  path: string
): Promise<string> {
  try {
    let blob: Blob;

    if (typeof fileOrBase64 === 'string') {
      // It's a data URI or base64
      if (fileOrBase64.startsWith('http')) {
        return fileOrBase64;
      }
      const compressed = await compressImage(fileOrBase64, 800, 800, 0.85);
      const res = await fetch(compressed);
      blob = await res.blob();
    } else {
      // It's a File
      blob = fileOrBase64;
    }

    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: blob.type || 'image/jpeg',
    });

    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.warn('Firebase Storage upload warning, using optimized local URI:', error);
    // If Storage bucket is not enabled or CORS-restricted, return the optimized compressed base64
    if (typeof fileOrBase64 === 'string') {
      return await compressImage(fileOrBase64, 400, 400, 0.8);
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const compressed = await compressImage(reader.result as string, 400, 400, 0.8);
        resolve(compressed);
      };
      reader.readAsDataURL(fileOrBase64);
    });
  }
}

/**
 * Uploads user profile avatar to Firebase Storage: avatars/{uid}/profile.jpg
 */
export async function uploadProfileAvatar(uid: string, fileOrDataUrl: File | string): Promise<string> {
  const path = `avatars/${uid}/avatar_${Date.now()}.jpg`;
  return await uploadImageToStorage(fileOrDataUrl, path);
}
