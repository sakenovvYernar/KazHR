// Protect page
utils.protectPage();

let interviewCode = null;
let isMuted = false;
let isVideoOff = false;
let isRecording = false;
let isScreenSharing = false;
let startTime = null;
let localStream = null;
let remoteStream = null;
let peerConnection = null;
let transcriptionInterval = null;
let recordingStartTime = null;

// WebRTC configuration
const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// Load interview code from URL or show join screen
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (code) {
    interviewCode = code.toUpperCase();
    document.getElementById('roomCode').textContent = interviewCode;
    joinRoom(interviewCode);
  } else {
    setupJoinForm();
  }
});

// Setup join form
function setupJoinForm() {
  const form = document.getElementById('joinForm');
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const code = document.getElementById('interviewCode').value.toUpperCase();
    const name = document.getElementById('participantName').value;
    
    if (code && name) {
      interviewCode = code;
      joinRoom(code, name);
    }
  });
  
  // Auto-format code input
  const codeInput = document.getElementById('interviewCode');
  codeInput.addEventListener('input', function(e) {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  });
}

// Join interview room
async function joinRoom(code, participantName = null) {
  try {
    // Validate interview code
    const interview = await validateInterviewCode(code);
    
    if (!interview) {
      utils.showToast('Неверный код собеседования', 'error');
      return;
    }
    
    // Hide join screen and show interview room
    document.getElementById('joinScreen').style.display = 'none';
    document.getElementById('interviewRoom').style.display = 'block';
    
    // Set room code
    document.getElementById('roomCode').textContent = code;
    
    // Set participant name
    if (participantName) {
      document.getElementById('localParticipantName').textContent = participantName;
      document.getElementById('localName').textContent = participantName;
    }
    
    // Start interview
    await startInterview(interview);
    
  } catch (error) {
    console.error('Error joining room:', error);
    utils.showToast('Ошибка присоединения к комнате', 'error');
  }
}

// Validate interview code
async function validateInterviewCode(code) {
  try {
    const response = await API.interviews.getByCode(code);
    return response.data;
  } catch (error) {
    console.log('API not available, checking localStorage');
    // Fallback to localStorage
    const interviews = JSON.parse(localStorage.getItem('interviews') || '[]');
    const interview = interviews.find(i => i.code === code);
    
    if (interview) {
      return interview;
    }
    
    return null;
  }
}

// Start interview
async function startInterview(interview) {
  updateConnectionStatus('Подключение...');
  
  try {
    // Initialize WebRTC
    await initializeWebRTC();
    
    // Start timer
    startTimer();
    
    // Initialize media
    await initializeMedia();
    
    // Start AI analysis
    startAIAnalysis();
    
    // Simulate other participant joining
    setTimeout(() => {
      simulateParticipantJoin();
      updateConnectionStatus('Подключено');
    }, 2000);
    
    utils.showToast('Добро пожаловать в комнату собеседования!', 'success');
    
  } catch (error) {
    console.error('Error starting interview:', error);
    updateConnectionStatus('Ошибка подключения');
    utils.showToast('Ошибка запуска собеседования', 'error');
  }
}

// Initialize WebRTC
async function initializeWebRTC() {
  // Create peer connection
  peerConnection = new RTCPeerConnection(rtcConfiguration);
  
  // Handle ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      // In real implementation, send ICE candidate to signaling server
      console.log('ICE candidate:', event.candidate);
    }
  };
  
  // Handle connection state change
  peerConnection.onconnectionstatechange = () => {
    console.log('Connection state:', peerConnection.connectionState);
    updateConnectionStatus(peerConnection.connectionState);
  };
  
  // Handle remote stream
  peerConnection.ontrack = (event) => {
    if (event.streams[0]) {
      remoteStream = event.streams[0];
      const remoteVideo = document.getElementById('remoteVideo');
      remoteVideo.srcObject = remoteStream;
    }
  };
}

// Initialize media
async function initializeMedia() {
  try {
    // Get user media
    localStream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    });
    
    // Add local stream to peer connection
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });
    
    // Display local video
    const localVideo = document.getElementById('localVideo');
    localVideo.srcObject = localStream;
    
    // Update indicators
    updateMediaIndicators();
    
  } catch (error) {
    console.error('Error accessing media devices:', error);
    utils.showToast('Не удалось получить доступ к камере и микрофону', 'error');
  }
}

// Update connection status
function updateConnectionStatus(status) {
  const statusElement = document.getElementById('connectionStatus');
  if (statusElement) {
    statusElement.textContent = status;
    statusElement.className = 'connection-status ' + status.toLowerCase().replace(' ', '-');
  }
}

// Update media indicators
function updateMediaIndicators() {
  const audioIndicator = document.getElementById('audioIndicator');
  const videoIndicator = document.getElementById('videoIndicator');
  const networkIndicator = document.getElementById('networkIndicator');
  
  if (audioIndicator) {
    audioIndicator.textContent = isMuted ? '🔇' : '🔊';
    audioIndicator.className = 'indicator ' + (isMuted ? 'inactive' : 'active');
  }
  
  if (videoIndicator) {
    videoIndicator.textContent = isVideoOff ? '📵' : '📹';
    videoIndicator.className = 'indicator ' + (isVideoOff ? 'inactive' : 'active');
  }
  
  if (networkIndicator) {
    const connectionState = peerConnection?.connectionState || 'disconnected';
    networkIndicator.textContent = connectionState === 'connected' ? '📶' : '📵';
    networkIndicator.className = 'indicator ' + (connectionState === 'connected' ? 'active' : 'inactive');
  }
}

// Toggle mute
function toggleMute() {
  isMuted = !isMuted;
  
  if (localStream) {
    localStream.getAudioTracks().forEach(track => {
      track.enabled = !isMuted;
    });
  }
  
  updateMediaIndicators();
  console.log('Mute:', isMuted);
}

// Toggle video
function toggleVideo() {
  isVideoOff = !isVideoOff;
  
  if (localStream) {
    localStream.getVideoTracks().forEach(track => {
      track.enabled = !isVideoOff;
    });
  }
  
  updateMediaIndicators();
  console.log('Video:', isVideoOff);
}

// Toggle screen share
async function toggleScreenShare() {
  try {
    if (isScreenSharing) {
      // Stop screen share
      const screenTrack = localStream.getTracks().find(track => track.kind === 'video');
      if (screenTrack && screenTrack.label.includes('screen')) {
        localStream.removeTrack(screenTrack);
        screenTrack.stop();
      }
      
      // Restart camera
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream = cameraStream;
      
      // Update peer connection
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
      
      const localVideo = document.getElementById('localVideo');
      localVideo.srcObject = localStream;
      
      isScreenSharing = false;
      utils.showToast('Демонстрация экрана остановлена', 'info');
    } else {
      // Start screen share
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true, 
        audio: true 
      });
      
      // Replace video track
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        peerConnection.removeTrack(videoTrack, localStream);
        localStream.removeTrack(videoTrack);
      }
      
      // Add screen track
      screenStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, screenStream);
      });
      
      const localVideo = document.getElementById('localVideo');
      localVideo.srcObject = screenStream;
      
      isScreenSharing = true;
      utils.showToast('Демонстрация экрана начата', 'success');
    }
  } catch (error) {
    console.error('Error toggling screen share:', error);
    utils.showToast('Ошибка демонстрации экрана', 'error');
  }
}

// Toggle recording
function toggleRecording() {
  isRecording = !isRecording;
  const recordBtn = document.getElementById('recordBtn');
  const recordingIndicator = document.getElementById('recordingIndicator');
  const recordingTime = document.getElementById('recordingTime');
  
  if (isRecording) {
    // Start recording
    recordingStartTime = Date.now();
    recordBtn.textContent = '⏹️ Остановить запись';
    recordBtn.className = 'btn btn-danger';
    recordingIndicator.style.display = 'flex';
    
    // Start recording timer
    startRecordingTimer();
    
    // Start transcription
    startTranscription();
    
    utils.showToast('Запись начата', 'success');
  } else {
    // Stop recording
    recordBtn.textContent = '⏺️ Запись';
    recordBtn.className = 'btn btn-danger';
    recordingIndicator.style.display = 'none';
    recordingTime.style.display = 'none';
    
    // Stop recording timer
    stopRecordingTimer();
    
    // Stop transcription
    stopTranscription();
    
    utils.showToast('Запись остановлена', 'info');
  }
}

// Start recording timer
function startRecordingTimer() {
  updateRecordingDuration();
  transcriptionInterval = setInterval(updateRecordingDuration, 1000);
}

// Stop recording timer
function stopRecordingTimer() {
  if (transcriptionInterval) {
    clearInterval(transcriptionInterval);
    transcriptionInterval = null;
  }
}

// Update recording duration
function updateRecordingDuration() {
  if (!recordingStartTime) return;
  
  const elapsed = Date.now() - recordingStartTime;
  const hours = Math.floor(elapsed / 3600000);
  const minutes = Math.floor((elapsed % 3600000) / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  document.getElementById('recordingDuration').textContent = timeString;
}

// Start transcription
function startTranscription() {
  const transcriptionText = document.getElementById('transcriptionText');
  transcriptionText.innerHTML = '<p class="transcription-placeholder">Идет транскрипция...</p>';
  
  // Simulate real-time transcription
  let transcriptionIndex = 0;
  const transcriptionInterval = setInterval(() => {
    if (!isRecording) {
      clearInterval(transcriptionInterval);
      return;
    }
    
    // Simulate transcription segments
    const segments = [
      "Здравствуйте, рад сегодня с вами познакомиться.",
      "Расскажите, пожалуйста, о вашем опыте работы.",
      "Какие технологии вы использовали в предыдущих проектах?",
      "Опишите вашу самую интересную задачу, которую вы решали.",
      "Какие у вас карьерные цели на ближайшие годы?",
      "Что вас мотивирует в работе?",
      "Как вы справляетесь со сложными задачами?",
      "Спасибо за подробные ответы."
    ];
    
    if (transcriptionIndex < segments.length) {
      addTranscriptionSegment(segments[transcriptionIndex]);
      transcriptionIndex++;
    }
  }, 3000); // New segment every 3 seconds
}

// Stop transcription
function stopTranscription() {
  // In real implementation, this would stop the transcription service
  console.log('Transcription stopped');
}

// Add transcription segment
function addTranscriptionSegment(text) {
  const transcriptionText = document.getElementById('transcriptionText');
  
  // Remove placeholder if exists
  const placeholder = transcriptionText.querySelector('.transcription-placeholder');
  if (placeholder) {
    placeholder.remove();
  }
  
  // Add new segment with timestamp
  const timestamp = new Date().toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
  
  const segment = document.createElement('div');
  segment.className = 'transcription-segment';
  segment.innerHTML = `
    <div class="transcription-timestamp">[${timestamp}]</div>
    <div class="transcription-content">${text}</div>
  `;
  
  transcriptionText.appendChild(segment);
  transcriptionText.scrollTop = transcriptionText.scrollHeight;
}

// Simulate participant join
function simulateParticipantJoin() {
  const remoteVideo = document.getElementById('remoteVideo');
  const participantsList = document.getElementById('participantsList');
  
  // Show remote video
  remoteVideo.style.display = 'block';
  
  // Add to participants list
  const participantItem = document.createElement('div');
  participantItem.className = 'participant-item';
  participantItem.innerHTML = `
    <div class="participant-avatar">АС</div>
    <div class="participant-info">
      <p>Айдар Сапаров</p>
      <span class="badge badge-success">В комнате</span>
    </div>
  `;
  
  participantsList.appendChild(participantItem);
  
  utils.showToast('Айдар Сапаров присоединился к собеседованию', 'info');
  
  // Add welcome message to chat
  addChatMessage('Система', 'Айдар Сапаров присоединился к собеседованию', 'system');
}

// Start timer
function startTimer() {
  startTime = Date.now();
  
  timerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timer').textContent = timeString;
  }, 1000);
}

// Start AI analysis
function startAIAnalysis() {
  const analysisContainer = document.getElementById('aiAnalysis');
  
  // Simulate AI analysis updates
  setTimeout(() => {
    updateAIAnalysis('Начинаю анализ речи и поведения...', 'info');
  }, 5000);
  
  setTimeout(() => {
    updateAIAnalysis('Обнаружена уверенная речь, хороший темп разговора', 'positive');
  }, 15000);
  
  setTimeout(() => {
    updateAIAnalysis('Анализ технических ответов...', 'info');
  }, 30000);
  
  setTimeout(() => {
    updateAIAnalysis('Кандидат показывает хорошие коммуникативные навыки', 'positive');
  }, 45000);
  
  setTimeout(() => {
    updateAIMetrics();
  }, 60000);
}

// Update AI analysis
function updateAIAnalysis(message, type) {
  const analysisContainer = document.getElementById('aiAnalysis');
  
  const analysisItem = document.createElement('div');
  analysisItem.className = 'ai-analysis-item';
  
  const icon = type === 'positive' ? '✅' : type === 'negative' ? '⚠️' : 'ℹ️';
  
  analysisItem.innerHTML = `
    <h5>${icon} AI Анализ</h5>
    <p>${message}</p>
  `;
  
  analysisContainer.appendChild(analysisItem);
  analysisContainer.scrollTop = analysisContainer.scrollHeight;
}

// Update AI metrics
function updateAIMetrics() {
  const analysisContainer = document.getElementById('aiAnalysis');
  
  const metricsHTML = `
    <div class="analysis-metrics-detailed">
      <div class="metric-item">
        <div class="metric-value">85%</div>
        <div class="metric-label">Уверенность</div>
        <div class="metric-change positive">+5%</div>
      </div>
      <div class="metric-item">
        <div class="metric-value">92%</div>
        <div class="metric-label">Ясность речи</div>
        <div class="metric-change positive">+2%</div>
      </div>
      <div class="metric-item">
        <div class="metric-value">78%</div>
        <div class="metric-label">Технические знания</div>
        <div class="metric-change negative">-3%</div>
      </div>
      <div class="metric-item">
        <div class="metric-value">88%</div>
        <div class="metric-label">Коммуникация</div>
        <div class="metric-change positive">+8%</div>
      </div>
    </div>
  `;
  
  analysisContainer.insertAdjacentHTML('beforeend', metricsHTML);
}

// Toggle AI analysis panel
function toggleAIAnalysis() {
  const analysisContainer = document.getElementById('aiAnalysis');
  analysisContainer.classList.toggle('ai-analysis-expanded');
  analysisContainer.classList.toggle('ai-analysis-collapsed');
}

// Send message
function sendMessage() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();
  
  if (message) {
    addChatMessage('Вы', message, 'own');
    input.value = '';
    
    // In real implementation, this would send message via WebRTC
    console.log('Sending message:', message);
  }
}

// Add chat message
function addChatMessage(sender, message, type = 'other') {
  const chatMessages = document.getElementById('chatMessages');
  
  // Clear placeholder if it exists
  const placeholder = chatMessages.querySelector('.chat-placeholder');
  if (placeholder) {
    placeholder.remove();
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${type}`;
  
  const time = new Date().toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  messageDiv.innerHTML = `
    <div class="sender">${sender}</div>
    <div>${message}</div>
    <div class="time">${time}</div>
  `;
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// End call
function endCall() {
  // Show confirmation dialog
  if (confirm('Вы уверены, что хотите завершить звонок?')) {
    // Stop recording if active
    if (isRecording) {
      toggleRecording();
    }
    
    // Stop media streams
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
    }
    
    // Stop timer
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    // Show call ended message
    utils.showToast('Звонок завершен', 'success');
    
    // Redirect based on user role
    const user = API.helpers.getUser();
    if (user && user.role === 'employer') {
      setTimeout(() => {
        window.location.href = 'my-jobs.html';
      }, 1000);
    } else {
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    }
  }
}

// Leave room
function leaveRoom() {
  if (confirm('Вы уверены, что хотите покинуть собеседование?')) {
    // Stop timer
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    // Stop recording
    if (isRecording) {
      toggleRecording();
    }
    
    // Stop media streams
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
    }
    
    // In real implementation, this would close WebRTC connections
    console.log('Leaving interview room');
    
    utils.showToast('Вы покинули собеседование', 'info');
    
    // Redirect based on user role
    const user = API.helpers.getUser();
    if (user && user.role === 'employer') {
      window.location.href = 'my-jobs.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  }
}

// Handle page unload
window.addEventListener('beforeunload', function() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  if (transcriptionInterval) {
    clearInterval(transcriptionInterval);
  }
  
  // Stop media streams
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  
  // Close peer connection
  if (peerConnection) {
    peerConnection.close();
  }
});
