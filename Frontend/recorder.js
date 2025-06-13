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
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = e => {
      audioChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const audioURL = URL.createObjectURL(blob);

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
    alert('🎤 மைக்ரோஃபோன் அணுகல் தோல்வி');
    console.error(err);
  });

// Global constant set via <script> tag or env.js file
const BACKEND_URL = window.BACKEND_URL || 'http://localhost:5000';  // fallback for local testing

function sendToBackend(blob, expectedWord) {
  const formData = new FormData();
  formData.append('audio', blob, 'audio.webm');

  fetch(`${BACKEND_URL}/check?expected=${encodeURIComponent(expectedWord)}`, {
    method: 'POST',
    body: formData
  })
    .then(response => response.json())
    .then(data => {
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
    });
}

function updatePrompt() {
  promptText.textContent = words[currentIndex];
  progressText.textContent = `சொல் ${currentIndex + 1} / ${words.length}`;
}
