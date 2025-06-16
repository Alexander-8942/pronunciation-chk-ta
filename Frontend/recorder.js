const recordBtn = document.getElementById('recordBtn');
const audioPlayback = document.getElementById('audioPlayback');
const promptText = document.getElementById('prompt');
const progressText = document.getElementById('progress');

const words = [
  "நீர்வீழ்ச்சி", "பருப்பு", "முட்டை", "குறிஞ்சி", "வானம்",
  "மழை", "மலர்", "பசு", "மரம்", "தடாகம்"
];

let currentIndex = 0;
updatePrompt();

let mediaRecorder;
let audioChunks = [];

navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log("✅ Microphone access granted"); // DEBUG
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = e => {
      console.log("🎧 Data available:", e.data); // DEBUG
      audioChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      console.log("🛑 Recording stopped"); // DEBUG

      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      alconsole.log("📦 Created audio blob:", blob); // DEBUG
      const audioURL = URL.createObjectURL(blob);
      console.log("🔗 Audio URL:", audioURL); // DEBUG

      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = audioURL;

      audioPlayback.innerHTML = ''; // clear previous
      audioPlayback.appendChild(audio);

      // Send to backend
      sendToBackend(blob, words[currentIndex]);

      audioChunks = [];
    };

    recordBtn.addEventListener('mousedown', () => {
      event.preventDefault();
      audioChunks = [];
      mediaRecorder.start();
    });

    recordBtn.addEventListener('mouseup', () => {
      event.preventDefault();
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    });

    recordBtn.addEventListener('mouseleave', () => {
      event.preventDefault();
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    });
  })
  .catch(err => {
    alert('🎤 மைக்ரோஃபோன் அணுகல் தோல்வி '+ err.message);
    console.error(err);
  });

// Global constant set via <script> tag or env.js file
const BACKEND_URL = window.BACKEND_URL || 'http://127.0.0.1:5000';  // fallback for local testing

function sendToBackend(blob, expectedWord) {
  console.log("📤 Sending audio to backend:", expectedWord); // DEBUG
  const formData = new FormData();
  formData.append('audio', blob, 'audio.webm');

  fetch(`${BACKEND_URL}/check?expected=${encodeURIComponent(expectedWord)}`, {
    method: 'POST',
    body: formData
  })
    .then(response => {
      console.log("✅ Got response from backend"); // DEBUG
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      return response.json(); // ✅ Must return this!
    })
    .then(data => {
      console.log("📨 Backend response data:", data); // DEBUG
      const resultText = document.createElement('p');
      resultText.innerHTML = `<strong>முடிவு:</strong> ${data.result}`;

      audioPlayback.appendChild(resultText);

      if (data.result === "Correct") {
        setTimeout(() => {
          currentIndex++;
          if (currentIndex < words.length) {
            updatePrompt();
          } else {
            promptText.textContent = "🏁 முடிந்தது!";
            progressText.textContent = "All words completed!";
            recordBtn.disabled = true;
          }
        }, 1500); // slight delay to let user read the result
      }
    })
    .catch(error => {
      console.error('Error sending audio:', error);
       alert('⚠️ Backend Error: ' + error.message); // Logging to See What’s Failing
    });
}

function updatePrompt() {
  promptText.textContent = words[currentIndex];
  progressText.textContent = `சொல் ${currentIndex + 1} / ${words.length}`;
}
