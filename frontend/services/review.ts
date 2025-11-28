import { SingleReviewPayload } from '../types';

const PROXY_BASE_URL = import.meta.env.VITE_PROXY_BASE_URL || 'http://localhost:9000';

export interface ReviewOutputs {
  type?: string;
  results?: Record<string, unknown>;
  text?: string;
  content?: string;
  photo?: unknown;
  [key: string]: unknown;
}

interface ReviewServiceResponse {
  id?: string;
  status: string;
  outputs?: ReviewOutputs | null;
  error?: string;
}

export async function submitReviewRequest(payload: SingleReviewPayload): Promise<ReviewOutputs | null> {
  const formData = new FormData();
  if (payload.itemId) {
    formData.append('id', payload.itemId);
  }
  if (payload.text && payload.text.trim()) {
    formData.append('text', payload.text.trim());
  }

  const photoValue = payload.photoPath?.trim() || payload.imageUrl?.trim() || undefined;
  if (photoValue) {
    formData.append('photo', photoValue);
  }
  if (payload.imageFile) {
    formData.append('photo_file', payload.imageFile);
  }

  const response = await fetch(`${PROXY_BASE_URL}/api/review/single`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to call review service.');
  }

  const data: ReviewServiceResponse = await response.json();

  if (data.status !== 'succeeded') {
    throw new Error(data.error || 'Review engine execution failed.');
  }

  return data.outputs ?? null;
}

export const resolvePhotoUrl = (photo: unknown): string | undefined => {
  if (!photo) {
    return undefined;
  }

  if (typeof photo === 'string') {
    return photo;
  }

  if (typeof photo === 'object') {
    const photoObj = photo as Record<string, unknown>;
    if (typeof photoObj.url === 'string') {
      return photoObj.url;
    }
    if (typeof photoObj.remote_url === 'string') {
      return photoObj.remote_url;
    }
    if (typeof photoObj.preview_url === 'string') {
      return photoObj.preview_url;
    }
    if (Array.isArray(photoObj.urls) && photoObj.urls.length > 0 && typeof photoObj.urls[0] === 'string') {
      return photoObj.urls[0] as string;
    }
  }

  return undefined;
};

