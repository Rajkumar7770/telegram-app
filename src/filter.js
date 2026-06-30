function matchesPlatform(text, platforms) {
  const lower = text.toLowerCase();
  return platforms.some((platform) => lower.includes(platform));
}

module.exports = { matchesPlatform };
