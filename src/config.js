// Curated list of PUBLIC Telegram deal channels to poll for new posts.
// These are existing, independently-run deal-curation communities -
// we are not scraping Flipkart/Amazon/etc. directly, just reading their
// public channel previews (the same page non-members see at t.me/s/<name>).
//
// Verify these are still active before relying on them, and feel free to
// add/remove handles (no "@", just the username part of the channel link).
const CHANNELS = [
  'desidimehot', // DesiDime's curated "hot deals only" channel
  'desidime', // DesiDime's main channel (much noisier, covers all categories)
  'realearnkaro', // EarnKaro's official loot-deals channel
  'looters_hub', // Looters Hub - confirmed active, regular Amazon/Flipkart posts
  'DailyLootdeals', // Daily Loot Deals - confirmed handle exists; watch the logs
                     // for a "0 posts" warning in case it's gone quiet
  'dealsvelocity', // Deals Velocity - 300K+ subscribers per third-party trackers,
                    // but its PUBLIC preview page returned almost nothing when
                    // checked (most of its real activity may happen in a private
                    // sister channel/group). Left in since it's harmless if empty,
                    // but don't expect much from it - replace if logs confirm it's dead.
  // "DV offers" was requested but no distinct public channel with that name could
  // be verified - it may be a private/invite-only channel, or "DV" may just refer
  // to Deals Velocity above. If you have the exact @handle, add it here.
];

// A post is forwarded only if its text mentions one of these (case-insensitive).
// Add synonyms/spellings as you notice deals slipping through.
const PLATFORMS = [
  'flipkart',
  'amazon',
  'myntra',
  'ajio',
  'blinkit',
  'zepto',
  'tata neu',
  'tataneu',
  'jiomart',
  'nykaa',
  'tata cliq',
  'tatacliq',
  'meesho',
  'croma',
];

// How often to re-check the channels, in seconds. Kept well above a few
// seconds on purpose - see README for why polling every 5s isn't a good idea.
const POLL_INTERVAL_SECONDS = parseInt(process.env.POLL_INTERVAL_SECONDS || '30', 10);

module.exports = { CHANNELS, PLATFORMS, POLL_INTERVAL_SECONDS };
