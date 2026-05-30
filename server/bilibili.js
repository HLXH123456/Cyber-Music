const fetch = require('node-fetch');

const BILIBILI_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://www.bilibili.com',
  'Cookie': 'buvid3=infoc'
};

async function searchBilibili(keyword, page = 1, pageSize = 10) {
  const musicKeywords = ['音乐', 'MV', '歌曲', '原声'];
  let searchKeyword = keyword;
  if (!musicKeywords.some(mk => keyword.includes(mk))) {
    searchKeyword = `${keyword} 音乐`;
  }

  const searchUrl = `https://api.bilibili.com/x/web-interface/search/all/v2?keyword=${encodeURIComponent(searchKeyword)}&page=${page}&page_size=${pageSize + 5}`;

  const response = await fetch(searchUrl, { headers: BILIBILI_HEADERS });
  const data = await response.json();

  if (data.code !== 0 || !data.data) {
    throw new Error('Failed to fetch from Bilibili');
  }

  const videoResults = data.data.result.find(r => r.result_type === 'video');
  if (!videoResults || !videoResults.data) {
    return [];
  }

  // Filter for music content: duration 1-20 minutes
  const musicResults = videoResults.data.filter(item => {
    const parts = item.duration.split(':');
    const totalMinutes = parseInt(parts[0]) + parseInt(parts[1]) / 60;
    return totalMinutes >= 1 && totalMinutes <= 20;
  });

  // Sort by play count descending (play can be "--" string for hidden counts)
  musicResults.sort((a, b) => (parseInt(b.play) || 0) - (parseInt(a.play) || 0));

  return musicResults.slice(0, pageSize).map(item => ({
    bvid: item.bvid,
    title: item.title.replace(/<[^>]*>/g, ''),
    author: item.author,
    duration: item.duration,
    play: item.play,
    pic: item.pic.startsWith('//') ? `https:${item.pic}` : item.pic,
    description: item.description || ''
  }));
}

module.exports = { searchBilibili, BILIBILI_HEADERS };
