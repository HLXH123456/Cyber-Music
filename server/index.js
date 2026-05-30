const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const zlib = require('zlib');
const { searchBilibili, BILIBILI_HEADERS } = require('./bilibili');
const { convertToAudio, getAudioPath, getCid } = require('./converter');

const app = express();
const PORT = 3000;

const PLAYLIST_FILE = path.join(__dirname, '../playlist.json');

// Simple in-memory rate limiter
const rateLimitMap = new Map();
function rateLimit(windowMs = 1000, maxRequests = 5) {
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const record = rateLimitMap.get(ip) || { count: 0, resetAt: now + windowMs };

    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + windowMs;
    }

    record.count++;
    rateLimitMap.set(ip, record);

    if (record.count > maxRequests) {
      return res.status(429).json({ error: '请求过于频繁，请稍后再试' });
    }
    next();
  };
}

// Clean up stale rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap) {
    if (now > record.resetAt) rateLimitMap.delete(ip);
  }
}, 60000);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/audio', express.static(path.join(__dirname, '../downloads')));

// Load playlist from file
function loadPlaylist() {
  try {
    if (fs.existsSync(PLAYLIST_FILE)) {
      const data = fs.readFileSync(PLAYLIST_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load playlist:', e);
  }
  return [];
}

// Save playlist to file
function savePlaylist(playlist) {
  try {
    fs.writeFileSync(PLAYLIST_FILE, JSON.stringify(playlist, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save playlist:', e);
  }
}

// Initialize playlist
let playlist = loadPlaylist();

// Search Bilibili (rate limited)
app.get('/api/search', rateLimit(1000, 3), async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) {
    return res.status(400).json({ error: 'Keyword is required' });
  }

  try {
    const results = await searchBilibili(keyword);
    res.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Convert video to audio (rate limited)
app.post('/api/convert', rateLimit(2000, 2), async (req, res) => {
  const { bvid, title } = req.body;
  if (!bvid) {
    return res.status(400).json({ error: 'BV ID is required' });
  }

  try {
    const audioFile = await convertToAudio(bvid, title);
    const audioPath = `/audio/${audioFile}`;

    const track = {
      id: Date.now().toString(),
      title: title || `Track ${playlist.length + 1}`,
      bvid,
      audioPath,
      addedAt: new Date().toISOString()
    };
    playlist.push(track);
    savePlaylist(playlist);

    res.json({ success: true, track, playlist });
  } catch (error) {
    console.error('Convert error:', error);
    res.status(500).json({ error: 'Conversion failed' });
  }
});

// Get playlist
app.get('/api/playlist', (req, res) => {
  res.json({ playlist });
});

// Remove from playlist
app.delete('/api/playlist/:id', (req, res) => {
  const { id } = req.params;
  playlist = playlist.filter(track => track.id !== id);
  savePlaylist(playlist);
  res.json({ playlist });
});

// Get danmaku (bullet comments) for a video
app.get('/api/danmaku', async (req, res) => {
  const { bvid } = req.query;
  if (!bvid) {
    return res.status(400).json({ error: 'BV ID is required' });
  }

  try {
    const cid = await getCid(bvid);

    const danmakuUrl = `https://api.bilibili.com/x/v1/dm/list.so?oid=${cid}`;
    const danmakuRes = await fetch(danmakuUrl, {
      headers: {
        ...BILIBILI_HEADERS,
        'Accept-Encoding': 'gzip, deflate'
      }
    });

    const buffer = await danmakuRes.buffer();

    let xmlData;
    try {
      xmlData = zlib.inflateSync(buffer).toString('utf-8');
    } catch {
      xmlData = buffer.toString('utf-8');
    }

    const danmaku = [];
    const regex = /<d[^>]*>([^<]+)<\/d>/g;
    let match;
    while ((match = regex.exec(xmlData)) !== null) {
      danmaku.push({ text: match[1] });
    }

    res.json({ danmaku });
  } catch (error) {
    console.error('Danmaku error:', error);
    res.json({ danmaku: [] });
  }
});

app.listen(PORT, () => {
  console.log(`Cyber Music Server running at http://localhost:${PORT}`);
});
