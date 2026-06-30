const { Telegraf } = require('telegraf');
const { addSubscriber, removeSubscriber, getSubscribers } = require('./store');

function createBot(token) {
  const bot = new Telegraf(token);

  bot.start((ctx) => {
    addSubscriber(ctx.chat.id);
    ctx.reply(
      '🛍️ Welcome to Grab Karo Deals!\n\n' +
        "You're now subscribed to free, instant deal alerts from Flipkart, Amazon, " +
        'Myntra, Ajio, Blinkit and Zepto. 🔥\n\n' +
        "Here's how it works: I watch a handful of well-known Indian deal-sharing " +
        'channels around the clock and forward you anything that mentions one of ' +
        'those 6 platforms - so you see it the moment it drops, without needing to ' +
        'join a dozen noisy channels yourself.\n\n' +
        "One honest note: these are community-curated deals, not an official store " +
        'feed, so always double-check the price and seller before buying.\n\n' +
        'Send /stop anytime to unsubscribe. Happy looting! 💸'
    );
  });

  bot.command('stop', (ctx) => {
    removeSubscriber(ctx.chat.id);
    ctx.reply('Unsubscribed. Send /start anytime to come back.');
  });

  bot.command('status', (ctx) => {
    ctx.reply(`Currently ${getSubscribers().length} subscriber(s) following deals.`);
  });

  bot.help((ctx) => {
    ctx.reply('/start - subscribe to deal alerts\n/stop - unsubscribe\n/status - subscriber count');
  });

  return bot;
}

module.exports = { createBot };
