const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
};

/**
 * Fetches the public preview page for a Telegram channel
 * (the same page anyone sees at https://t.me/s/<channel> without joining)
 * and returns the messages found on it.
 *
 * This relies on Telegram's HTML structure for that preview page, which has
 * been stable for years but isn't an official API - if Telegram changes it,
 * this parser may start returning 0 posts and will need a selector update.
 */
async function fetchChannelPosts(channelUsername) {
  const url = `https://t.me/s/${channelUsername}`;
  const { data: html } = await axios.get(url, {
    headers: HEADERS,
    timeout: 15000,
  });

  const $ = cheerio.load(html);

  // Primary selector. Falls back to the inner message element directly
  // in case the outer wrapper class changes.
  let messageNodes = $('.tgme_widget_message_wrap');
  if (messageNodes.length === 0) {
    messageNodes = $('.tgme_widget_message');
  }

  const posts = [];

  messageNodes.each((_, el) => {
    const node = $(el);
    const messageEl = node.hasClass('tgme_widget_message')
      ? node
      : node.find('.tgme_widget_message').first();

    const postId = messageEl.attr('data-post'); // e.g. "desidimehot/12345"
    if (!postId) return;

    const textEl = messageEl.find('.tgme_widget_message_text').first();
    const text = textEl.text().replace(/\s+/g, ' ').trim();
    if (!text) return; // skip pure-media posts with no caption

    // Prefer a link inside the message text; some posts put the buy link
    // in a separate "inline button" area instead.
    let link = textEl.find('a').first().attr('href');
    if (!link) {
      link = messageEl.find('.tgme_widget_message_inline_row a').first().attr('href');
    }

    const datetime = messageEl.find('time').first().attr('datetime');

    posts.push({
      id: postId,
      channel: channelUsername,
      text,
      link: link || `https://t.me/${postId}`,
      datetime,
    });
  });

  return posts;
}

module.exports = { fetchChannelPosts };
