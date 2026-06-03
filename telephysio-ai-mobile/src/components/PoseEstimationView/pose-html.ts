/**
 * @file pose-html.ts
 * @description File chứa mã HTML dạng chuỗi độc lập để chạy MediaPipe BlazePose bên trong một WebView.
 * Truy cập camera thiết bị thông qua getUserMedia, vẽ khung xương lên canvas và gửi dữ liệu tư thế
 * định dạng JSON đến ứng dụng qua window.ReactNativeWebView.postMessage.
 */

export const POSE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Pose Estimation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #111827; overflow: hidden; }

    #container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    video {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scaleX(-1); /* mirror for front-facing camera */
    }

    canvas {
      position: absolute;
      width: 100%;
      height: 100%;
      transform: scaleX(-1); /* mirror to match video */
    }

    #status {
      position: absolute;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid rgba(16, 185, 129, 0.5);
      color: #a7f3d0;
      font-family: -apple-system, sans-serif;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 20px;
      white-space: nowrap;
      z-index: 10;
      transition: opacity 0.3s;
    }

    #status.loading {
      background: rgba(245, 158, 11, 0.2);
      border-color: rgba(245, 158, 11, 0.5);
      color: #fde68a;
    }

    #status.error {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.5);
      color: #fca5a5;
    }

    #fps-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(0,0,0,0.5);
      color: #94a3b8;
      font-family: monospace;
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 6px;
      z-index: 10;
    }
  </style>
</head>
<body>
  <div id="container">
    <video id="video" playsinline autoplay muted></video>
    <canvas id="canvas"></canvas>
    <div id="status" class="loading">⟳ Initialising camera…</div>
    <div id="fps-badge">-- fps</div>
  </div>

  <!-- MediaPipe Pose (BlazePose) - CDN WASM build -->
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js" crossorigin="anonymous"></script>

  <script>
    const video    = document.getElementById('video');
    const canvas   = document.getElementById('canvas');
    const ctx      = canvas.getContext('2d');
    const statusEl = document.getElementById('status');
    const fpsEl    = document.getElementById('fps-badge');

    // ── FPS tracking ──────────────────────────────────────────────────────────
    let lastFrameTime = performance.now();
    let frameCount = 0;
    let fps = 0;

    function updateFps() {
      frameCount++;
      const now = performance.now();
      const delta = now - lastFrameTime;
      if (delta >= 1000) {
        fps = Math.round((frameCount * 1000) / delta);
        frameCount = 0;
        lastFrameTime = now;
        fpsEl.textContent = fps + ' fps';
      }
    }

    // ── Landmark drawing helpers ──────────────────────────────────────────────
    const POSE_CONNECTIONS = [
      // Torso
      [11, 12], [11, 23], [12, 24], [23, 24],
      // Right arm
      [12, 14], [14, 16], [16, 18], [18, 20], [16, 20], [16, 22],
      // Left arm
      [11, 13], [13, 15], [15, 17], [17, 19], [15, 19], [15, 21],
      // Right leg
      [24, 26], [26, 28], [28, 30], [30, 32], [28, 32],
      // Left leg
      [23, 25], [25, 27], [27, 29], [29, 31], [27, 31],
      // Face
      [0, 1], [1, 2], [2, 3], [3, 7],
      [0, 4], [4, 5], [5, 6], [6, 8],
      [9, 10],
    ];

    const LANDMARK_COLORS = {
      face: '#60a5fa',
      arms: '#34d399',
      torso: '#a78bfa',
      legs: '#f472b6',
    };

    function getLandmarkColor(index) {
      if (index <= 10) return LANDMARK_COLORS.face;
      if (index <= 22) return (index % 2 === 0) ? LANDMARK_COLORS.arms : LANDMARK_COLORS.arms;
      return LANDMARK_COLORS.legs;
    }

    function drawPoseSkeleton(landmarks) {
      const W = canvas.width;
      const H = canvas.height;

      // Draw connections (bones)
      POSE_CONNECTIONS.forEach(([a, b]) => {
        const lmA = landmarks[a];
        const lmB = landmarks[b];
        if (!lmA || !lmB) return;
        if (lmA.visibility < 0.5 || lmB.visibility < 0.5) return;

        ctx.beginPath();
        ctx.moveTo(lmA.x * W, lmA.y * H);
        ctx.lineTo(lmB.x * W, lmB.y * H);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      });

      // Draw joints (dots)
      landmarks.forEach((lm, i) => {
        if (lm.visibility < 0.4) return;
        const cx = lm.x * W;
        const cy = lm.y * H;
        const color = getLandmarkColor(i);

        // Outer glow
        ctx.beginPath();
        ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
        ctx.fillStyle = color + '40';
        ctx.fill();

        // Inner dot
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        // White center
        ctx.beginPath();
        ctx.arc(cx, cy, 1.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
      });
    }

    // ── Pose data reporting (works in both WebView and iframe) ───────────────
    function postToHost(payload) {
      const msg = JSON.stringify(payload);
      if (window.ReactNativeWebView) {
        // Native WebView (Android / iOS)
        window.ReactNativeWebView.postMessage(msg);
      } else {
        // Web iframe — parent listens via window.addEventListener('message')
        window.parent.postMessage(msg, '*');
      }
    }

    function reportPoseToNative(landmarks) {
      const simplified = landmarks.map(lm => ({
        x: parseFloat(lm.x.toFixed(4)),
        y: parseFloat(lm.y.toFixed(4)),
        z: parseFloat(lm.z.toFixed(4)),
        visibility: parseFloat(lm.visibility.toFixed(3)),
      }));
      postToHost({ type: 'POSE_LANDMARKS', landmarks: simplified, fps });
    }

    // ── MediaPipe Pose setup ──────────────────────────────────────────────────
    function initPose() {
      const pose = new Pose({
        locateFile: (file) =>
          'https://cdn.jsdelivr.net/npm/@mediapipe/pose/' + file,
      });

      pose.setOptions({
        modelComplexity: 1,          // 0=light, 1=full, 2=heavy
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      pose.onResults((results) => {
        // Resize canvas to video dimensions
        canvas.width  = video.videoWidth  || canvas.offsetWidth;
        canvas.height = video.videoHeight || canvas.offsetHeight;

        // Clear frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.poseLandmarks && results.poseLandmarks.length > 0) {
          drawPoseSkeleton(results.poseLandmarks);
          reportPoseToNative(results.poseLandmarks);

          statusEl.textContent = '● Pose Detected';
          statusEl.className = '';
        } else {
          statusEl.textContent = '◌ No pose detected';
          statusEl.className = 'loading';
        }

        updateFps();
      });

      return pose;
    }

    let mediaRecorder = null;
    let recordedChunks = [];

    // ── Camera setup ──────────────────────────────────────────────────────────
    async function startCamera() {
      statusEl.textContent = '⟳ Requesting camera…';
      statusEl.className = 'loading';

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',    // front camera by default
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30, max: 30 },
          },
          audio: false,
        });

        video.srcObject = stream;
        await new Promise((resolve) => { video.onloadedmetadata = resolve; });
        await video.play();

        statusEl.textContent = '⟳ Loading AI model…';
        statusEl.className = 'loading';

        const pose = initPose();

        // Use MediaPipe Camera utility for frame pumping
        const camera = new Camera(video, {
          onFrame: async () => {
            await pose.send({ image: video });
          },
          width: 640,
          height: 480,
        });
        camera.start();

        // ── Web MediaRecorder Setup ──────────────────────────────────────────
        try {
          recordedChunks = [];
          let options = {};
          const candidateMimeTypes = [
            'video/mp4;codecs=h264',
            'video/mp4',
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm'
          ];
          for (const mime of candidateMimeTypes) {
            if (MediaRecorder.isTypeSupported(mime)) {
              options = { mimeType: mime };
              break;
            }
          }

          mediaRecorder = new MediaRecorder(stream, options);
          mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              recordedChunks.push(event.data);
            }
          };

          mediaRecorder.onstop = () => {
            if (recordedChunks.length > 0) {
              const mime = mediaRecorder.mimeType || 'video/webm';
              const blob = new Blob(recordedChunks, { type: mime });
              console.log("[pose-html] Recording complete. Blob size:", blob.size, "bytes, mime:", mime);
              // Transfer raw ArrayBuffer to parent — blob URLs from iframes
              // get revoked when the iframe is destroyed, so we send the data itself.
              blob.arrayBuffer().then(function(buffer) {
                console.log("[pose-html] ArrayBuffer ready, transferring to parent. Size:", buffer.byteLength);
                window.parent.postMessage({
                  type: 'RECORDING_COMPLETE',
                  buffer: buffer,
                  mimeType: mime
                }, '*', [buffer]);
              }).catch(function(err) {
                console.error("[pose-html] Failed to convert blob to ArrayBuffer:", err);
              });
            }
          };

          mediaRecorder.start(1000); // chunk every 1 second
          console.log("[pose-html] MediaRecorder started successfully!");
        } catch (recErr) {
          console.warn("[pose-html] Failed to initialize MediaRecorder:", recErr);
        }

      } catch (err) {
        console.error('Camera error:', err);
        statusEl.textContent = '✕ Camera error: ' + err.message;
        statusEl.className = 'error';
        postToHost({ type: 'CAMERA_ERROR', error: err.message });
      }
    }

    // ── Listen to host control commands ──────────────────────────────────────
    window.addEventListener('message', (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!mediaRecorder) return;

        if (data.type === 'PAUSE_RECORDING') {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.pause();
            console.log("[pose-html] Recording paused");
          }
        } else if (data.type === 'RESUME_RECORDING') {
          if (mediaRecorder.state === 'paused') {
            mediaRecorder.resume();
            console.log("[pose-html] Recording resumed");
          }
        } else if (data.type === 'STOP_RECORDING') {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            console.log("[pose-html] Recording stopped");
          }
        }
      } catch (e) {
        // ignore malformed messages
      }
    });

    // ── Boot ──────────────────────────────────────────────────────────────────
    window.addEventListener('load', () => {
      // Small delay so scripts fully initialise
      setTimeout(startCamera, 500);
    });
  </script>
</body>
</html>`;
