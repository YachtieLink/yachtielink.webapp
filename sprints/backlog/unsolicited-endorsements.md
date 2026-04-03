---
title: Unsolicited Endorsements (Endorse Without a Request)
status: idea
source: founder (QA session, 2026-04-03)
priority: medium
modules: [endorsement, network]
---

# Unsolicited Endorsements

## Problem
Currently endorsements can only be written in response to a request (via `/endorse/[token]`). There's no way for a colleague to proactively endorse someone without that person first sending a request.

## Vision
Allow crew to endorse colleagues they've worked with without waiting for a request. When viewing a colleague's profile or seeing them in their yacht network, there should be an "Endorse" action that opens the endorsement writer — including the writing assist.

## Entry points
- Public profile: "Endorse" button (visible to logged-in users who share a yacht)
- Network page: alongside the existing "Request" buttons, an "Endorse" action for colleagues
- Yacht page: endorse a crew member directly from the yacht entity

## Requirements
- Must still verify the endorser actually worked on a shared yacht (same validation as request flow)
- Writing assist should be available (same LLM-powered drafting)
- No token needed — auth + shared yacht is sufficient
- Endorsee gets a notification that someone endorsed them

## Notes
- This is a natural engagement driver — makes endorsements feel organic rather than transactional
- Could be gated: only allow unsolicited endorsements between colleagues who share at least one yacht
- The endorsement request flow remains for reaching out to people who aren't on the platform yet
