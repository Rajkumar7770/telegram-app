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

## About the 30-second refresh, and the safety net around it

This is set to 30 seconds. One thing worth knowing: this polls a public webpage, not a documented API with official rate limits, so hammering a single broken/blocked channel every 30 seconds forever isn't free - it's the kind of pattern that can get a server IP rate-limited if done too aggressively.

So `src/poller.js` has a small built-in safety net: if any one channel fails 3 times in a row (wrong handle, gone private, temporarily blocked, whatever), the bot automatically stops polling *that specific channel* for about a minute (12 cycles) before trying again - while every healthy channel keeps polling at the full pace. You'll see this in the logs as "pausing it for ~360s." This minimizes the risk of a single bad channel causing the bot to hammer a wall indefinitely.

## "Agent" vs "bot"

Renamed in the copy you control - the welcome message and the bot's
description (set via `npm run setup-profile`) now describe it as your
"personal deals agent." One thing that won't change: Telegram's own UI will
always show a "BOT" badge next to its username, and the underlying mechanism
is still the Telegram *Bot* API - that's just the platform's term for any
automated account, not something this project can rebrand. The "agent"
framing lives in the words people read, not in Telegram's system labels.

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

### A concrete plan, phase by phase

**Phase 1 - this week:** sign up for EarnKaro (earnkaro.com, free, no
documents) and separately for Nykaa's own direct program
(affiliate.nykaa.com, also free). EarnKaro alone covers Flipkart, Myntra,
Ajio, JioMart, Meesho, and Nykaa Fashion in one dashboard. EarnKaro's
published rates are up to 8% on Flipkart and up to 10% on Myntra, paid out
once your balance crosses just ₹10 - low enough that you'll see your first
payout quickly even at small volume. Treat the "₹20-30k/month" figures in
their own marketing as the ceiling for established affiliates with real
audiences, not a starting expectation - with zero subscribers today, your
realistic first-month number is whatever a handful of clicks converts to,
likely a few hundred rupees at most. That's normal; it compounds with
subscriber count.

**Phase 2 - pick what gets monetized:** since there's no automatic
conversion (explained above), don't try to convert every single deal that
goes out - pick your 1-3 best deals of the day (highest discount, most
useful category), run just those through EarnKaro's "Make Link" tool
manually, and send those as a highlighted/pinned "Deal of the Day" in
addition to the regular automated feed. A few minutes a day, not a
full-time job.

**Phase 3 - track and double down:** EarnKaro's dashboard shows clicks and
confirmed orders per link. After a couple weeks, you'll see which platform
and category actually convert for your subscriber base - lean into more of
that, and don't worry about the categories that get clicks but no sales.

**Phase 4 - once you have real volume:** Amazon Associates and Flipkart's
direct program (closed to brand-new applicants, but Flipkart does sometimes
reopen direct signups for established affiliates with traffic history) tend
to pay better than going through an aggregator's cut. Worth re-checking
eligibility every few months as your subscriber count grows - this isn't a
day-one move, more a "graduate to" later.

### Promoting it to actually get subscribers

A bot with great deals and zero subscribers earns nothing, so this matters
as much as the technical side. A few channels worth trying, roughly in order
of effort-to-payoff for a brand-new channel:

WhatsApp is the highest-conversion starting point in India specifically -
share your bot's link in any group chats you're already a genuine member of
(college, family, local community groups), and ask a few friends to do the
same. This converts far better than cold outreach because there's existing
trust.

Instagram Reels and Threads work well for deals content specifically -
short "today's best 3 deals" video or carousel posts with your bot link in
bio, posted consistently (even 3-4x a week), tend to outperform one-off
posts by a wide margin since the algorithm rewards consistency over single
viral hits.

Cross-promotion with similar-sized Telegram channels is underused but
effective: message admins of other smallish deal/coupon channels and
propose a shoutout swap (you post about their channel, they post about
yours) - works best channel-to-channel at similar subscriber counts, since
much bigger channels have little incentive to reciprocate.

Reddit can work, but tread carefully - many India-focused deal communities
explicitly ban self-promotion and will ban your account for posting a bot
link without warning (DesiDime's own forum rules say exactly this). If you
try Reddit, search for the specific subreddit's rules first, and consider
participating genuinely before ever posting your own link.

Telegram's own discovery surfaces (its in-app search, and third-party
directory sites that list public channels by category) are free and worth
listing on once you have at least a few dozen subscribers - very low effort
for steady, if slow, organic discovery.

Paid promotion (boosting an Instagram post, a shoutout in someone else's
larger channel) is the fastest lever once you have some budget, but isn't
needed to start - everything above is free and is where most successful
small deal channels in India actually began.

## 1. Renaming, description, and profile photo

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
