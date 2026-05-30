const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const { pipeline } = require('stream/promises');
const { BILIBILI_HEADERS } = require('./bilibili');

const DOWNLOADS_DIR = path.join(__dirname, '../downloads');

if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
}

// Get video cid from bvid
async function getCid(bvid) {
  const url = `https://api.bilibili.com/x/player/pagelist?bvid=${bvid}`;
  const res = await fetch(url, { headers: BILIBILI_HEADERS });
  const data = await res.json();
  if (data.code === 0 && data.data && data.data.length > 0) {
    return data.data[0].cid;
  }
  throw new Error('Failed to get cid');
}

// Get audio stream URL
async function getAudioUrl(bvid, cid) {
  const url = `https://api.bilibili.com/x/player/wbi/playurl?bvid=${bvid}&cid=${cid}&fnval=16&qn=64`;
  const res = await fetch(url, { headers: BILIBILI_HEADERS });
  const data = await res.json();

  if (data.code === 0 && data.data) {
    if (data.data.dash && data.data.dash.audio && data.data.dash.audio.length > 0) {
      return data.data.dash.audio[0].baseUrl || data.data.dash.audio[0].base_url;
    }
    if (data.data.durl && data.data.durl.length > 0) {
      return data.data.durl[0].url;
    }
  }
  throw new Error('Failed to get audio URL');
}

// Download audio stream
async function downloadAudio(audioUrl, outputPath) {
  const res = await fetch(audioUrl, {
    headers: {
      ...BILIBILI_HEADERS,
      'Origin': 'https://www.bilibili.com'
    }
  });

  if (!res.ok) throw new Error('Download failed');

  await pipeline(res.body, fs.createWriteStream(outputPath));
}

async function convertToAudio(bvid, title) {
  const filename = `${sanitizeFilename(title || bvid)}_${Date.now()}.m4a`;
  const outputPath = path.join(DOWNLOADS_DIR, filename);

  try {
    const cid = await getCid(bvid);
    const audioUrl = await getAudioUrl(bvid, cid);
    await downloadAudio(audioUrl, outputPath);
    return filename;
  } catch (error) {
    // Clean up partial file on failure
    if (fs.existsSync(outputPath)) {
      try { fs.unlinkSync(outputPath); } catch {}
    }
    console.error('Convert error:', error.message);
    throw new Error('转换失败: ' + error.message);
  }
}

function getAudioPath(filename) {
  return path.join(DOWNLOADS_DIR, filename);
}

module.exports = { convertToAudio, getAudioPath, getCid };
