# CYBER MUSIC - AI 音乐播放器

赛博朋克风格的 AI 音乐播放器，通过 AI Agent 从 Bilibili 搜索并转换音乐。

## 功能特性

- 赛博朋克风格 UI 设计
- AI Agent 对话界面
- Bilibili 视频搜索（按播放量排序）
- 视频转音频功能（直接调用 B 站 API）
- 音乐播放器
- 播放列表管理（持久化存储）
- 弹幕展示

## 环境要求

- Node.js 14+

## 安装步骤

### 1. 安装 Node.js

从 https://nodejs.org/ 下载并安装 Node.js

### 2. 安装项目依赖

```bash
cd cyber-music
npm install
```

## 启动服务

### Windows

双击 `start.bat` 或运行:

```bash
npm start
```

### Linux/Mac

```bash
npm start
```

## 使用方法

1. 启动服务后，打开浏览器访问 http://localhost:3000
2. 在 AI Agent 终端输入你想听的歌曲名或歌手名
3. 从搜索结果中选择一个视频
4. 点击 "CONVERT" 按钮将视频转换为音频
5. 转换完成后，音频会自动添加到播放列表
6. 点击播放列表中的曲目即可播放

## 项目结构

```
cyber-music/
├── server/
│   ├── index.js          # Express 服务器
│   ├── bilibili.js       # Bilibili 搜索 API
│   └── converter.js      # 音频转换模块
├── public/
│   ├── index.html        # 主页面
│   ├── css/
│   │   └── style.css     # 赛博朋克样式
│   └── js/
│       └── app.js        # 前端逻辑
├── downloads/            # 下载的音频文件（已 gitignore）
├── playlist.json         # 播放列表数据（已 gitignore）
├── start.bat             # Windows 启动脚本
├── package.json
└── README.md
```

## 技术栈

- **前端**: HTML5, CSS3, JavaScript
- **后端**: Node.js, Express
- **API**: Bilibili 搜索/播放 API

## 注意事项

- 音频文件保存在 `downloads/` 目录，播放列表持久化到 `playlist.json`
- 请确保网络连接正常以访问 Bilibili API
- API 请求设有速率限制，避免频繁调用

## 许可证

本项目基于 MIT License 开源，详情请查看 [LICENSE](./LICENSE) 文件。
