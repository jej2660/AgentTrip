# Downhill Route

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite, React, TypeScript, and Tailwind CSS. The first release is a mobile-first web prototype with progressive enhancement: it remains usable with labeled sample data, and shows a live Kakao map and Kakao place search when a domain-restricted JavaScript key is configured.

## Users

People planning a day trip around hilly neighborhoods, starting with Dongincheon. The primary prototype scenarios are couples, friends, solo travelers, and families, including groups traveling with an older adult or someone who wants to minimize uphill walking.

## Product Purpose

Help travelers quickly compose and understand a route that spends less physical energy by moving uphill with transport first and visiting places while walking downhill. Prototype success means a user can choose their travel context, select recommended places, pick a mobility persona, and understand the resulting mixed-mode route without instruction.

## Positioning

Unlike shortest-time or shortest-distance navigation, Downhill Route makes slope and personal energy the organizing principle. It explains the route as an energy-saving travel story: ride up, enjoy the descent, and see how much uphill walking was avoided.

## Operating Context

- Mobile use before or during a Dongincheon day trip.
- Users may travel alone, on a date, with friends, or with family.
- Users choose a trip theme such as food, history, or arts and culture.
- Users may combine walking, public transit, taxi, bicycle, and personal mobility.
- Car owners may start and end at a parking basecamp.

## Capabilities and Constraints

- The first implementation is a frontend-first interactive prototype. It uses clearly labeled synthetic Dongincheon route data as a fallback and connects to Kakao Maps JavaScript API for live map rendering and place search when configured.
- The prototype covers onboarding, companion type, trip theme, recommended-place selection, mobility persona selection, route generation feedback, a mixed-mode route map, an elevation profile, and an energy-saving summary.
- Real pedestrian routing, elevation, weather, transit, taxi, parking, and PM availability integrations remain outside the first integration slice. They must be added behind replaceable provider interfaces, with secret credentials kept in server-side functions.
- Four personas are used: toad, turtle, rabbit, and sloth. Each persona expresses an understandable trade-off between walking effort, cost, and itinerary density.
- Walking, public transit, taxi, bicycle, and PM route segments must be distinguishable without relying on color alone.
- Korean is the prototype language.

## Brand Commitments

- Working names: `Downhill Route` and `슬기로운 평지 산책`.
- The experience should feel helpful, local, playful, and immediately understandable without trivializing accessibility needs.
- Character personas are functional decision aids, not decorative mascots.

## Evidence on Hand

- A detailed Korean service concept supplied by the product owner, including value proposition, personas, route rules, onboarding inputs, result metrics, Dongincheon example destinations, weather behavior, parking loops, and accessibility considerations.
- No validated route, elevation, pricing, mobility inventory, customer research, or performance benchmark is available yet. Prototype values must be labeled as examples rather than factual claims.

## Product Principles

1. Show the saved uphill effort before exposing route complexity.
2. Ask for human context in plain language instead of technical routing preferences.
3. Make every transport transition visible and actionable.
4. Keep the first route understandable at a glance on a phone.
5. Treat accessibility and bad-weather safety as route constraints, not optional decoration.

## Accessibility & Inclusion

The interface must support large touch targets, clear Korean labels, visible focus states, sufficient contrast, reduced-motion preferences, and route distinctions that combine color with icons, patterns, and text. Family flows must account for older adults, wheelchair users, and stroller users without labeling them as a single homogeneous group.
