const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SEEN_FILE = path.join(DATA_DIR, 'seen.json');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.json');
const MAX_SEEN_IDS = 3000; // keeps the dedup file from growing forever

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadJSON(file, fallback) {
  ensureDataDir();
  if (!fs.existsSync(file)) return fallback;
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error(`Could not read ${file}, starting fresh:`, err.message);
    return fallback;
  }
}

function saveJSON(file, data) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getSeenIds() {
  return new Set(loadJSON(SEEN_FILE, []));
}

function markSeen(newIds) {
  if (!newIds.length) return;
  const seen = getSeenIds();
  newIds.forEach((id) => seen.add(id));
  const trimmed = Array.from(seen).slice(-MAX_SEEN_IDS);
  saveJSON(SEEN_FILE, trimmed);
}

function getSubscribers() {
  return loadJSON(SUBSCRIBERS_FILE, []);
}

function addSubscriber(chatId) {
  const subs = getSubscribers();
  if (!subs.includes(chatId)) {
    subs.push(chatId);
    saveJSON(SUBSCRIBERS_FILE, subs);
  }
}

function removeSubscriber(chatId) {
  const subs = getSubscribers().filter((id) => id !== chatId);
  saveJSON(SUBSCRIBERS_FILE, subs);
}

module.exports = {
  getSeenIds,
  markSeen,
  getSubscribers,
  addSubscriber,
  removeSubscriber,
};
