// server.js
const express = require('express');
const line = require('@line/bot-sdk');

// ------------------- 關鍵設定 -------------------
// 這些資訊需要從你的 LINE Developers Console 和 Render 環境變數中取得
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};
// ---------------------------------------------

const app = express();
const client = new line.Client(config);

// 根路徑，用來測試伺服器是否正常運行
app.get('/', (req, res) => {
  res.send('LINE Bot Webhook 伺服器正在運行，並且準備好接收請求了！');
});

// Webhook 的主要路徑，並使用 LINE SDK 的中介軟體來驗證請求
app.post('/webhook', line.middleware(config), (req, res) => {
  // 確保請求 body 和 events 存在
  if (!req.body || !req.body.events) {
    return res.status(200).send('OK');
  }

  // 使用 Promise.all 來處理所有事件，確保伺服器能快速回應
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// 核心的事件處理函式
async function handleEvent(event) {
  // 如果不是訊息事件，或不是文字訊息，就忽略
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  // ⭐️⭐️⭐️ 主要邏輯：當用戶輸入 'profile' 時觸發 ⭐️⭐️⭐️
  if (event.message.text.toLowerCase() === 'profile') {
    const userId = event.source.userId;
    
    try {
      // 步驟 1: 使用 userId 呼叫 Get Profile API
      const userProfile = await client.getProfile(userId);

      // 步驟 2: 組合要回覆的文字訊息
      const replyText = `嗨！這是我知道關於你的資訊：\n\n` +
                      `👤 顯示名稱:\n${userProfile.displayName}\n\n` +
                      `💬 狀態消息:\n${userProfile.statusMessage || '(無)'}\n\n` +
                      `🖼️ 頭像 URL:\n${userProfile.pictureUrl}\n\n` +
                      `🔑 你的 User ID (開發用):\n${userId}`;

      // 步驟 3: 建立一個 LINE 的文字訊息物件
      const message = {
        type: 'text',
        text: replyText,
      };

      // 步驟 4: 使用 replyToken 將訊息回覆給用戶
      return client.replyMessage(event.replyToken, message);

    } catch (error) {
      console.error('獲取個人資料或回覆時出錯:', error);
      // 如果出錯，也可以回覆一則錯誤訊息給用戶
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '抱歉，獲取您的資料時發生了一點問題。'
      });
    }
  }

  // 如果訊息不是 'profile'，可以選擇不回覆或做其他處理
  return Promise.resolve(null);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`伺服器啟動，監聽埠號 ${PORT}`);
});