/**
 * @file videoUtils.ts
 * @description Các hàm tiện ích xử lý video (lấy thumbnail, v.v.).
 */

/**
 * Tạo đường dẫn (URL) ảnh đại diện (thumbnail) từ URL video.
 * @param videoUrl URL của video gốc.
 * @param localPath Đường dẫn video cục bộ (tùy chọn).
 * @returns URL ảnh đại diện (thumbnail) nếu thành công, hoặc null.
 */
export function getVideoThumbnailUri(videoUrl?: string | null, localPath?: string | null): string | null {
  if (videoUrl) {
    return videoUrl.replace(/\.(mp4|webm|mov)$/i, '.jpg').replace('/upload/', '/upload/c_thumb,w_400,h_400/');
  }
  return null;
}
