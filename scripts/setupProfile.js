/**
 * One-time setup script: pushes the bot's full description, short
 * description, and profile photo to Telegram via the Bot API.
 *
 * Run this once (and again any time you want to change these):
 *   node scripts/setupProfile.js
 *
 * This is separate from index.js - it's a setup step, not part of the
 * always-running bot. Requires Node 18+ (uses native fetch/FormData/Blob).
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');

const TOKEN = process.env.BOT_TOKEN;
if (!TOKEN) {
  console.error('Missing BOT_TOKEN - check your .env file.');
  process.exit(1);
}

const BASE = `https://api.telegram.org/bot${TOKEN}`;

const SHORT_DESCRIPTION =
  '🛍️ Your personal deals agent - free instant alerts from Flipkart, Amazon, Myntra, Nykaa & more. Tap Start!';

const FULL_DESCRIPTION =
  'Never miss a loot deal again! 🔥\n\n' +
  'Grab Karo Deals is your personal deals agent - it watches India\'s top ' +
  'deal-sharing channels around the clock and instantly forwards anything ' +
  'mentioning Flipkart, Amazon, Myntra, Ajio, Blinkit, Zepto, Nykaa, JioMart, ' +
  'Meesho, Tata Neu, Tata CLiQ or Croma.\n\n' +
  '✅ Free, forever\n' +
  '✅ Only matching deals - no spam\n' +
  '✅ Unsubscribe anytime with /stop\n\n' +
  'Tap Start below and start saving today!';

async function callApi(method, payload, isForm = false) {
  const res = await fetch(`${BASE}/${method}`, {
    method: 'POST',
    headers: isForm ? undefined : { 'Content-Type': 'application/json' },
    body: isForm ? payload : JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) {
    console.error(`✗ ${method} failed:`, data.description);
  } else {
    console.log(`✓ ${method} succeeded.`);
  }
  return data;
}

async function setProfilePhoto() {
  const photoPath = path.join(__dirname, '..', 'assets', 'bot-profile.jpg');
  if (!fs.existsSync(photoPath)) {
    console.error(`✗ No image found at ${photoPath} - skipping profile photo.`);
    return;
  }
  const buffer = fs.readFileSync(photoPath);
  const form = new FormData();
  form.append('photo', new Blob([buffer], { type: 'image/jpeg' }), 'bot-profile.jpg');
  await callApi('setMyProfilePhoto', form, true);
}

async function main() {
  console.log(`Short description: ${SHORT_DESCRIPTION.length}/120 chars`);
  console.log(`Full description:  ${FULL_DESCRIPTION.length}/512 chars\n`);

  if (SHORT_DESCRIPTION.length > 120 || FULL_DESCRIPTION.length > 512) {
    console.error('One of the descriptions is over Telegram\'s limit - trim it and re-run.');
    process.exit(1);
  }

  await callApi('setMyShortDescription', { short_description: SHORT_DESCRIPTION });
  await callApi('setMyDescription', { description: FULL_DESCRIPTION });
  await setProfilePhoto();

  console.log(
    '\nDone. Open a brand-new chat (or your phone\'s Telegram) to see the changes - ' +
      'an already-open chat window sometimes caches the old profile until you reopen it.'
  );
}

main().catch((err) => {
  console.error('Setup script crashed:', err.message);
  process.exit(1);
});
