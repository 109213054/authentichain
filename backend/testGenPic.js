//測試圖片生成的樣子
const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');

// 註冊字體，避免中文亂碼
registerFont('./fonts/NotoSansTC-Regular.ttf', { family: 'Noto Sans TC' });

// 圖片生成函數
async function generateCertificateImage(data) {
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');

  // 背景 - 淡藍色漸層
  const gradient = ctx.createLinearGradient(0, 0, 800, 600);
  gradient.addColorStop(0, 'white');  // 淡藍色起始
  gradient.addColorStop(0.35, '#E6F3FF');  // 淡藍色起始
  gradient.addColorStop(0.85, '#B3D9FF');  // 淡藍色結束
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 添加一些質感 - 輕微的噪點效果
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < canvas.width; i += 4) {
    for (let j = 0; j < canvas.height; j += 4) {
      if (Math.random() > 0.5) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(i, j, 2, 2);
      }
    }
  }
  ctx.globalAlpha = 1;

  // 邊框
  ctx.strokeStyle = '#4A90E2';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // 標題
  ctx.font = 'bold 40px "Noto Sans TC"';
  ctx.fillStyle = '#2C3E50';
  ctx.textAlign = 'center';
  ctx.fillText('產品認證證書', canvas.width / 2, 80);

  // 資訊
  ctx.font = '20px "Noto Sans TC"';
  ctx.fillStyle = '#34495E';
  ctx.textAlign = 'center';
  const startY = 150;
  const lineHeight = 40;

  const lines = [
    `店家名稱: ${data.storeName}`,
    `產品名稱: ${data.productName}`,
    `產品描述: ${data.productDescription}`,
    `產品序號: ${data.productSerial}`,
    `生產日期: ${data.productionDate}`
  ];

  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
  });

  // 蓋章
  const stampSize = 120;
  const stampX = canvas.width - stampSize - 20;
  const stampY = canvas.height - stampSize - 20;

  // 繪製圓形印章背景
  ctx.beginPath();
  ctx.arc(stampX + stampSize / 2, stampY + stampSize / 2, stampSize / 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';  // 淡紅色，透明度低
  ctx.fill();

  // 繪製印章邊框
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';  // 紅色，半透明
  ctx.lineWidth = 2;
  ctx.stroke();

  // 繪製印章文字
  ctx.font = 'bold 18px "Noto Sans TC"';
  ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';  // 紅色，稍微不透明
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Authenticode', stampX + stampSize / 2, stampY + stampSize / 2);

  return canvas.toBuffer('image/png');
}

// 測試函數
(async () => {
  const testData = {
    storeName: '測試店家',
    productName: '測試產品',
    productDescription: '這是一個測試產品的描述。',
    productSerial: '123456789',
    productionDate: '2025-01-21',
  };

  try {
    const imageBuffer = await generateCertificateImage(testData);
    fs.writeFileSync('certificate.png', imageBuffer);
    console.log('圖片已成功生成，請檢查當前目錄的 certificate.png 文件!');
  } catch (error) {
    console.error('生成圖片時出錯:', error);
  }
})();