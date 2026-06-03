/**
 * videoService — Local Video Recorder Service.
 * 
 * Manages local recording state, absolute path naming conventions,
 * and local storage using expo-file-system.
 * 
 * Rules:
 *   - Video is recorded locally and then uploaded to the cloud (Firebase Storage).
 *   - Local files are stored in the project's videos directory in development, or standard app sandbox in production.
 *   - Public cloud URLs are retrieved and synced back to Firestore.
 */

import { documentDirectory, getInfoAsync, makeDirectoryAsync, writeAsStringAsync, deleteAsync, downloadAsync, moveAsync } from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

// Recording State
let isRecordingActive = false;
let isRecordingPaused = false;
let recordingStartTime: number | null = null;
let recordingPauseOffset = 0;
let currentAssignmentId: string | null = null;
let currentSetNumber: number = 1;

interface StopRecordingResult {
    videoPath: string;
    thumbnailPath: string;
    relativeVideoPath: string;
    relativeThumbnailPath: string;
    fileSizeMB: number;
}
let lastStopResult: StopRecordingResult | null = null;

/**
 * Format current date to yyyyMMdd (e.g. 20260518)
 */
function getFormattedDate(): string {
    const date = new Date();
    const yyyy = date.getFullYear().toString();
    const mm = (date.getMonth() + 1).toString().padStart(2, "0");
    const dd = date.getDate().toString().padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
}

/**
 * Construct absolute internal storage directory path depending on platform.
 */
export function getLocalVideoDirectory(): string {
    if (Platform.OS === 'web') {
    // Relative path to project folder when running on web (Vite/Webpack)
        return './videos/';
    }

    // Use a nice readable directory inside the project workspace as default fallback when not running on iOS/Android
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        return 'file:///e:/ui/project/telephysio-ai/telephysio-ai-mobile/videos/';
    }

    // Use expo-file-system document directory which is safe and app-specific on mobile devices
    const baseDir = documentDirectory || "file:///data/user/0/com.telephysio.app/files/";
    return `${baseDir}Telephysio/Videos/`;
}

/**
 * Retrieve the active temporary recording path for an assignment.
 */
export function getTemporaryVideoPath(assignmentId: string): string {
    const dateStr = getFormattedDate();
    const dir = getLocalVideoDirectory();
    return `${dir}${assignmentId}_${dateStr}_temp.mp4`;
}

/**
 * Ensure the directory exists
 */
async function ensureDirectoryExists(dir: string) {
    try {
        const dirInfo = await getInfoAsync(dir);
        if (!dirInfo.exists) {
            await makeDirectoryAsync(dir, { intermediates: true });
        }
    } catch (err) {
        console.warn("[VideoService] Failed to create directory:", err);
    }
}

/**
 * Bắt đầu quay video — Gọi khi buổi tập bắt đầu (nếu người dùng bật toggle).
 * Trả về absolute path tạm thời để lưu vào IncompleteSession.videoPath.
 * 
 * @param assignmentId ID của bài tập được giao
 * @param setNumber Optional set number for the recording (defaults to 1)
 */
export async function startRecording(assignmentId: string, setNumber: number = 1): Promise<string> {
  console.log(`[VideoService] startRecording called for assignmentId: ${assignmentId}, set: ${setNumber}`);

  isRecordingActive = true;
  isRecordingPaused = false;
  recordingStartTime = Date.now();
  recordingPauseOffset = 0;
  currentAssignmentId = assignmentId;
  currentSetNumber = setNumber;
  lastStopResult = null;

  // On web, the actual recording is handled by MediaRecorder inside the pose-html iframe.
  // We only track state here. No file system operations needed.
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    console.log("[VideoService] Web platform: sending START_RECORDING to iframe.");
    const iframeWindow = (window as any).__poseIframe;
    if (iframeWindow) {
      try {
        iframeWindow.postMessage(JSON.stringify({ type: 'START_RECORDING' }), '*');
      } catch (err) {
        console.warn("[VideoService] Failed to send START_RECORDING to iframe:", err);
      }
    }
    return '';
  }

  const dateStr = getFormattedDate();
  const dir = getLocalVideoDirectory();
  await ensureDirectoryExists(dir);
  const tempPath = `${dir}${assignmentId}_set${setNumber}_${dateStr}_temp.mp4`;

    console.log(`[VideoService] Active recording started. Temp path: ${tempPath}`);
    return tempPath;
}

/**
 * Tạm dừng quay video — Gọi khi buổi tập bị Pause.
 */
export function pauseRecording(): void {
    if (!isRecordingActive || isRecordingPaused) return;

    console.log("[VideoService] pauseRecording called");
    isRecordingPaused = true;
    if (recordingStartTime !== null) {
        recordingPauseOffset += Date.now() - recordingStartTime;
        recordingStartTime = null;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const iframeWindow = (window as any).__poseIframe;
        if (iframeWindow) {
            try {
                iframeWindow.postMessage(JSON.stringify({ type: 'PAUSE_RECORDING' }), '*');
                console.log("[VideoService] Sent PAUSE_RECORDING to pose-html iframe");
            } catch (err) {
                console.warn("[VideoService] Failed to send PAUSE_RECORDING to iframe:", err);
            }
        }
    }
}

/**
 * Tiếp tục quay video — Gọi khi buổi tập được Resume.
 */
export function resumeRecording(): void {
    if (!isRecordingActive || !isRecordingPaused) return;

    console.log("[VideoService] resumeRecording called");
    isRecordingPaused = false;
    recordingStartTime = Date.now();

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const iframeWindow = (window as any).__poseIframe;
        if (iframeWindow) {
            try {
                iframeWindow.postMessage(JSON.stringify({ type: 'RESUME_RECORDING' }), '*');
                console.log("[VideoService] Sent RESUME_RECORDING to pose-html iframe");
            } catch (err) {
                console.warn("[VideoService] Failed to send RESUME_RECORDING to iframe:", err);
            }
        }
    }
}

/**
 * Kết thúc quay video, flush buffer ra .mp4 và tạo thumbnail.
 * Trả về các absolute path của video, thumbnail và dung lượng file (MB).
 */
export async function stopRecording(): Promise<StopRecordingResult> {
    console.log("[VideoService] stopRecording called");

    if (!isRecordingActive) {
        if (lastStopResult) {
            console.log("[VideoService] stopRecording: Recording already stopped, returning last saved stop result:", lastStopResult);
            return lastStopResult;
        }
        return {
            videoPath: "",
            thumbnailPath: "",
            relativeVideoPath: "",
            relativeThumbnailPath: "",
            fileSizeMB: 0,
        };
    }

  // Calculate final elapsed recording duration
  let totalDurationMs = recordingPauseOffset;
  if (!isRecordingPaused && recordingStartTime !== null) {
    totalDurationMs += Date.now() - recordingStartTime;
  }
  const durationSec = Math.round(totalDurationMs / 1000);
  const assignmentId = currentAssignmentId || "asgn_temp";
  const setNumber = currentSetNumber;
  const dateStr = getFormattedDate();

  // Relative paths for Firestore reference
  const relativeVideoPath = `videos/${assignmentId}_set${setNumber}_${dateStr}.mp4`;
  const relativeThumbnailPath = `videos/${assignmentId}_set${setNumber}_${dateStr}_thumb.jpg`;

    // Reset internal state
    isRecordingActive = false;
    isRecordingPaused = false;
    recordingStartTime = null;
    recordingPauseOffset = 0;
    currentAssignmentId = null;

    // ── WEB PATH ──────────────────────────────────────────────────────────────
    // On web, the video was recorded by MediaRecorder inside the pose-html iframe.
    // The ArrayBuffer was transferred to the parent window and a blob URL was created
    // in PoseEstimationView.web.tsx. We just read it from the global dictionary.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const iframeWindow = (window as any).__poseIframe;
        if (iframeWindow) {
            try {
                // Clear any previous recorded URL
                (window as any).__lastRecordedVideoUrl = "";
                if ((window as any).__recordedVideos) {
                    (window as any).__recordedVideos['latest'] = "";
                }

                iframeWindow.postMessage(JSON.stringify({ type: 'STOP_RECORDING' }), '*');
                console.log("[VideoService] Sent STOP_RECORDING to pose-html iframe");
            } catch (err) {
                console.warn("[VideoService] Failed to send STOP_RECORDING to iframe:", err);
            }
        }

        // Now, poll for the blob URL to resolve (for up to 2.5 seconds)
        const startTime = Date.now();
        let webBlobUrl = "";
        while (Date.now() - startTime < 2500) {
            webBlobUrl = (window as any).__recordedVideos?.['latest'] || (window as any).__lastRecordedVideoUrl || "";
            if (webBlobUrl) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        if (webBlobUrl) {
            console.log("[VideoService] stopRecording (web): Found recorded blob URL:", webBlobUrl);
            // Map all possible keys to the blob URL for player screens
            (window as any).__recordedVideos = (window as any).__recordedVideos || {};
            (window as any).__recordedVideos[relativeVideoPath] = webBlobUrl;
        } else {
            console.warn("[VideoService] stopRecording (web): No recorded blob URL found! Recording may have failed.");
        }

        const estimatedSizeMB = parseFloat((Math.max(1, durationSec) * 1.5).toFixed(2));
        const result = {
            videoPath: webBlobUrl,
            thumbnailPath: "",
            relativeVideoPath,
            relativeThumbnailPath,
            fileSizeMB: estimatedSizeMB,
        };
        lastStopResult = result;
        return result;
    }

    // ── NATIVE PATH ───────────────────────────────────────────────────────────
    const dir = getLocalVideoDirectory();
    await ensureDirectoryExists(dir);

    const videoPath = `${dir}${assignmentId}_${dateStr}.mp4`;
    const thumbnailPath = `${dir}${assignmentId}_${dateStr}_thumb.jpg`;
    const tempPath = `${dir}${assignmentId}_${dateStr}_temp.mp4`;

    const simulatedSizeMB = parseFloat((Math.max(1, durationSec) * 1.5).toFixed(2));

  // ── NATIVE PATH ───────────────────────────────────────────────────────────
  const dir = getLocalVideoDirectory();
  await ensureDirectoryExists(dir);

  const videoPath = `${dir}${assignmentId}_set${setNumber}_${dateStr}.mp4`;
  const thumbnailPath = `${dir}${assignmentId}_set${setNumber}_${dateStr}_thumb.jpg`;
  const tempPath = `${dir}${assignmentId}_set${setNumber}_${dateStr}_temp.mp4`;

  const simulatedSizeMB = parseFloat((Math.max(1, durationSec) * 1.5).toFixed(2));

  try {
    // Create thumbnail placeholder
        const base64Black1x1 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
        await writeAsStringAsync(thumbnailPath, base64Black1x1, { encoding: 'base64' as any });

        // Check if the temporary recording file exists
        const tempInfo = await getInfoAsync(tempPath);
        if (tempInfo.exists) {
            console.log(`[VideoService] Temp file exists. Moving to: ${videoPath}`);
            await moveAsync({ from: tempPath, to: videoPath });
        } else {
            console.warn(`[VideoService] Temp recording file not found at: ${tempPath}`);
        }

        // Get size of the final file
        const fileInfo = await getInfoAsync(videoPath);
        let finalSizeMB = simulatedSizeMB;
        if (fileInfo && fileInfo.exists) {
            finalSizeMB = parseFloat((fileInfo.size / (1024 * 1024)).toFixed(2));
        }

        console.log(`[VideoService] Recording saved:\n- ${videoPath} (${finalSizeMB}MB)\n- ${thumbnailPath}`);

        const result = {
            videoPath,
            thumbnailPath,
            relativeVideoPath,
            relativeThumbnailPath,
            fileSizeMB: finalSizeMB,
        };
        lastStopResult = result;
        return result;
    } catch (err) {
        console.error("[VideoService] Failed to process recording files:", err);

        const result = {
            videoPath,
            thumbnailPath,
            relativeVideoPath,
            relativeThumbnailPath,
            fileSizeMB: simulatedSizeMB,
        };
        lastStopResult = result;
        return result;
    }
}

/**
 * Xoá file video và thumbnail khỏi local disk.
 * 
 * @param videoPath Đường dẫn absolute tới video mp4
 * @param thumbnailPath Đường dẫn absolute tới thumbnail jpg
 */
export async function deleteLocalVideo(
    videoPath: string,
    thumbnailPath: string
): Promise<void> {
    console.log(`[VideoService] deleteLocalVideo called for: \n  Video: ${videoPath}\n  Thumb: ${thumbnailPath}`);

    try {
        const videoInfo = await getInfoAsync(videoPath);
        if (videoInfo.exists) {
            await deleteAsync(videoPath);
            console.log("[VideoService] Physical video file DELETED");
        }

        const thumbInfo = await getInfoAsync(thumbnailPath);
        if (thumbInfo.exists) {
            await deleteAsync(thumbnailPath);
            console.log("[VideoService] Physical thumbnail file DELETED");
        }
    } catch (err) {
        console.error("[VideoService] Failed to delete local files:", err);
    }
}

/**
 * Uploads a local video file from absolute URI to Cloudinary
 * and returns the public download URL.
 */
export async function uploadVideoToCloudinary(
  localFileUri: string,
  sessionId: string
): Promise<string> {
  console.log(`[VideoService] Uploading video to Cloudinary. Local URI: ${localFileUri}`);
  try {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary config missing in .env");
    }
    
    let fileToUpload: any;
    if (Platform.OS === 'web') {
      // Trên Web, localFileUri là một blob URL. Ta cần fetch nó để lấy Blob object thật.
      const fetchResponse = await fetch(localFileUri);
      fileToUpload = await fetchResponse.blob();
    } else {
      // Trên Mobile (iOS/Android), ta truyền object với thuộc tính uri
      fileToUpload = {
        uri: localFileUri,
        type: 'video/mp4',
        name: `${sessionId}.mp4`,
      };
    }
    
    const formData = new FormData();
    formData.append('file', fileToUpload);
    
    formData.append('upload_preset', uploadPreset);
    // Chú ý: Unsigned upload không cho phép gửi public_id từ client. 
    // Cloudinary sẽ tự tạo tên file ngẫu nhiên hoặc bạn có thể config folder trong Preset.
    // formData.append('api_key', '747817445469264'); // Không nên dùng trên client

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to upload to Cloudinary');
    }

    console.log(`[VideoService] Video upload success! Public URL: ${data.secure_url}`);
    
    // Return original secure_url to prevent black screen while Cloudinary transcodes f_auto
    return data.secure_url;
  } catch (err) {
    console.error("[VideoService] Failed to upload video to Cloudinary:", err);
    throw err;
  }
}

/**
 * Uploads a local thumbnail image from absolute URI to Cloudinary
 * and returns the public download URL.
 */
export async function uploadThumbnailToCloudinary(
  localFileUri: string,
  sessionId: string
): Promise<string> {
  console.log(`[VideoService] Uploading thumbnail to Cloudinary. Local URI: ${localFileUri}`);
  try {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary config missing in .env");
    }
    
    let fileToUpload: any;
    if (Platform.OS === 'web') {
      const fetchResponse = await fetch(localFileUri);
      fileToUpload = await fetchResponse.blob();
    } else {
      fileToUpload = {
        uri: localFileUri,
        type: 'image/jpeg',
        name: `${sessionId}_thumb.jpg`,
      };
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);
    
    formData.append('upload_preset', uploadPreset);
    // Bỏ public_id vì Unsigned upload không cho phép gửi thông số này

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to upload to Cloudinary');
    }

    console.log(`[VideoService] Thumbnail upload success! Public URL: ${data.secure_url}`);
    
    // Tự động crop thành dạng vuông như trong snippet yêu cầu
    const autoCropUrl = data.secure_url.replace('/upload/', '/upload/c_auto,g_auto,w_500,h_500,f_auto,q_auto/');
    
    return autoCropUrl;
  } catch (err) {
    console.warn("[VideoService] Failed to upload thumbnail to Cloudinary:", err);
    // Return empty string or fallback on error, don't crash the session flow for a thumbnail
    return "";
  }
}


import { SetRecord } from './types';
import { db } from './config';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

export async function uploadSetsVideosInBackground(
  uid: string,
  assignmentId: string,
  exerciseIndex: number,
  setsRecords: SetRecord[],
  recordVideo: boolean
) {
  if (!recordVideo) return;

  const uploadPromises = setsRecords.map(async (set) => {
    if (!set.videoLocalPath) return set;
    try {
      const uploadId = `${assignmentId}_ex${exerciseIndex}_set${set.setNumber}_${Date.now()}`;
      const url = await uploadVideoToCloudinary(set.videoLocalPath, uploadId);
      return { ...set, videoUrl: url };
    } catch (err) {
      console.error(`Failed to upload set ${set.setNumber}`, err);
      return set;
    }
  });

  const updatedSets = await Promise.all(uploadPromises);

  try {
    const incQuery = query(collection(db, 'incomplete_sessions'), where('patientId', '==', uid), where('assignmentId', '==', assignmentId));
    const incSnap = await getDocs(incQuery);
    if (!incSnap.empty) {
      const docRef = incSnap.docs[0].ref;
      const data = incSnap.docs[0].data();
      const completedExercises = data.completedExercises || [];
      const completedExercisesData = data.completedExercisesData || [];
      if (completedExercises[exerciseIndex]) {
        completedExercises[exerciseIndex].sets = updatedSets;
        completedExercises[exerciseIndex].videoUrl = updatedSets[updatedSets.length - 1]?.videoUrl || null;
        if (completedExercisesData[exerciseIndex]) {
          completedExercisesData[exerciseIndex].sets = updatedSets;
          completedExercisesData[exerciseIndex].videoUrl = updatedSets[updatedSets.length - 1]?.videoUrl || null;
        }
        await updateDoc(docRef, { completedExercises, completedExercisesData });
        console.log(`[VideoService] Background upload updated IncompleteSession ${docRef.id}`);
      }
    }

    const sessQuery = query(collection(db, 'sessions'), where('patientId', '==', uid), where('assignmentId', '==', assignmentId));
    const sessSnap = await getDocs(sessQuery);
    if (!sessSnap.empty) {
      const docsList = sessSnap.docs.sort((a, b) => b.data().date.toMillis() - a.data().date.toMillis());
      const docRef = docsList[0].ref;
      const data = docsList[0].data();
      const exercises = data.exercises || [];
      if (exercises[exerciseIndex]) {
        exercises[exerciseIndex].sets = updatedSets;
        exercises[exerciseIndex].videoUrl = updatedSets[updatedSets.length - 1]?.videoUrl || null;
        await updateDoc(docRef, { exercises });
        console.log(`[VideoService] Background upload updated Session ${docRef.id}`);
      }
    }
  } catch (dbErr) {
    console.error("[VideoService] Failed to update Firestore with background upload URLs:", dbErr);
  }
}
