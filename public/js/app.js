// ============================================
// CYBER MUSIC - Main Application Logic
// ============================================

const API_BASE = '';

// DOM Elements
const chatContainer = document.getElementById('chatContainer');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const resultsContainer = document.getElementById('resultsContainer');
const resultsStatus = document.getElementById('resultsStatus');
const playlistContainer = document.getElementById('playlistContainer');
const playlistCount = document.getElementById('playlistCount');
const trackCount = document.getElementById('trackCount');
const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const volumeSlider = document.getElementById('volumeSlider');
const progressFill = document.getElementById('progressFill');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const npTitle = document.getElementById('npTitle');

// State
let playlist = [];
let currentTrackIndex = -1;
let isPlaying = false;
let danmakuList = [];
let danmakuTimer = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadPlaylist();
  setupEventListeners();
});

function setupEventListeners() {
  // Chat input
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  sendBtn.addEventListener('click', sendMessage);

  // Player controls
  playBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', playPrev);
  nextBtn.addEventListener('click', playNext);
  volumeSlider.addEventListener('input', updateVolume);

  // Audio events
  audioPlayer.addEventListener('timeupdate', updateProgress);
  audioPlayer.addEventListener('loadedmetadata', updateDuration);
  audioPlayer.addEventListener('ended', playNext);

  // Progress bar click
  document.querySelector('.progress-bar').addEventListener('click', seekAudio);
}

// Chat Functions
function sendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  // Add user message
  addChatMessage(message, 'user');
  chatInput.value = '';

  // Simulate agent thinking
  setTimeout(() => {
    searchMusic(message);
  }, 500);
}

function addChatMessage(text, type = 'agent') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${type}`;

  const avatarIcon = type === 'agent' ? '⚡' : '👤';
  const senderName = type === 'agent' ? 'AGENT' : 'USER';
  const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  messageDiv.innerHTML = `
    <div class="message-avatar">
      <span class="avatar-icon">${avatarIcon}</span>
    </div>
    <div class="message-content">
      <div class="message-header">
        <span class="sender">${senderName}</span>
        <span class="time">${time}</span>
      </div>
      <div class="message-text">${text}</div>
    </div>
  `;

  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addLoadingMessage() {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'chat-message agent';
  messageDiv.id = 'loadingMessage';

  messageDiv.innerHTML = `
    <div class="message-avatar">
      <span class="avatar-icon">⚡</span>
    </div>
    <div class="message-content">
      <div class="message-header">
        <span class="sender">AGENT</span>
        <span class="time">NOW</span>
      </div>
      <div class="message-text">
        正在搜索 <span class="loading-dots"><span></span><span></span><span></span></span>
      </div>
    </div>
  `;

  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoadingMessage() {
  const loadingMsg = document.getElementById('loadingMessage');
  if (loadingMsg) loadingMsg.remove();
}

// Search Functions
async function searchMusic(keyword) {
  addLoadingMessage();
  resultsStatus.textContent = 'SEARCHING';
  resultsStatus.style.borderColor = 'var(--accent)';
  resultsStatus.style.color = 'var(--accent)';

  try {
    const response = await fetch(`${API_BASE}/api/search?keyword=${encodeURIComponent(keyword)}`);
    const data = await response.json();

    removeLoadingMessage();

    if (data.results && data.results.length > 0) {
      addChatMessage(`找到 ${data.results.length} 个结果。请选择你想转换的视频：`);
      displayResults(data.results);
      resultsStatus.textContent = `${data.results.length} FOUND`;
      resultsStatus.style.borderColor = 'var(--success)';
      resultsStatus.style.color = 'var(--success)';
    } else {
      addChatMessage('未找到相关结果，请尝试其他关键词。');
      resultsStatus.textContent = 'NO RESULTS';
      resultsStatus.style.borderColor = 'var(--danger)';
      resultsStatus.style.color = 'var(--danger)';
    }
  } catch (error) {
    removeLoadingMessage();
    addChatMessage('搜索出错了，请稍后重试。');
    resultsStatus.textContent = 'ERROR';
    resultsStatus.style.borderColor = 'var(--danger)';
    resultsStatus.style.color = 'var(--danger)';
    resultsContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">◉</div><div class="empty-text">搜索失败，请重试</div></div>';
  }
}

function displayResults(results) {
  resultsContainer.innerHTML = results.map((result, index) => `
    <div class="result-card" data-index="${index}">
      <img class="result-thumb" src="${result.pic}" alt="${result.title}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 120 68%22%3E%3Crect fill=%22%2312121a%22 width=%22120%22 height=%2268%22/%3E%3Ctext fill=%22%23555577%22 font-family=%22monospace%22 font-size=%2212%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENO IMG%3C/text%3E%3C/svg%3E'">
      <div class="result-info">
        <div class="result-title" title="${result.title}">${result.title}</div>
        <div class="result-meta">
          <span>UP: ${result.author}</span>
          <span>时长: ${result.duration}</span>
          <span>播放: ${formatNumber(result.play)}</span>
        </div>
      </div>
      <div class="result-action">
        <button class="convert-btn">CONVERT</button>
      </div>
    </div>
  `).join('');

  resultsContainer.querySelectorAll('.convert-btn').forEach((btn, i) => {
    btn.addEventListener('click', () => convertVideo(results[i].bvid, results[i].title, btn));
  });
}

// Conversion Functions
async function convertVideo(bvid, title, btn) {
  btn.disabled = true;
  btn.classList.add('converting');
  btn.textContent = 'CONVERTING...';

  addChatMessage(`正在转换: ${title}`);

  try {
    const response = await fetch(`${API_BASE}/api/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bvid, title })
    });

    const data = await response.json();

    if (data.success) {
      playlist = data.playlist;
      updatePlaylist();
      addChatMessage(`✓ 转换成功！已添加到播放列表: ${title}`);
      btn.textContent = 'ADDED';
      btn.style.borderColor = 'var(--success)';
      btn.style.color = 'var(--success)';
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    addChatMessage(`转换失败: ${error.message || '请稍后重试'}`);
    btn.textContent = 'FAILED';
    btn.style.borderColor = 'var(--danger)';
    btn.style.color = 'var(--danger)';
    setTimeout(() => {
      btn.disabled = false;
      btn.classList.remove('converting');
      btn.textContent = 'CONVERT';
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 2000);
  }
}

// Playlist Functions
async function loadPlaylist() {
  try {
    const response = await fetch(`${API_BASE}/api/playlist`);
    const data = await response.json();
    playlist = data.playlist || [];
    updatePlaylist();
  } catch (error) {
    console.error('Failed to load playlist:', error);
  }
}

function updatePlaylist() {
  playlistCount.textContent = `${playlist.length} TRACKS`;
  trackCount.textContent = playlist.length;

  if (playlist.length === 0) {
    playlistContainer.innerHTML = '<div class="empty-playlist"><span>播放列表为空</span></div>';
    return;
  }

  playlistContainer.innerHTML = playlist.map((track, index) => `
    <div class="playlist-item ${index === currentTrackIndex ? 'active' : ''}" onclick="playTrack(${index})">
      <span class="playlist-item-number">${String(index + 1).padStart(2, '0')}</span>
      <span class="playlist-item-title">${track.title}</span>
      <button class="playlist-item-delete" onclick="event.stopPropagation(); deleteTrack('${track.id}')">×</button>
    </div>
  `).join('');
}

async function deleteTrack(id) {
  try {
    await fetch(`${API_BASE}/api/playlist/${id}`, { method: 'DELETE' });
    playlist = playlist.filter(track => track.id !== id);
    updatePlaylist();
  } catch (error) {
    console.error('Failed to delete track:', error);
  }
}

// Player Functions
function playTrack(index) {
  if (index < 0 || index >= playlist.length) return;

  currentTrackIndex = index;
  const track = playlist[index];

  audioPlayer.src = track.audioPath;
  audioPlayer.play();
  isPlaying = true;
  playIcon.textContent = '⏸';
  npTitle.textContent = track.title;

  updatePlaylist();

  // Load danmaku for this track
  loadDanmaku(track.bvid);
}

function togglePlay() {
  if (currentTrackIndex === -1 && playlist.length > 0) {
    playTrack(0);
    return;
  }

  if (isPlaying) {
    audioPlayer.pause();
    isPlaying = false;
    playIcon.textContent = '▶';
  } else if (audioPlayer.src) {
    audioPlayer.play();
    isPlaying = true;
    playIcon.textContent = '⏸';
    // Resume danmaku if stopped
    if (danmakuList.length > 0 && !danmakuTimer) {
      startDanmaku();
    }
  }
}

function playPrev() {
  if (currentTrackIndex > 0) {
    playTrack(currentTrackIndex - 1);
  } else if (playlist.length > 0) {
    playTrack(playlist.length - 1);
  }
}

function playNext() {
  if (currentTrackIndex < playlist.length - 1) {
    playTrack(currentTrackIndex + 1);
  } else if (playlist.length > 0) {
    playTrack(0);
  }
}

function updateVolume() {
  audioPlayer.volume = volumeSlider.value / 100;
}

function updateProgress() {
  const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
  progressFill.style.width = `${progress}%`;
  currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
}

function updateDuration() {
  durationEl.textContent = formatTime(audioPlayer.duration);
}

function seekAudio(e) {
  const rect = e.target.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  audioPlayer.currentTime = percent * audioPlayer.duration;
}

// Danmaku Functions
let displayedDanmaku = new Set();

async function loadDanmaku(bvid) {
  // Clear previous danmaku
  stopDanmaku();

  try {
    const response = await fetch(`${API_BASE}/api/danmaku?bvid=${bvid}`);
    const data = await response.json();

    if (data.danmaku && data.danmaku.length > 0) {
      danmakuList = data.danmaku;
      displayedDanmaku = new Set();
      startDanmaku();
    }
  } catch (error) {
    console.error('Failed to load danmaku:', error);
  }
}

function startDanmaku() {
  if (danmakuList.length === 0) return;

  const overlay = document.getElementById('danmakuOverlay');
  let index = 0;

  // Clear existing danmaku
  overlay.innerHTML = '';

  // Shuffle danmaku for variety
  const shuffled = [...danmakuList].sort(() => Math.random() - 0.5);

  // Display danmaku at intervals
  danmakuTimer = setInterval(() => {
    if (!isPlaying) return;

    // Find next undisplayed danmaku
    let found = false;
    for (let i = 0; i < shuffled.length; i++) {
      const currentIndex = (index + i) % shuffled.length;
      const danmaku = shuffled[currentIndex];
      if (!displayedDanmaku.has(danmaku.text)) {
        createDanmakuItem(overlay, danmaku.text);
        displayedDanmaku.add(danmaku.text);
        index = (currentIndex + 1) % shuffled.length;
        found = true;
        break;
      }
    }

    // If all displayed, stop
    if (!found) {
      clearInterval(danmakuTimer);
      danmakuTimer = null;
    }
  }, 1500);
}

function stopDanmaku() {
  if (danmakuTimer) {
    clearInterval(danmakuTimer);
    danmakuTimer = null;
  }
  const overlay = document.getElementById('danmakuOverlay');
  if (overlay) overlay.innerHTML = '';
  danmakuList = [];
  displayedDanmaku.clear();
}

function createDanmakuItem(container, text) {
  const item = document.createElement('div');
  item.className = 'danmaku-item';
  item.textContent = text;

  // Random vertical position (top 80% of screen)
  const top = Math.random() * 80;
  item.style.top = `${top}%`;

  // Random neon colors
  const colors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff88', '#ff6600', '#ff0066'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  item.style.color = color;
  item.style.textShadow = `0 0 10px ${color}, 0 0 20px ${color}`;

  // Duration 8-12 seconds
  const duration = 8 + Math.random() * 4;
  item.style.animationDuration = `${duration}s`;

  container.appendChild(item);

  // Remove after animation
  setTimeout(() => {
    item.remove();
  }, duration * 1000);
}

// Utility Functions
function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
}

