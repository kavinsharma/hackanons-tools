const TELEGRAM_API = 'https://api.telegram.org/bot';

export async function sendTelegramAlert(message: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId || token === 'your_bot_token_here') {
    console.warn('[Telegram] Bot token or chat ID not configured, skipping alert');
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Telegram] Failed to send alert:', err);
      return false;
    }

    console.log('[Telegram] Alert sent successfully');
    return true;
  } catch (error) {
    console.error('[Telegram] Error sending alert:', error);
    return false;
  }
}

export function formatAlert(type: 'error' | 'warning' | 'success', source: string, details: string): string {
  const icons = { error: '🚨', warning: '⚠️', success: '✅' };
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  return [
    `${icons[type]} <b>Tracker Fetcher ${type.toUpperCase()}</b>`,
    ``,
    `<b>Source:</b> ${source}`,
    `<b>Details:</b> ${details}`,
    `<b>Time:</b> ${now} UTC`,
    ``,
    `🔗 <a href="https://tools.hackanons.com/torrent-trackers-list">View Site</a>`,
  ].join('\n');
}
