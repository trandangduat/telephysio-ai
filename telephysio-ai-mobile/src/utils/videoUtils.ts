export function getVideoThumbnailUri(videoUrl?: string | null, localPath?: string | null): string | null {
  if (videoUrl) {
    return videoUrl.replace(/\.(mp4|webm|mov)$/i, '.jpg').replace('/upload/', '/upload/c_thumb,w_400,h_400/');
  }
  return null;
}
