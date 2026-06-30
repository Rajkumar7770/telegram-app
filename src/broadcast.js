const { getSubscribers, removeSubscriber } = require('./store');
const { convertLink } = require('./affiliate');

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatDeal(deal) {
  const safeText = escapeHtml(deal.text).slice(0, 600);
  const link = convertLink(deal.link); // currently a no-op - see src/affiliate.js
  return (
    `🔥 <b>New Deal</b> <i>(via @${deal.channel})</i>\n\n` +
    `${safeText}\n\n` +
    `🔗 <a href="${link}">View / Buy</a>`
  );
}

async function broadcastDeal(bot, deal) {
  const message = formatDeal(deal);
  const subscribers = getSubscribers();

  for (const chatId of subscribers) {
    try {
      await bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      });
    } catch (err) {
      const description = err.response && err.response.description;
      console.error(`Failed to message ${chatId}:`, description || err.message);
      // If the user blocked the bot or deleted their account, Telegram tells us -
      // clean them up so we don't keep retrying forever.
      if (description && /blocked|chat not found|deactivated/i.test(description)) {
        removeSubscriber(chatId);
      }
    }
    // Small delay to stay well under Telegram's rate limits when broadcasting.
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

module.exports = { broadcastDeal, formatDeal };
