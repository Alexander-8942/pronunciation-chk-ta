// references to DOM elements
const recordBtn = document.getElementById('recordBtn');
const audioPlayback = document.getElementById('audioPlayback');
const promptText = document.getElementById('prompt');
const progressText = document.getElementById('progress');

const words = [
  "மலர்", "நீர்வீழ்ச்சி", "பருப்பு", "முட்டை", "குறிஞ்சி", "வானம்",
  "மழை", "பசு", "மரம்", "தடாகம்"
];

// track current word index
let currentIndex = 0;
updatePrompt();

let mediaRecorder;
let audioChunks = [];

// microphone access and set up
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log("✅ Microphone access granted"); // debug
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (e) => {
      console.log("🎧 Data available:", e.data); // debug
      audioChunks.push(e.data);
    };

    // mediaRecorder.onstop = () => {
    //   console.log("🛑 Recording stopped"); // debug

    //   const blob = new Blob(audioChunks, { type: 'audio/webm' });
    //   console.log("📦 Created audio blob:", blob); // debug

    //   const audioURL = URL.createObjectURL(blob);
    //   console.log("🔗 Audio URL:", audioURL); // debug

    //   const audio = document.createElement('audio');
    //   audio.controls = true;
    //   audio.src = audioURL;

    //   audioPlayback.innerHTML = '';
    //   audioPlayback.appendChild(audio);

    //   sendToBackend(blob, words[currentIndex]);

    //   audioChunks = [];
    // };

    // console.log("starting new recording: before setupRecordingControls function call")
    // setupRecordingControls(recordBtn);
  })
  .catch(err => {
    alert('🎤 மைக்ரோஃபோன் அணுகல் தோல்வி ' + err.message);
    console.error(err);
  });

console.log("starting new recording: first setupRecordingControls function call")
setupRecordingControls(recordBtn);

function setupRecordingControls(button) {
  console.log("inside setupRecordingControls function")
  button.addEventListener('mousedown', (event) => {
    event.preventDefault();
    console.log("🔴 Recording started");  // debug
    audioChunks = [];
    mediaRecorder.start();
    console.log("recorder button state: ", mediaRecorder.state) // debug
  });

  button.addEventListener('mouseup', (event) => {
    event.preventDefault();
    if (mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      console.log("recorder button state: ", mediaRecorder.state) //debug
    }

    mediaRecorder.onstop = () => {
      console.log("🛑 Recording stopped"); // debug

      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      console.log("📦 Created audio blob:", blob); // debug

      const audioURL = URL.createObjectURL(blob);
      console.log("🔗 Audio URL:", audioURL); // debug

      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = audioURL;

      audioPlayback.innerHTML = '';
      audioPlayback.appendChild(audio);

      sendToBackend(blob, words[currentIndex]);

      audioChunks = [];
    };

  });
}

const BACKEND_URL = window.BACKEND_URL || 'http://127.0.0.1:5000';

function sendToBackend1(blob, expectedWord) {// using fetch
  console.log("📤 Sending audio to backend:", expectedWord); // debug
  const formData = new FormData();
  formData.append('audio', blob, 'audio.webm');

  fetch(`${BACKEND_URL}/check?expected=${encodeURIComponent(expectedWord)}`, {
    method: 'POST',
    body: formData
  })
  //console.log("request sent sucessfully")
    .then(response => {
      console.log("📥 Received response from backend");  // debug
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("📨 Backend response data:", data); // debug
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
        }, 1500);
      }

      console.log("starting next recording: after receiving positive response")
      setupRecordingControls(recordBtn);


    })
    .catch(error => {
      console.error('Error sending audio:', error);
      alert('⚠️ Backend Error: ' + error.message);
    });
}

function sendToBackend2(blob, expectedWord) {// using fetch
  console.log("📤 Sending audio to backend:", expectedWord); // Debug
  const formData = new FormData();
  formData.append('audio', blob, 'audio.webm');

  try {
    console.log("📤 Sending request to:", `${BACKEND_URL}/check?expected=${encodeURIComponent(expectedWord)}`);
    console.log("📦 Blob type:", blob.type, "Size:", blob.size / 1024, "KB");
    for (let [key, value] of formData.entries()) {
      console.log("📤 FormData entry:", key, value);
    }

    fetch(`${BACKEND_URL}/check?expected=${encodeURIComponent(expectedWord)}`, {
      method: 'POST',
      body: formData
    })
      .then(response => {
        console.log("📥 Response status:", response.status); // Debug
        console.log("📥 Response headers:", [...response.headers]); // Debug
        if (!response.ok) {
          return response.text().then(text => {
            console.error("📥 Response text:", text);
            throw new Error(`Server error: ${response.status} - ${text}`);
          });
        }
        return response.json();
      })
      .then(data => {
        console.log("📨 Backend response data:", data); // Debug
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
          }, 1500);
        }

        console.log("Starting next recording: after receiving positive response");
        setupRecordingControls(recordBtn);
      })
      .catch(error => {
        console.error("❌ Fetch error:", error.message);
        console.error("❌ Error stack:", error.stack);
        alert('⚠️ Backend Error: ' + error.message);
      });
  } catch (error) {
    console.error("❌ Error before fetch:", error.message);
    console.error("❌ Error stack:", error.stack);
    alert('⚠️ Frontend Error: ' + error.message);
  }
}

function sendToBackend(blob, expectedWord) { // using ajax
  console.log("📤 Sending audio to backend:", expectedWord); // Debug
  const formData = new FormData();
  formData.append('audio', blob, 'audio.webm');

  try {
    const xhr = new XMLHttpRequest();
    const url = `${BACKEND_URL}/check?expected=${encodeURIComponent(expectedWord)}`;

    console.log("📤 Sending request to:", url);
    console.log("📦 Blob type:", blob.type, "Size:", blob.size / 1024, "KB");

    for (let [key, value] of formData.entries()) {
      console.log("📤 FormData entry:", key, value);
    }

    xhr.open('POST', url, true);

    xhr.onload = function () {
      console.log("📥 Response status:", xhr.status);

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          console.log("📨 Backend response data:", data);

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
            }, 1500);
          }

          // console.log("Starting next recording: after receiving positive response");
          // setupRecordingControls(recordBtn);

        } catch (err) {
          console.error("❌ JSON parse error:", err.message);
          alert('⚠️ JSON Parse Error: ' + err.message);
        }

      } else {
        console.error("❌ Server responded with error:", xhr.status, xhr.responseText);
        alert('⚠️ Backend Error: ' + xhr.status + ' - ' + xhr.responseText);
      }
    };

    xhr.onerror = function () {
      console.error("❌ AJAX request failed");
      alert('⚠️ Network Error: Could not reach backend.');
    };

    xhr.send(formData);

  } catch (error) {
    console.error("❌ Error before request:", error.message);
    console.error("❌ Error stack:", error.stack);
    alert('⚠️ Frontend Error: ' + error.message);
  }
}


function updatePrompt() {
  promptText.textContent = words[currentIndex];
  progressText.textContent = `சொல் ${currentIndex + 1} / ${words.length}`;
}
