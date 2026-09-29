export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('Bot is running on Vercel!');
  }

  try {
    const update = req.body;
    if (!update.message || !update.message.text) {
      return res.status(200).json({ status: 'ok' });
    }

    const chatId = update.message.chat.id;
    const userText = update.message.text;

    // 从 Vercel 环境变量中读取配置
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const API_BASE = process.env.API_BASE || "https://apinebula.ai/v1";
    const API_KEY = process.env.API_KEY;
    const MODEL_NAME = process.env.MODEL_NAME || "grok-4.6"; 

    if (!BOT_TOKEN || !API_KEY) {
      return res.status(500).json({ error: 'BOT_TOKEN or API_KEY is not configured in Vercel Environment Variables.' });
    }

    // 1. 调用 Grok API
    const aiResponse = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [{ role: 'user', content: userText }]
      })
    });

    const aiData = await aiResponse.json();
    let replyText;
    if (aiData.error) {
      replyText = `【API 报错】\n` + JSON.stringify(aiData.error, null, 2);
    } else {
      replyText = aiData.choices?.[0]?.message?.content || '【返回内容为空】';
    }

    // 2. 发送回 Telegram
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: replyText
      })
    });

    return res.status(200).json({ status: 'success' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
