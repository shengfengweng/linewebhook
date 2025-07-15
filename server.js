// server.js
const express = require('express');
const app = express();

// ❗️非常重要：這個中介軟體 (middleware) 會解析傳入的 JSON 請求
// 並將其放入 req.body。如果沒有這行，req.body 會是 undefined。
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 根路徑，用來測試伺服器是否正常運行
app.get('/', (req, res) => {
  res.send('LINE Bot Webhook 伺服器正在運行！');
});

// Webhook 的主要路徑
app.post('/webhook', (req, res) => {
  console.log('=============== 收到 LINE 的請求！ ===============');
  // 為了方便偵錯，仍然印出完整的請求 body
  console.log('完整請求 Body:', JSON.stringify(req.body, null, 2));

  // ⭐️⭐️⭐️ 主要修改部分：遍歷所有事件並提取 User ID ⭐️⭐️⭐️

  // 檢查 req.body.events 是否存在且是一個陣列
  if (req.body && Array.isArray(req.body.events)) {
    // 使用 forEach 處理可能一次收到的多個事件
    req.body.events.forEach(event => {
      // 確保事件中有 source 和 userId 欄位，避免非用戶觸發的事件造成錯誤
      // 例如：用戶加入群組，但 Bot 還沒被加入時，可能沒有 userId
      if (event.source && event.source.userId) {
        const userId = event.source.userId;
        const eventType = event.type;

        console.log('----------------------------------------------------');
        console.log('✅ 成功提取到用戶資訊！');
        console.log(`  🔹 事件類型 (Event Type): ${eventType}`);
        console.log(`  👤 用戶 ID (User ID): ${userId}`);
        console.log('----------------------------------------------------');

        // 未來您可以在這裡加入更多邏輯，例如：
        // 1. 查詢資料庫看此 userId 是否已存在
        // 2. 如果不存在，就呼叫 Get Profile API 獲取用戶名稱並存入資料庫
        // 3. 根據事件類型做出不同的回應
      }
    });
  }

  // 收到請求後，必須在幾秒內回傳 200 OK 的狀態碼給 LINE 平台
  // 否則 LINE 會認為 Webhook 失敗並重試，導致您收到重複的請求
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`伺服器啟動，監聽埠號 ${PORT}`);
});