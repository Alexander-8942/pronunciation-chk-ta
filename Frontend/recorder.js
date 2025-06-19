// References to DOM elements
const recordBtn = document.getElementById('recordBtn');
const recordLabel = document.getElementById('recordLabel');
const audioPlayback = document.getElementById('audioPlayback');
const controlButtons = document.getElementById('controlButtons');
const rerecordBtn = document.getElementById('rerecordBtn');
const submitBtn = document.getElementById('submitBtn');
const promptText = document.getElementById('prompt');
const progressText = document.getElementById('progress');
const feedback = document.getElementById('feedback');

const words = [
  "மலர்", "நீர்வீழ்ச்சி", "பருப்பு", "முட்டை", "குறிஞ்சி", "வானம்",
  "மழை", "பசு", "மரம்", "தடாகம்"
];

// Track current word index and app state
let currentIndex = 0;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let currentAudioBlob = null;

const BACKEND_URL = window.BACKEND_URL || 'https://127.0.0.1:5000';

// Initialize the app
function initializeApp() {
  updatePrompt();
  setupMicrophone();
  setupEventListeners();
}

// Set up microphone access
function setupMicrophone() {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      console.log("✅ Microphone access granted");
      
      // Create MediaRecorder
      mediaRecorder = new MediaRecorder(stream);
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (e) => {
        console.log("🎧 Data available:", e.data);
        audioChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        console.log("🛑 Recording stopped");
        handleRecordingStop();
      };

      // Enable recording controls
      setupRecordingControls();
      recordBtn.disabled = false;
      recordLabel.textContent = "Press & Hold to Record";
      
    })
    .catch(err => {
      console.error('Microphone access failed:', err);
      recordLabel.textContent = 'Microphone access failed';
      recordBtn.disabled = true;
      showFeedback('🎤 மைக்ரோஃபோன் அணுகல் தோல்வி: ' + err.message, 'incorrect');
    });
}

// Set up all event listeners
function setupEventListeners() {
  // Re-record button
  rerecordBtn.addEventListener('click', () => {
    startNewRecording();
  });

  // Submit button
  submitBtn.addEventListener('click', () => {
    console.log(submitBtn.closest('form'));

    if (currentAudioBlob) {
      submitRecording();
    }
  });
}

// Set up recording button controls
function setupRecordingControls() {
  recordBtn.addEventListener('mousedown', startRecording);
  recordBtn.addEventListener('mouseup', stopRecording);
  recordBtn.addEventListener('mouseleave', stopRecording);
  
  // Touch events for mobile
  recordBtn.addEventListener('touchstart', startRecording);
  recordBtn.addEventListener('touchend', stopRecording);
}

function startRecording(event) {
  event.preventDefault();
  
  if (!mediaRecorder || isRecording || recordBtn.disabled) return;
  
  console.log("🔴 Recording started");
  audioChunks = [];
  isRecording = true;
  
  try {
    mediaRecorder.start();
    recordBtn.classList.add('recording');
    recordLabel.textContent = 'Recording... (Hold & Speak)';
    
    // Hide previous results
    hideControlButtons();
    clearFeedback();
    
  } catch (error) {
    console.error('Failed to start recording:', error);
    isRecording = false;
    recordLabel.textContent = 'Recording failed';
  }
}

function stopRecording(event) {
  event.preventDefault();
  
  if (!mediaRecorder || !isRecording) return;
  
  if (mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    isRecording = false;
    recordBtn.classList.remove('recording');
    recordLabel.textContent = 'Processing...';
    
    console.log("🛑 Stop recording requested");
  }
}

function handleRecordingStop() {
  if (audioChunks.length === 0) {
    console.warn("No audio data recorded");
    recordLabel.textContent = 'No audio recorded. Try again.';
    return;
  }

  // Create audio blob
  currentAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
  console.log("📦 Created audio blob:", currentAudioBlob);

  // Display audio playback
  displayAudioPlayback(currentAudioBlob);
  
  // Show control buttons
  showControlButtons();
  
  // Update UI
  recordLabel.textContent = 'Listen to your recording';
  
  // Reset audio chunks
  audioChunks = [];
}

function displayAudioPlayback(blob) {
  const audioURL = URL.createObjectURL(blob);
  
  audioPlayback.innerHTML = `
    <div class="audio-info">
      <p><strong>Your recording:</strong></p>
      <audio controls>
        <source src="${audioURL}" type="audio/webm">
        Your browser does not support audio playback.
      </audio>
    </div>
  `;
  
  audioPlayback.classList.remove('hidden');
}

function showControlButtons() {
  controlButtons.style.display = 'flex';
}

function hideControlButtons() {
  controlButtons.style.display = 'none';
}

function startNewRecording() {
  // Clear current recording
  currentAudioBlob = null;
  audioPlayback.innerHTML = '';
  audioPlayback.classList.add('hidden');
  hideControlButtons();
  clearFeedback();
  
  // Reset record button
  recordBtn.disabled = false;
  recordLabel.textContent = 'Press & Hold to Record';
}

function submitRecording() {
  if (!currentAudioBlob) {
    showFeedback('No recording to submit', 'incorrect');
    return;
  }
  
  // Disable submit button during processing
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
  
  // Send to backend
  sendToBackend(currentAudioBlob, words[currentIndex]);
}

function sendToBackend(blob, expectedWord) {
  console.log("📤 Sending audio to backend:", expectedWord);
  
  const formData = new FormData();
  formData.append('audio', blob, 'audio.webm');

  const xhr = new XMLHttpRequest();
  const url = `${BACKEND_URL}/check?expected=${encodeURIComponent(expectedWord)}`;

  console.log("📤 Sending request to:", url);
  console.log("📦 Blob type:", blob.type, "Size:", (blob.size / 1024).toFixed(2), "KB");

  // Show processing state
  showFeedback('பரிசோதிக்கிறது...', '');
  
  xhr.open('POST', url, true);

  xhr.onload = function () {
    console.log("📥 Response status:", xhr.status);
    
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit';

    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const data = JSON.parse(xhr.responseText);
        console.log("📨 Backend response data:", data);

        displayResult(data.result);

        if (data.result === "Correct") {
          handleCorrectAnswer();
        } else {
          // Allow re-recording for incorrect answers
          setTimeout(() => {
            startNewRecording();
          }, 2000);
        }

      } catch (err) {
        console.error("❌ JSON parse error:", err.message);
        showFeedback('Server response error: ' + err.message, 'incorrect');
      }

    } else {
      console.error("❌ Server error:", xhr.status, xhr.responseText);
      showFeedback(`Server Error: ${xhr.status} - ${xhr.responseText}`, 'incorrect');
    }
  };

  xhr.onerror = function () {
    console.error("❌ AJAX request failed");
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit';
    showFeedback('Network Error: Could not reach server. Make sure the backend is running.', 'incorrect');
    alert("AJAX failed: " + JSON.stringify(event)); // Quick popup diagnostic
  };

  xhr.ontimeout = function () {
    console.error("❌ Request timed out");
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit';
    showFeedback('Request timed out. Please try again.', 'incorrect');
  };

  xhr.timeout = 15000; // 15 second timeout

  try {
    xhr.send(formData);
  } catch (error) {
    console.error("❌ Error sending request:", error.message);
    alert("XHR Exception: " + error.message);  // This might catch SSL or CORS issues
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit';
    showFeedback('Frontend Error: ' + error.message, 'incorrect');
  }
}

function displayResult(result) {
  const isCorrect = result === "Correct";
  const message = isCorrect ? 
    `✅ சரி! "${words[currentIndex]}" - Perfect pronunciation!` : 
    `❌ தவறு. "${words[currentIndex]}" - Try again.`;
  
  showFeedback(message, isCorrect ? 'correct' : 'incorrect');
}

function showFeedback(message, type) {
  feedback.textContent = message;
  feedback.className = type;
  
  if (type) {
    feedback.style.display = 'block';
  }
}

function clearFeedback() {
  feedback.textContent = '';
  feedback.className = '';
  feedback.style.display = 'none';
}

function handleCorrectAnswer() {
  // Hide controls
  hideControlButtons();
  recordBtn.disabled = true;
  
  setTimeout(() => {
    currentIndex++;
    if (currentIndex < words.length) {
      // Move to next word
      updatePrompt();
      startNewRecording();
      clearFeedback();
    } else {
      // All words completed
      promptText.textContent = "🏁 முடிந்தது!";
      progressText.textContent = "All words completed! வாழ்த்துகள்!";
      recordLabel.textContent = 'Completed!';
      showFeedback('🎉 Congratulations! You completed all words!', 'correct');
    }
  }, 2500);
}

function updatePrompt() {
  promptText.textContent = words[currentIndex];
  progressText.textContent = `சொல் ${currentIndex + 1} / ${words.length}`;
}

// Initialize the app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}