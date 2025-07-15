// server.js (超級偵錯版)
const express = require('express');
const line = require('@line/bot-sdk');

console.log('伺服器腳本開始執行...');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// 檢查環境變數是否成功載入
if (!config.channelAccessToken || !config.channelSecret) {
  console.error('❌ 嚴重錯誤：Channel Access Token 或 Channel Secret 未設定！請檢查 Render 環境變數。');
  process.exit(1); // 直接退出，防止伺服器在錯誤狀態下運行
}
console.log('✅ 環境變數成功載入。');


const app = express();
const client = new line.Client(config);

app.get('/', (req, res) => {
  res.send('LINE Bot Webhook 伺服器正在運行 (偵錯模式)！');
});

app.post('/webhook', line.middleware(config), (req, res) => {
  console.log('=============== 收到 LINE 的 Webhook 請求！ ===============');
  
  if (!req.body || !req.body.events) {
    console.log('收到了請求，但沒有 events 內容。');
    return res.status(200).send('OK');
  }

  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error('❌ Promise.all 捕捉到未處理的錯誤:', err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  console.log('正在處理事件:', event);

  if (event.type !== 'message' || event.message.type !== 'text') {
    console.log(`忽略非文字訊息事件 (類型: ${event.type})`);
    return Promise.resolve(null);
  }

  const receivedText = event.message.text;
  console.log(`步驟 1: 收到文字訊息: '${receivedText}'`);

  if (receivedText.toLowerCase() === 'profile') {
    console.log('步驟 2: 偵測到 "profile" 關鍵字，準備進入主要邏輯...');
    const userId = event.source.userId;
    const replyToken = event.replyToken;

    try {
      console.log(`步驟 3: 準備使用 User ID: ${userId} 呼叫 getProfile API...`);
      const userProfile = await client.getProfile(userId);
      console.log('步驟 4: ✅ getProfile API 呼叫成功！收到的資料:', userProfile);

      const replyText = `嗨！您的個人資料如下：\n\n` +
                      `👤 名稱: ${userProfile.displayName}\n` +
                      `💬 狀態: ${userProfile.statusMessage || '(無)'}`;

      const message = { type: 'text', text: replyText };

      console.log(`步驟 5: 準備使用 replyToken: ${replyToken.substring(0, 10)}... 回覆訊息...`);
      await client.replyMessage(replyToken, message);
      console.log('步驟 6: ✅ 訊息回覆成功！');

    } catch (error) {
      console.error('❌ 喔不！在 try 區塊發生錯誤:', error);
      
      // LINE SDK 的錯誤通常會包含更詳細的資訊在 response 物件中
      if (error.response) {
        console.error('錯誤回應的詳細內容:', error.response.data);
      }
      
      // 就算出錯，也嘗試回覆一則錯誤訊息給用戶，方便除錯
      try {
        await client.replyMessage(replyToken, {
          type: 'text',
          text: `抱歉，處理 'profile' 指令時發生錯誤。請查看伺服器日誌。`
        });
      } catch (replyError) {
        console.error('❌ 連回覆錯誤訊息都失敗了:', replyError);
      }
    }
  } else {
    console.log('訊息不是 "profile"，已忽略。');
  }

  return Promise.resolve(null);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`伺服器啟動 (偵錯模式)，監聽埠號 ${PORT}`);
});