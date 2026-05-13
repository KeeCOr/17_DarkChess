# Turn Rules Layout UX Design

## Goal

Make the game screen teach the player that each turn allows one move and one summon, while also explaining how summoning and fog-of-war visibility work.

## Design

- Rebuild the right HUD as a turn command panel: turn/timer/mana at top, two action slots in the middle, summon cards below, and help/end controls at the bottom.
- Show board hints that change with player state: default, piece selected, summon card selected, move-only remaining, summon-only remaining, and turn complete.
- Add a help popup explaining: move once per turn, summon once per turn, summons go on empty cells around allied pieces, and visibility opens around allied pieces plus move paths.
- Increase text contrast and restore readable Korean UI copy.
- Keep gameplay rules unchanged.

## Acceptance

- The HUD clearly shows `이동 1회` and `소환 1회`.
- The player gets explicit feedback after moving or summoning about the remaining action.
- Selecting a summon card tells the player to click highlighted green/cyan board cells.
- Help can be opened during the game without changing state.
- Tests pass, docs are updated, and v0.1.2 portable exe is built and copied to the repo root.
