const { fetchChannelPosts } = require('./fetchChannel');
const { getSeenIds, markSeen } = require('./store');
const { matchesPlatform } = require('./filter');
const { broadcastDeal } = require('./broadcast');
const { CHANNELS, PLATFORMS, POLL_INTERVAL_SECONDS } = require('./config');

// Per-channel failure tracking. At a 5s interval, hammering a channel that's
// erroring on every request (wrong handle, gone private, or - worst case -
// Telegram rate-limiting this server's IP) just makes things worse. After a
// few consecutive failures, that one channel is skipped for a short cooldown
// instead of retried every single cycle, while every healthy channel keeps
// polling at full speed.
const FAILURE_THRESHOLD = 3;
const COOLDOWN_CYCLES = 12; // ~1 minute of skipping, at the default 5s interval
const channelState = {}; // { [channel]: { failures: number, skipUntilCycle: number } }
let cycleCount = 0;

async function pollOnce(bot) {
  cycleCount += 1;
  const seen = getSeenIds();
  const newlySeenIds = [];

  for (const channel of CHANNELS) {
    const state = channelState[channel] || { failures: 0, skipUntilCycle: 0 };

    if (cycleCount < state.skipUntilCycle) {
      continue; // still cooling down after repeated failures
    }

    try {
      const posts = await fetchChannelPosts(channel);
      state.failures = 0; // reset on any success

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
      state.failures += 1;
      console.error(`Error polling @${channel} (failure ${state.failures}):`, err.message);

      if (state.failures >= FAILURE_THRESHOLD) {
        state.skipUntilCycle = cycleCount + COOLDOWN_CYCLES;
        console.warn(
          `@${channel}: ${state.failures} failures in a row - pausing it for ~${COOLDOWN_CYCLES * POLL_INTERVAL_SECONDS}s ` +
            'so a dead/blocked channel does not get hammered every cycle.'
        );
      }
    }

    channelState[channel] = state;
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
