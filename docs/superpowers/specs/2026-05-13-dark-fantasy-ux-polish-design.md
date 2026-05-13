# Dark Fantasy UX Polish Design

## Goal

Improve Chess Summon's first impression, in-game readability, and click feedback while keeping the existing rules and scene flow intact.

## Direction

Use a dark fantasy tactical-board style: deep navy panels, warm gold accents, emerald action states, crimson danger states, and subtle ritual-board graphics. The art should feel more present without requiring new asset production.

## Scope

- Menu, placement, tutorial prompt, game board, HUD, surrender modal, turn banner, and result screen.
- UI copy readability and Korean text restoration where strings are visibly corrupted in source.
- Board and fog presentation so hidden cells feel like mist-covered terrain instead of a flat black block.
- Summon controls with clearer enabled, disabled, active, and hover states.
- Small UX improvements: richer button feedback, section labels, clearer action status, and more obvious turn/check indicators.

## Non-Goals

- No gameplay rule changes.
- No new battle systems, AI changes, or save data.
- No external art dependency beyond the existing piece sprites.

## Acceptance

- The menu immediately communicates the fantasy tactics theme.
- The in-game screen keeps the board readable and makes piece art easier to see.
- HUD information can be scanned in this order: turn, timer, mana, action status, summon choices, end/surrender.
- Tutorial and modal overlays match the same visual language.
- Existing unit tests pass and the app builds into the required portable executable.
