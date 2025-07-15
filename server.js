// server.js (極簡測試版)
const express = require('express');
const app = express();

// 關鍵：讀取 Render 指定的 PORT，或是在本機使用 3000
const PORT = process.env.PORT || 3000;

// 一個簡單的根路徑
app.get('/', (req, res) => {
  res.send('極簡伺服器運行成功！');
});

// 啟動伺服器並監聽指定的 PORT
app.listen(PORT, () => {
  console.log(`✅ 極簡伺服器成功啟動，正在監聽埠號 ${PORT}`);
});