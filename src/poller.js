const { fetchChannelPosts } = require('./fetchChannel');
const { getSeenIds, markSeen } = require('./store');
const { matchesPlatform } = require('./filter');
const { broadcastDeal } = require('./broadcast');
const { CHANNELS, PLATFORMS, POLL_INTERVAL_SECONDS } = require('./config');

async function pollOnce(bot) {
  const seen = getSeenIds();
  const newlySeenIds = [];

  for (const channel of CHANNELS) {
    try {
      const posts = await fetchChannelPosts(channel);

      if (posts.length === 0) {
        console.warn(
          `@${channel}: fetched 0 posts. Either nothing's new, the handle is wrong/private, ` +
            'or Telegram changed its preview page markup.'
        );
      }

      for (const post of posts) {
        if (seen.has(post.id)) continue;
        newlySeenIds.push(post.id); // mark seen even if it doesn't match, so we don't re-check it forever

        if (!matchesPlatform(post.text, PLATFORMS)) continue;

        console.log(`Matched deal from @${channel}: ${post.text.slice(0, 60)}...`);
        await broadcastDeal(bot, post);
      }
    } catch (err) {
      console.error(`Error polling @${channel}:`, err.message);
    }
  }

  markSeen(newlySeenIds);
}

function startPolling(bot) {
  console.log(
    `Polling ${CHANNELS.length} channel(s) every ${POLL_INTERVAL_SECONDS} second(s).`
  );
  pollOnce(bot).catch((err) => console.error('Initial poll failed:', err.message));

  setInterval(() => {
    pollOnce(bot).catch((err) => console.error('Scheduled poll failed:', err.message));
  }, POLL_INTERVAL_SECONDS * 1000);
}

module.exports = { startPolling, pollOnce };
