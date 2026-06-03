/**
 * @file videoService.ts
 * @description Dịch vụ quay video và xử lý tải lên Cloudinary.
 */

/**
 * videoService - Dịch vụ Quay Video Cục bộ.
 *
 * Quản lý trạng thái ghi hình cục bộ, quy ước đặt tên đường dẫn tuyệt đối,
 * và lưu trữ cục bộ sử dụng expo-file-system.
 *
 * Quy tắc:
 *   - Video được quay cục bộ và sau đó tải lên đám mây (Firebase Storage).
 *   - Các tệp cục bộ được lưu trong thư mục videos của dự án khi đang phát triển, hoặc sandbox ứng dụng tiêu chuẩn trên môi trường sản phẩm.
 *   - Các URL đám mây công khai được lấy và đồng bộ trở lại Firestore.
 */

import {
    documentDirectory,
    getInfoAsync,
    makeDirectoryAsync,
    writeAsStringAsync,
    deleteAsync,
    downloadAsync,
    moveAsync,
} from "expo-file-system/legacy";
import { Platform } from "react-native";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";

// Trạng thái Ghi hình
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
 * Lấy ngày hiện tại theo định dạng yyyyMMdd (vd: 20260518).
 * 
 * @returns Chuỗi ngày tháng định dạng yyyyMMdd
 */
function getFormattedDate(): string {
    const date = new Date();
    const yyyy = date.getFullYear().toString();
    const mm = (date.getMonth() + 1).toString().padStart(2, "0");
    const dd = date.getDate().toString().padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
}

/**
 * Xây dựng đường dẫn thư mục lưu trữ cục bộ tuyệt đối dựa trên nền tảng (Platform).
 * 
 * @returns Đường dẫn tới thư mục lưu trữ cục bộ
 */
export function getLocalVideoDirectory(): string {
    if (Platform.OS === "web") {
        // Đường dẫn tương đối tới thư mục dự án khi chạy trên web (Vite/Webpack)
        return "./videos/";
    }

    // Sử dụng một thư mục dễ đọc bên trong không gian làm việc của dự án làm mặc định dự phòng khi không chạy trên iOS/Android
    if (Platform.OS !== "ios" && Platform.OS !== "android") {
        return "file:///e:/ui/project/telephysio-ai/telephysio-ai-mobile/videos/";
    }

    // Sử dụng thư mục tài liệu expo-file-system an toàn và dành riêng cho ứng dụng trên thiết bị di động
    const baseDir =
        documentDirectory || "file:///data/user/0/com.telephysio.app/files/";
    return `${baseDir}Telephysio/Videos/`;
}

/**
 * Lấy đường dẫn tệp video tạm thời cho một bài tập được giao.
 * 
 * @param assignmentId ID của bài tập được giao
 * @returns Đường dẫn tệp video tạm thời
 */
export function getTemporaryVideoPath(assignmentId: string): string {
    const dateStr = getFormattedDate();
    const dir = getLocalVideoDirectory();
    return `${dir}${assignmentId}_${dateStr}_temp.mp4`;
}

/**
 * Đảm bảo rằng thư mục lưu trữ đã tồn tại, nếu chưa sẽ tạo mới.
 * 
 * @param dir Đường dẫn thư mục cần kiểm tra
 * @returns Promise
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
 * @param setNumber Số thứ tự set tập luyện (mặc định là 1)
 * @returns Đường dẫn tạm thời của file video
 */
export async function startRecording(
    assignmentId: string,
    setNumber: number = 1,
): Promise<string> {
    console.log(
        `[VideoService] startRecording called for assignmentId: ${assignmentId}, set: ${setNumber}`,
    );

    isRecordingActive = true;
    isRecordingPaused = false;
    recordingStartTime = Date.now();
    recordingPauseOffset = 0;
    currentAssignmentId = assignmentId;
    currentSetNumber = setNumber;
    lastStopResult = null;

    // Trên web, việc ghi hình thực tế được xử lý bởi MediaRecorder bên trong iframe pose-html.
    // Chúng tôi chỉ theo dõi trạng thái ở đây. Không cần thao tác hệ thống tệp.
    if (Platform.OS === "web" && typeof window !== "undefined") {
        console.log(
            "[VideoService] Web platform: sending START_RECORDING to iframe.",
        );
        const iframeWindow = (window as any).__poseIframe;
        if (iframeWindow) {
            try {
                iframeWindow.postMessage(
                    JSON.stringify({ type: "START_RECORDING" }),
                    "*",
                );
            } catch (err) {
                console.warn(
                    "[VideoService] Failed to send START_RECORDING to iframe:",
                    err,
                );
            }
        }
        return "";
    }

    const dateStr = getFormattedDate();
    const dir = getLocalVideoDirectory();
    await ensureDirectoryExists(dir);
    const tempPath = `${dir}${assignmentId}_set${setNumber}_${dateStr}_temp.mp4`;

    console.log(
        `[VideoService] Active recording started. Temp path: ${tempPath}`,
    );
    return tempPath;
}

/**
 * Tạm dừng quay video — Gọi khi buổi tập bị Pause.
 * 
 * @returns void
 */
export function pauseRecording(): void {
    if (!isRecordingActive || isRecordingPaused) return;

    console.log("[VideoService] pauseRecording called");
    isRecordingPaused = true;
    if (recordingStartTime !== null) {
        recordingPauseOffset += Date.now() - recordingStartTime;
        recordingStartTime = null;
    }

    if (Platform.OS === "web" && typeof window !== "undefined") {
        const iframeWindow = (window as any).__poseIframe;
        if (iframeWindow) {
            try {
                iframeWindow.postMessage(
                    JSON.stringify({ type: "PAUSE_RECORDING" }),
                    "*",
                );
                console.log(
                    "[VideoService] Sent PAUSE_RECORDING to pose-html iframe",
                );
            } catch (err) {
                console.warn(
                    "[VideoService] Failed to send PAUSE_RECORDING to iframe:",
                    err,
                );
            }
        }
    }
}

/**
 * Tiếp tục quay video — Gọi khi buổi tập được Resume.
 * 
 * @returns void
 */
export function resumeRecording(): void {
    if (!isRecordingActive || !isRecordingPaused) return;

    console.log("[VideoService] resumeRecording called");
    isRecordingPaused = false;
    recordingStartTime = Date.now();

    if (Platform.OS === "web" && typeof window !== "undefined") {
        const iframeWindow = (window as any).__poseIframe;
        if (iframeWindow) {
            try {
                iframeWindow.postMessage(
                    JSON.stringify({ type: "RESUME_RECORDING" }),
                    "*",
                );
                console.log(
                    "[VideoService] Sent RESUME_RECORDING to pose-html iframe",
                );
            } catch (err) {
                console.warn(
                    "[VideoService] Failed to send RESUME_RECORDING to iframe:",
                    err,
                );
            }
        }
    }
}

/**
 * Kết thúc quay video, ghi dữ liệu ra file .mp4 và tạo thumbnail.
 * 
 * @returns Thông tin kết quả kết thúc ghi hình bao gồm đường dẫn và dung lượng
 */
export async function stopRecording(): Promise<StopRecordingResult> {
    console.log("[VideoService] stopRecording called");

    if (!isRecordingActive) {
        if (lastStopResult) {
            console.log(
                "[VideoService] stopRecording: Recording already stopped, returning last saved stop result:",
                lastStopResult,
            );
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

    // Tính toán tổng thời gian ghi hình đã trôi qua cuối cùng
    let totalDurationMs = recordingPauseOffset;
    if (!isRecordingPaused && recordingStartTime !== null) {
        totalDurationMs += Date.now() - recordingStartTime;
    }
    const durationSec = Math.round(totalDurationMs / 1000);
    const assignmentId = currentAssignmentId || "asgn_temp";
    const setNumber = currentSetNumber;
    const dateStr = getFormattedDate();

    // Đường dẫn tương đối để tham chiếu Firestore
    const relativeVideoPath = `videos/${assignmentId}_set${setNumber}_${dateStr}.mp4`;
    const relativeThumbnailPath = `videos/${assignmentId}_set${setNumber}_${dateStr}_thumb.jpg`;

    // Đặt lại trạng thái nội bộ
    isRecordingActive = false;
    isRecordingPaused = false;
    recordingStartTime = null;
    recordingPauseOffset = 0;
    currentAssignmentId = null;

    // ── ĐƯỜNG DẪN WEB ───────────────────────────────────────────────────────────
    // Trên web, video được ghi bằng MediaRecorder bên trong iframe pose-html.
    // ArrayBuffer được chuyển đến cửa sổ cha và một URL blob đã được tạo
    // trong PoseEstimationView.web.tsx. Chúng ta chỉ cần đọc nó từ từ điển toàn cục.
    if (Platform.OS === "web" && typeof window !== "undefined") {
        const iframeWindow = (window as any).__poseIframe;
        if (iframeWindow) {
            try {
                // Xóa bất kỳ URL đã ghi nào trước đó
                (window as any).__lastRecordedVideoUrl = "";
                if ((window as any).__recordedVideos) {
                    (window as any).__recordedVideos["latest"] = "";
                }

                iframeWindow.postMessage(
                    JSON.stringify({ type: "STOP_RECORDING" }),
                    "*",
                );
                console.log(
                    "[VideoService] Sent STOP_RECORDING to pose-html iframe",
                );
            } catch (err) {
                console.warn(
                    "[VideoService] Failed to send STOP_RECORDING to iframe:",
                    err,
                );
            }
        }

        // Bây giờ, thăm dò ý kiến cho URL blob để giải quyết (tối đa 2.5 giây)
        const startTime = Date.now();
        let webBlobUrl = "";
        while (Date.now() - startTime < 2500) {
            webBlobUrl =
                (window as any).__recordedVideos?.["latest"] ||
                (window as any).__lastRecordedVideoUrl ||
                "";
            if (webBlobUrl) {
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, 50));
        }

        if (webBlobUrl) {
            console.log(
                "[VideoService] stopRecording (web): Found recorded blob URL:",
                webBlobUrl,
            );
            // Ánh xạ tất cả các khóa có thể có tới URL blob cho các màn hình trình phát
            (window as any).__recordedVideos =
                (window as any).__recordedVideos || {};
            (window as any).__recordedVideos[relativeVideoPath] = webBlobUrl;
        } else {
            console.warn(
                "[VideoService] stopRecording (web): No recorded blob URL found! Recording may have failed.",
            );
        }

        const estimatedSizeMB = parseFloat(
            (Math.max(1, durationSec) * 1.5).toFixed(2),
        );
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

    // ── ĐƯỜNG DẪN GỐC (NATIVE) ──────────────────────────────────────────────────
    const dir = getLocalVideoDirectory();
    await ensureDirectoryExists(dir);

    const videoPath = `${dir}${assignmentId}_set${setNumber}_${dateStr}.mp4`;
    const thumbnailPath = `${dir}${assignmentId}_set${setNumber}_${dateStr}_thumb.jpg`;
    const tempPath = `${dir}${assignmentId}_set${setNumber}_${dateStr}_temp.mp4`;

    const simulatedSizeMB = parseFloat(
        (Math.max(1, durationSec) * 1.5).toFixed(2),
    );

    try {
        // Tạo ảnh thu nhỏ (thumbnail) giữ chỗ
        const base64Black1x1 =
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
        await writeAsStringAsync(thumbnailPath, base64Black1x1, {
            encoding: "base64" as any,
        });

        // Kiểm tra xem tệp ghi hình tạm thời có tồn tại không
        const tempInfo = await getInfoAsync(tempPath);
        if (tempInfo.exists) {
            console.log(
                `[VideoService] Temp file exists. Moving to: ${videoPath}`,
            );
            await moveAsync({ from: tempPath, to: videoPath });
        } else {
            console.warn(
                `[VideoService] Temp recording file not found at: ${tempPath}`,
            );
        }

        // Lấy kích thước của tệp cuối cùng
        const fileInfo = await getInfoAsync(videoPath);
        let finalSizeMB = simulatedSizeMB;
        if (fileInfo && fileInfo.exists) {
            finalSizeMB = parseFloat(
                (fileInfo.size / (1024 * 1024)).toFixed(2),
            );
        }

        console.log(
            `[VideoService] Recording saved:\n- ${videoPath} (${finalSizeMB}MB)\n- ${thumbnailPath}`,
        );

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
 * Xoá file video và thumbnail khỏi bộ nhớ cục bộ.
 *
 * @param videoPath Đường dẫn tuyệt đối tới video mp4
 * @param thumbnailPath Đường dẫn tuyệt đối tới thumbnail jpg
 * @returns Promise
 */
export async function deleteLocalVideo(
    videoPath: string,
    thumbnailPath: string,
): Promise<void> {
    console.log(
        `[VideoService] deleteLocalVideo called for: \n  Video: ${videoPath}\n  Thumb: ${thumbnailPath}`,
    );

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
 * Tải file video cục bộ từ đường dẫn URI tuyệt đối lên Cloudinary và trả về URL tải xuống công khai.
 * 
 * @param localFileUri Đường dẫn URI của file video cục bộ
 * @param sessionId ID của phiên tập luyện
 * @returns URL tải xuống công khai của video
 */
export async function uploadVideoToCloudinary(
    localFileUri: string,
    sessionId: string,
): Promise<string> {
    console.log(
        `[VideoService] Uploading video to Cloudinary. Local URI: ${localFileUri}`,
    );
    try {
        const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            throw new Error("Cloudinary config missing in .env");
        }

        let fileToUpload: any;
        if (Platform.OS === "web") {
            // Trên Web, localFileUri là một blob URL. Ta cần fetch nó để lấy Blob object thật.
            const fetchResponse = await fetch(localFileUri);
            fileToUpload = await fetchResponse.blob();
        } else {
            // Trên Mobile (iOS/Android), ta truyền object với thuộc tính uri
            fileToUpload = {
                uri: localFileUri,
                type: "video/mp4",
                name: `${sessionId}.mp4`,
            };
        }

        const formData = new FormData();
        formData.append("file", fileToUpload);

        formData.append("upload_preset", uploadPreset);
        // Chú ý: Unsigned upload không cho phép gửi public_id từ client.
        // Cloudinary sẽ tự tạo tên file ngẫu nhiên hoặc bạn có thể config folder trong Preset.
        // formData.append('api_key', '747817445469264'); // Không nên dùng trên client

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
            {
                method: "POST",
                body: formData,
            },
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error?.message || "Failed to upload to Cloudinary",
            );
        }

        console.log(
            `[VideoService] Video upload success! Public URL: ${data.secure_url}`,
        );

        // Trả về secure_url gốc để ngăn chặn màn hình đen trong khi Cloudinary chuyển mã f_auto
        return data.secure_url;
    } catch (err) {
        console.error(
            "[VideoService] Failed to upload video to Cloudinary:",
            err,
        );
        throw err;
    }
}

/**
 * Tải file ảnh thu nhỏ (thumbnail) cục bộ từ đường dẫn URI tuyệt đối lên Cloudinary và trả về URL tải xuống công khai.
 * 
 * @param localFileUri Đường dẫn URI của file ảnh cục bộ
 * @param sessionId ID của phiên tập luyện
 * @returns URL tải xuống công khai của ảnh thu nhỏ
 */
export async function uploadThumbnailToCloudinary(
    localFileUri: string,
    sessionId: string,
): Promise<string> {
    console.log(
        `[VideoService] Uploading thumbnail to Cloudinary. Local URI: ${localFileUri}`,
    );
    try {
        const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            throw new Error("Cloudinary config missing in .env");
        }

        let fileToUpload: any;
        if (Platform.OS === "web") {
            const fetchResponse = await fetch(localFileUri);
            fileToUpload = await fetchResponse.blob();
        } else {
            fileToUpload = {
                uri: localFileUri,
                type: "image/jpeg",
                name: `${sessionId}_thumb.jpg`,
            };
        }

        const formData = new FormData();
        formData.append("file", fileToUpload);

        formData.append("upload_preset", uploadPreset);
        // Bỏ public_id vì Unsigned upload không cho phép gửi thông số này

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
                method: "POST",
                body: formData,
            },
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error?.message || "Failed to upload to Cloudinary",
            );
        }

        console.log(
            `[VideoService] Thumbnail upload success! Public URL: ${data.secure_url}`,
        );

        // Tự động crop thành dạng vuông như trong snippet yêu cầu
        const autoCropUrl = data.secure_url.replace(
            "/upload/",
            "/upload/c_auto,g_auto,w_500,h_500,f_auto,q_auto/",
        );

        return autoCropUrl;
    } catch (err) {
        console.warn(
            "[VideoService] Failed to upload thumbnail to Cloudinary:",
            err,
        );
        // Trả về chuỗi rỗng hoặc dự phòng khi có lỗi, không làm hỏng luồng phiên cho một hình thu nhỏ
        return "";
    }
}

import { SetRecord } from "./types";
import { db } from "./config";
import {
    collection,
    query,
    where,
    getDocs,
    updateDoc,
} from "firebase/firestore";

/**
 * Tải video của các set tập luyện lên Cloudinary dưới nền và cập nhật Firestore.
 * 
 * @param uid ID của người dùng
 * @param assignmentId ID của bài tập được giao
 * @param exerciseIndex Chỉ số của bài tập trong danh sách
 * @param setsRecords Mảng bản ghi các set tập luyện
 * @param recordVideo Cờ xác định xem có đang bật tính năng ghi hình không
 * @returns Promise
 */
export async function uploadSetsVideosInBackground(
    uid: string,
    assignmentId: string,
    exerciseIndex: number,
    setsRecords: SetRecord[],
    recordVideo: boolean,
) {
    if (!recordVideo) return;

    const uploadPromises = setsRecords.map(async (set) => {
        if (!set.videoLocalPath) return set;
        try {
            const uploadId = `${assignmentId}_ex${exerciseIndex}_set${set.setNumber}_${Date.now()}`;
            const url = await uploadVideoToCloudinary(
                set.videoLocalPath,
                uploadId,
            );
            return { ...set, videoUrl: url };
        } catch (err) {
            console.error(`Failed to upload set ${set.setNumber}`, err);
            return set;
        }
    });

    const updatedSets = await Promise.all(uploadPromises);

    try {
        const incQuery = query(
            collection(db, "incomplete_sessions"),
            where("patientId", "==", uid),
            where("assignmentId", "==", assignmentId),
        );
        const incSnap = await getDocs(incQuery);
        if (!incSnap.empty) {
            const docRef = incSnap.docs[0].ref;
            const data = incSnap.docs[0].data();
            const completedExercises = data.completedExercises || [];
            const completedExercisesData = data.completedExercisesData || [];
            if (completedExercises[exerciseIndex]) {
                completedExercises[exerciseIndex].sets = updatedSets;
                completedExercises[exerciseIndex].videoUrl =
                    updatedSets[updatedSets.length - 1]?.videoUrl || null;
                if (completedExercisesData[exerciseIndex]) {
                    completedExercisesData[exerciseIndex].sets = updatedSets;
                    completedExercisesData[exerciseIndex].videoUrl =
                        updatedSets[updatedSets.length - 1]?.videoUrl || null;
                }
                await updateDoc(docRef, {
                    completedExercises,
                    completedExercisesData,
                });
                console.log(
                    `[VideoService] Background upload updated IncompleteSession ${docRef.id}`,
                );
            }
        }

        const sessQuery = query(
            collection(db, "sessions"),
            where("patientId", "==", uid),
            where("assignmentId", "==", assignmentId),
        );
        const sessSnap = await getDocs(sessQuery);
        if (!sessSnap.empty) {
            const docsList = sessSnap.docs.sort(
                (a, b) => b.data().date.toMillis() - a.data().date.toMillis(),
            );
            const docRef = docsList[0].ref;
            const data = docsList[0].data();
            const exercises = data.exercises || [];
            if (exercises[exerciseIndex]) {
                exercises[exerciseIndex].sets = updatedSets;
                exercises[exerciseIndex].videoUrl =
                    updatedSets[updatedSets.length - 1]?.videoUrl || null;
                await updateDoc(docRef, { exercises });
                console.log(
                    `[VideoService] Background upload updated Session ${docRef.id}`,
                );
            }
        }
    } catch (dbErr) {
        console.error(
            "[VideoService] Failed to update Firestore with background upload URLs:",
            dbErr,
        );
    }
}
