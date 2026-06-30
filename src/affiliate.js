/**
 * This is where a deal's link WOULD get swapped for your own affiliate link
 * before being sent to subscribers - that's the actual mechanism by which
 * you'd earn money (see README "How you'd actually earn money" section for
 * the full explanation).
 *
 * Right now this is a no-op: it returns the original link unchanged. That's
 * not a placeholder I forgot to finish - it's because none of EarnKaro,
 * Cuelinks, INRDeals, or the platforms themselves expose a documented public
 * API where code can submit a URL and get back a tracked link. Their "link
 * converters" are web/app dashboards (and in EarnKaro's case, a separate
 * Telegram automation product - see README) meant for a human or for their
 * own bot to operate, not for third-party code to call.
 *
 * If that changes (you find a documented API, or you're fine manually
 * pasting your top few deals into EarnKaro's converter each day instead of
 * full automation), this is the one place to wire it in - every deal already
 * flows through here via broadcast.js.
 */
function convertLink(originalUrl) {
  // TODO: once you have a real conversion mechanism, replace this line.
  // Example shape, once/if you have something callable:
  //   const converted = await earnKaroClient.convert(originalUrl);
  //   return converted || originalUrl; // always fall back to the original on failure
  return originalUrl;
}

module.exports = { convertLink };
