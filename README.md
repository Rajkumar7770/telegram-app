# Grab Karo Deals 🛍️

A Telegram bot that watches a handful of public, already-curated Indian deal
channels and forwards anything mentioning **Flipkart, Amazon, Myntra, Ajio,
Blinkit or Zepto** to everyone who's subscribed.

## "Can't we just use the platforms' own APIs?" - the honest answer

Checked this again specifically because it came up: as of mid-2026, none of
the 6 platforms offer a usable "show me today's deals" API to a new
developer, and that's gotten *more* restrictive, not less, since this
project started:

- **Amazon's Product Advertising API** still requires you to already be an
  approved Associate with 10+ qualifying sales in the trailing 30 days -
  chicken-and-egg for a brand-new bot.
- **Flipkart's affiliate program has fully closed direct signups.** The only
  way in now is through an influencer-aggregator platform (Cuelinks,
  Haulpack, ExtraPe) - and even once approved, what you get is a personal
  link-sharing dashboard, not a "today's trending deals" feed.
- **EarnKaro** (and similar aggregators) are the same story: a manual
  browse-and-copy-link dashboard for affiliates, with no public developer
  API for bots to pull from.
- **Myntra, Ajio, Blinkit, Zepto** have no affiliate program or public API
  of their own at all.

There's also a deeper catch worth knowing: even if you eventually get
Amazon/Flipkart affiliate access, those APIs let you *look up a specific
product by ID and get its current price* - they don't have an endpoint
that says "show me what's on deal right now." So even with API access,
you'd still need some way to discover *which* products are worth checking.
That discovery problem is exactly what this bot solves by reading existing
deal-curation channels (communities like DesiDime that already do this
curation work) instead of the stores directly.

Net effect: this bot's channel-monitoring approach isn't a workaround for
lack of API access - for "what's on deal across 6 platforms right now,"
nothing else currently does the job. If you do get affiliate approval later
purely for the commission/payout angle, that's a separate, additive feature
(swap the channel's link for your own affiliate link before forwarding) -
not a replacement for this discovery layer.

## How it actually works

The bot polls a set of **existing public deal-curation channels** every 30
seconds by reading their public preview page - the same `t.me/s/<channel>`
page anyone sees without joining - and forwards only the posts that mention
one of your 6 target platforms. No login, no scraping of the e-commerce
sites themselves.

**Channels currently configured** (in `src/config.js`):
- `desidimehot`, `desidime` - DesiDime's channels, reliable and active
- `realearnkaro` - EarnKaro's official deals channel
- `looters_hub` - confirmed active, regular Amazon/Flipkart posts
- `DailyLootdeals` - handle confirmed to exist; watch the logs for a "0
  posts" warning in case it's gone quiet since
- `dealsvelocity` - has 300K+ subscribers per third-party trackers, but its
  *public* preview page returned almost nothing when checked, suggesting
  most of its real activity happens in a private sister channel. Left in
  since an empty channel is harmless, but don't expect much from it.

"DV offers" (also requested) couldn't be matched to a distinct public
channel - it may be private/invite-only, or "DV" might just be shorthand for
Deals Velocity above. If you find the exact `@handle`, add it to the
`CHANNELS` array.

**Trade-offs to know about:**
- You're relying on other communities' curation. Quality and uptime vary -
  the bot now logs a per-channel warning whenever one returns 0 posts, so
  check your terminal/deploy logs occasionally for dead channels to swap out.
- Telegram's preview-page HTML isn't a documented API. It's been stable for
  years, but if it ever changes, `src/fetchChannel.js` may need a selector
  update.
- These are community-shared deals, not an official store feed - mention
  this to subscribers; verify price/seller before buying.

## About the 30-second refresh (not 5 seconds)

5 seconds was the original ask, but here's why it's set to 30 instead:

- This isn't hitting an official API with documented rate limits - it's
  requesting a public webpage. Hammering it every 5 seconds, 24/7, across 6
  channels (17,280+ requests/day just from this one bot) is the kind of
  pattern that gets an IP rate-limited or blocked, which would break the bot
  entirely rather than make it faster.
- There's no practical upside: these channels post every few minutes at
  most, not every few seconds, so 5s vs 30s makes zero difference to how
  fast subscribers see a deal, while meaningfully raising block risk.

30s is already fast enough that deals arrive within half a minute of being
posted. Adjust via `POLL_INTERVAL_SECONDS` in `.env` if you want, but going
much below ~15-20s is not recommended.

## How you'd actually earn money from this (affiliate marketing, explained)

Mechanically, here's what's actually happening: when a post contains a link
like `amzn.to/xyz` or `fkrt.cc/abc`, that short link has someone's affiliate
ID baked into it. Click it, and a tracking cookie gets set in your browser;
buy something within that program's cookie window (often 24h-30 days), and
whoever's ID was in that link gets paid a commission - regardless of who
forwarded you the link.

**The part worth being upfront about:** right now, your bot forwards the
*source channel's* link exactly as posted. So when your subscribers click
through and buy, the commission currently goes to DesiDime/Looters Hub/etc -
not you. To earn anything, you'd need to replace that link with your own
affiliate link before forwarding. That's a separate piece of infrastructure
from anything built so far.

**What's actually available to set that up, checked fresh for all 11
platforms you listed:**

Amazon and Flipkart remain the hard ones - same gating as before (Amazon
needs pre-existing sales history; Flipkart's direct signup is closed). For
both, the only way in is via an aggregator like EarnKaro or Cuelinks.

Nykaa is the pleasant surprise here - it runs its own direct affiliate
program (`affiliate.nykaa.com`), free, no follower minimums, instant
approval. Worth signing up for directly rather than through an aggregator.

Myntra, Ajio, JioMart, Meesho, Tata Neu, Tata CLiQ, and Croma are all
reachable, but realistically through an aggregator rather than direct
signup - Meesho and Tata CLiQ do have their own creator programs, but
approval for small/new creators isn't guaranteed, while the aggregator route
has no such bar.

**The practical starting point: EarnKaro.** It's free, asks for zero
documentation, and covers Flipkart, Myntra, Ajio, JioMart, Meesho, and Nykaa
Fashion in one dashboard - sign up once at earnkaro.com, paste a product URL
into their "Make Link" tool, get back your trackable profit link.

**On automating the link-swap inside this bot specifically:** checked for a
public API from EarnKaro/Cuelinks/INRDeals that code could call to convert a
URL automatically - none of them expose one. Their automation (EarnKaro's
"Affiliaters" tool at affiliaters.in) works by *you* operating inside *their*
system: you'd connect a separate Telegram bot to their dashboard and they
auto-convert+post for you, rather than your own code calling out to them.
That's a real option if you want full automation today, just a parallel
system rather than something this codebase calls into directly.

`src/affiliate.js` is where the swap would happen if/when that changes - it's
already wired into every outgoing message via `broadcast.js`, currently as a
documented no-op (returns the link unchanged). If EarnKaro ever publishes a
real API, or you're fine manually converting your best 2-3 deals a day
instead of every single one, that's the file to edit.



You've already renamed it via @BotFather. For the description and profile
photo, those ARE settable through the Bot API (not just BotFather), so a
script handles it:

```bash
npm install
npm run setup-profile
```

This pushes a short description, a longer welcome description, and a
generated profile photo (`assets/bot-profile.jpg`) to your bot. Run it once;
re-run anytime you want to change the text or swap the image. If you'd
rather design your own photo, just replace that file (must be a JPEG) before
running the script.

## 2. Run the bot locally

```bash
cp .env.example .env   # then paste your real BOT_TOKEN into .env (skip if you already have one)
npm start
```

Open Telegram, find your bot, send `/start`. Leave it running - it checks
the configured channels every 30 seconds and messages you when something
matches.

## 3. Deploy so it runs 24/7 (Railway)

Railway runs a persistent process, unlike Render's free web services which
sleep after 15 minutes of inactivity.

1. Push this folder to a **private** GitHub repo (`.env` is gitignored, so
   your token won't be in the repo).
2. On [railway.app](https://railway.app), **New Project → Deploy from GitHub
   repo** → pick the repo.
3. In the Railway project's **Variables** tab, add `BOT_TOKEN` with your real
   token (and optionally `POLL_INTERVAL_SECONDS`).
4. Railway auto-detects Node and runs `npm start`. Check the deploy logs for
   "Grab Karo Deals bot is running."

To run `npm run setup-profile` you don't need Railway at all - it's a one-off
script, so running it once from your own machine (where you already
confirmed `api.telegram.org` is reachable) is enough; it doesn't need to run
continuously like the bot itself.

## 4. Add more deal channels later

Edit the `CHANNELS` array in `src/config.js` with any other public Telegram
channel's username (no `@`). No other code changes needed.

## Project structure

```
index.js                  entry point - starts the bot + the poller
generate_profile_image.py one-off Python script that generated assets/bot-profile.jpg
scripts/setupProfile.js   one-off script: pushes description + photo to Telegram
assets/bot-profile.jpg    the bot's profile photo
src/config.js             channel list + platform keywords (edit this most)
src/affiliate.js          where link-conversion would plug in (currently a no-op - see above)
src/bot.js                /start, /stop, /status commands
src/fetchChannel.js       reads a channel's public t.me/s/<name> preview page
src/filter.js             keyword match against PLATFORMS
src/broadcast.js          formats + sends a matched deal to all subscribers
src/poller.js             the setInterval loop tying it all together
src/store.js              tiny JSON-file storage for subscribers + dedup
```
