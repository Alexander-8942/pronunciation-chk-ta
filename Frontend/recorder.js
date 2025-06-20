let mediaRecorder;
let audioChunks = [];
let audioBlob = null;

const words = [
  "மலர்", "பழம்", "நீர்", "மழை", "வானம்",
  "மரம்", "முட்டை", "பசு", "தடாகம்", "பல்லி"
];

let currentIndex = 0;


// DOM Elements
const startBtn = document.getElementById("startBtn");
const sendBtn = document.getElementById("sendBtn");
const promptText = document.getElementById("prompt");
const progressFill = document.getElementById("progressFill");
const audioPlayback = document.getElementById("audioPlayback");
const apiResponseEl = document.getElementById("apiResponse");

// Logger
function log(...args) {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}]`, ...args);
}

// function updatePrompt() {
//   if (currentIndex < words.length) {
//     promptEl.textContent = `சொல் ${currentIndex + 1} / ${words.length}: "${words[currentIndex]}"`;
//   } else {
//     promptEl.textContent = "🏁 முடிந்தது!";
//   }
// }


function updatePrompt() {
  if (currentIndex < words.length) {
    promptText.textContent = words[currentIndex];
    progressText.textContent = `சொல் ${currentIndex + 1} / ${words.length}`;
  } else {
    promptText.textContent = "🏁 முடிந்தது!";
    progressText.textContent = "🎉 All words completed!";
  }
  progressFill.style.width = `${((currentIndex + 1) / words.length) * 100}%`;
}

// ✅ Setup recording controls (runs on load)
startBtn.addEventListener("mousedown", startRecording);
startBtn.addEventListener("touchstart", startRecording, { passive: true });

startBtn.addEventListener("mouseup", stopRecording, { passive: true });
startBtn.addEventListener("touchend", stopRecording, { passive: true });

// 🔴 Start Recording
async function startRecording(event) {
  event.preventDefault();

  if (mediaRecorder?.state === "recording") return;

  log("🎙️ Requesting microphone access...");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    log("✅ Microphone access granted.");

    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      log("📥 Audio chunk received.");
      audioChunks.push(e.data);
    };

    mediaRecorder.onstop = handleRecordingStop;

    mediaRecorder.start();
    startBtn.textContent = "⏹️";
    sendBtn.disabled = true;

    log("🔴 Recording started.");
  } catch (err) {
    log("🚫 Microphone error:", err.message);
    alert("Microphone permission is required.");
  }
}

// ⏹ Stop Recording
function stopRecording(event) {
  event.preventDefault();

  if (mediaRecorder && mediaRecorder.state === "recording") {
    log("🛑 Stopping recording...");
    mediaRecorder.stop();
    startBtn.textContent = "🎙️ Hold to Record";
  }
}

// 🎧 Handle after recording stopped
function handleRecordingStop() {
  if (audioChunks.length === 0) {
    log("⚠️ No audio recorded.");
    apiResponseEl.textContent = "No audio recorded.";
    return;
  }

  log("⏹️ Recording stopped.");
  audioBlob = new Blob(audioChunks, { type: "audio/webm" });
  const audioUrl = URL.createObjectURL(audioBlob);
  audioPlayback.src = audioUrl;
  sendBtn.disabled = false;

  log("🎧 Audio ready for playback. Size:", (audioBlob.size / 1024).toFixed(1), "KB");
}

// 📤 Send to backend
sendBtn.onclick = () => {
  if (!audioBlob) {
    log("❌ No audio to send.");
    apiResponseEl.textContent = "❌ No audio to send.";
    return;
  }

  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  log("📤 Sending audio to backend...");
  apiResponseEl.textContent = "Sending audio...";
  setFeedback("⏳ Sending audio to backend...", "loading");

  fetch(`https://localhost:5000/check?expected=${encodeURIComponent(words[currentIndex])}`, {
  method: "POST",
  body: formData
})
  .then((res) => res.json())
  .then((data) => {
    log("✅ API response:", data);

    const result = data.result || data.message || "Response received";
    const type = result === "Correct" ? "correct" : "incorrect";

    if (result === "Correct") {
      setFeedback(`✅ சரி! "${words[currentIndex]}" சரியாக உச்சரிக்கப்பட்டது.`, type);
      currentIndex++;
      if (currentIndex < words.length) {
        setTimeout(() => {
          updatePrompt();
        }, 2000);
      } else {
        setFeedback("🎉 நீங்கள் அனைத்து சொற்களையும் முடித்துவிட்டீர்கள்!", "correct");
      }
    } else {
      setFeedback(`❌ தவறு. "${words[currentIndex]}" - மீண்டும் முயற்சிக்கவும்.`, type);
    }
  })
  .catch((err) => {
    log("❌ API error:", err.message);
    setFeedback("❌ Failed to send audio: " + err.message, "incorrect");
  });
};

function setFeedback(message, type = "") {
  apiResponseEl.textContent = message;
  apiResponseEl.className = `response-box ${type}`;
  apiResponseEl.style.display = "block";
}


if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    updatePrompt();
  });
} else {
  updatePrompt();
}
