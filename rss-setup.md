---
title: RSS Reader Setup
---

Everything I read lands in one feed reader: blogs, newsletters, podcasts and even YouTube
channels. The lists themselves live on [My Resources](my-resources.md); this page is only about
the setup. All of it is importable as [feeds.opml](feeds.opml).

## Why RSS

No ranking algorithm, no streaks, no engagement bait. Chronological, unsubscribe in one click,
and nothing about your reading is sold to anyone. The cost is one habit: you decide what you
want to read instead of a feed deciding for you.

## Picking a reader

Pick one reader and use it everywhere — the reader matters less than the sync.

- **In your browser already**: Vivaldi has a built-in feed reader (open the Feeds panel, then use
  its import/export option); Thunderbird covers mail and feeds in one place.
- **Desktop, minimal**: NetNewsWire (macOS/iOS, free and open source), ReadKit (macOS),
  QuiteRSS (Windows/Linux), Newsboat (terminal, great over SSH).
- **Mobile**: NetNewsWire or Reeder (iOS); Read You or FeedMe (Android); both work with a
  self-hosted server too.
- **Self-hosted web**: Miniflux (single binary, no-frills) or FreshRSS (PHP, richer UI, good
  mobile app support). A server means your unread state follows you across laptop, phone and
  tablet, and your subscriptions stay yours.
- **Hosted**: Inoreader or Feedly if you would rather not run anything.

## Importing feeds

Every reader speaks OPML, so switching readers is a five-second job:

1. Export OPML from the old reader (Vivaldi: Feeds panel → import/export).
2. Import it in the new one (NetNewsWire: File → Import; Miniflux: Settings → Feeds → Import;
   FreshRSS: Administration → Subscriptions → Import; Newsboat: point `urls-file` at it).
3. Group feeds into folders by topic, not by site, so a folder becomes a reading session.

## Following YouTube channels over RSS

Every channel has an Atom feed, which is the only way to watch on your own schedule:

```
https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID
```

Find `CHANNEL_ID` in the channel URL (`youtube.com/channel/UC…`), or view the page source and
search for `"channelId"`. Every channel link on [My Resources](my-resources.md) already carries
that ID, so subscribing to the list is copy-paste. Feed readers also handle
`https://www.youtube.com/feeds/videos.xml?user=NAME` and `?playlist_id=…` the same way.

## Newsletters without an inbox

Never give a newsletter your real address. Either a throwaway address forwarded into the reader,
or a kill-the-newsletter style service that hands you a disposable address plus the matching RSS
feed. Same inbox as everything else, and unsubscribing means deleting one feed. Keep those feed
URLs private — the token in the path is the only thing guarding the feed.

## Feeds that are monitors, not reading

Some feeds exist to tell you when something changed rather than to be read cover to cover:
release feeds (GitHub's `/releases.atom`, package registries, Artifact Hub), status pages,
`arXiv` category feeds for a topic you are studying. Put them in their own folder, keep them
muted, and never count them in your unread number — otherwise they train you to ignore the reader.

## Keeping it under control

- Unsubscribe after three skipped posts. A feed you mean to read is a feed you should have left.
- Cap the list: if unread count never gets near zero, the list is too long, not you too slow.
- One folder per topic, opened as one session, rather than one endless chronological river.
- Add a feed only after reading two or three posts by hand — a single good article is not a
  subscription.

---

← [Home](index.md) · [My Resources](my-resources.md)
