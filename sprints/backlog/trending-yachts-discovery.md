---
title: Trending Yachts Discovery Section
status: idea
source: founder (QA session, 2026-04-03)
priority: medium
modules: [network, engagement, yacht-graph]
---

# Trending Yachts Discovery Section

## Problem
Users currently have no way to discover active yachts in the network. The graph is only explorable if you already know someone. New users and visitors have no entry point into the yacht graph.

## Vision
A section (likely on the Network tab or as its own discovery area) that surfaces high-activity yachts — the ones that are currently buzzing with endorsements, profile views, and new crew activity. This gives users something fresh every visit and provides an organic entry point into graph exploration.

## Metrics to surface
- Yachts receiving the most endorsements in a rolling 24h window
- Yachts with the most profile views in the last 24h
- Yachts with newly added crew (recent attachments)
- Potentially: yachts with the most active crew (crew who are logging in, updating profiles)

## UX
- Shows different yachts each time the user visits (rolling window, not static)
- Each yacht card is clickable → goes to the yacht entity page where you can see crew, explore the graph
- Could show: yacht name, type, size, active crew count, recent activity indicator
- Position: could be a section on the Network tab, or a standalone "Discover" area
- **Must be separate from "My Yachts"** — this is a discovery/explore section, not the user's own employment history. "My Network" shows your yachts and colleagues; this is for exploring the wider graph

## Impact
- Big engagement driver: gives users a reason to come back and explore
- Bootstraps graph discovery for users who haven't built their own network yet
- Makes the platform feel alive and active

## Notes
- Requires tracking/aggregating activity metrics per yacht
- Rolling 24h window means backend aggregation (could be a scheduled job or materialized view)
- Privacy consideration: don't reveal individual viewer identities, just aggregate activity levels
