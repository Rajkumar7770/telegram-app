require('dotenv').config();

const http = require('http');
const { createBot } = require('./src/bot');
const { startPolling } = require('./src/poller');

const TOKEN = process.env.BOT_TOKEN;
if (!TOKEN) {
  console.error('Missing BOT_TOKEN. Copy .env.example to .env and fill it in (or set it in your host\'s env vars).');
  process.exit(1);
}

const bot = createBot(TOKEN);

bot
  .launch()
  .then(() => console.log('Grab Karo Deals bot is running and listening for /start.'))
  .catch((err) => {
    console.error('Failed to launch bot - check that BOT_TOKEN is correct:', err.message);
    process.exit(1);
  });

startPolling(bot);

// Minimal HTTP server. Not required on Railway, but useful if you deploy on
// Render's free web-service tier and ping this with UptimeRobot/cron-job.org
// every <15 minutes to stop it from spinning down.
const PORT = process.env.PORT || 3000;
http.createServer((_req, res) => res.end('Grab Karo Deals is alive')).listen(PORT, () => {
  console.log(`Health-check server listening on port ${PORT}`);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
