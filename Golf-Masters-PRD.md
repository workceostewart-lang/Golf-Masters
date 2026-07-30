# Golf Masters — Product Requirements Document

## 1. Overview

**Golf Masters** is a vertically-oriented, single-screen puzzle golf game. Instead of traditional 18-hole stroke-play golf, each level is a self-contained obstacle puzzle: the player aims and hits a ball down a narrow, vertically-scrolling course, navigating walls, wind currents, push-tunnels, and spinning targets to sink the ball in the hole. There is no par or stipulation — the objective is simply **get the ball in the hole**, with bonus recognition (hole-in-one, birdie, eagle) for doing it efficiently.

The game ships with **1,500+ unique courses**, each with its own color palette, layout, and obstacle combination, and supports both **Solo Play** and **Room-Code Multiplayer**.

## 2. Core Pillars

- **Puzzle-first golf**: precision and course-reading matter more than swing power meters.
- **Vertical, portrait-first layout**: designed for one-handed mobile play, scrolling top-to-bottom.
- **Visual variety**: every course looks and feels distinct — no two are reskins of each other in the player's eyes, even where they may share obstacle logic under the hood.
- **Celebration**: strong positive feedback for great shots (hole-in-one, eagle, birdie).
- **Zero-friction multiplayer**: join a friend's game in seconds with a room code.

## 3. Visual Style & Cover Art

- Vibrant, saturated **green grass** as the base motif across menus and marketing/cover art — a stylized fairway/turf texture, golf flag silhouette, and ball, in a bold flat-illustration style (matching the reference screenshots: thick black outlines, flat color fills, soft drop shadows).
- Each course reskins its **fairway color** (the reference shows coral/salmon fairways on green backgrounds) so that no two neighboring courses feel visually repetitive — palette pools include fairway color, border/frame color, background color, and obstacle accent colors.
- UI chrome (score pill, EXIT button, "Your turn" banner) stays consistent in style across all courses for readability, per the reference screenshots.

## 4. Course Anatomy

Each course is a tall, narrow vertical corridor (a "lane") framed by a thick border, viewed top-down. Standard elements:

- **Tee (start point)**: white ball marker, typically near the bottom of the lane.
- **Hole (cup)**: black cup with white lip, typically near the top of the lane (ball travels bottom → top, or top → bottom depending on course).
- **Obstacles** (see Section 5), placed along the lane between tee and hole.
- **Course frame**: thick black/white bordered lane on a vibrant colored background, per reference art.

## 5. Obstacles

| Obstacle | Behavior |
|---|---|
| **Walls / bumpers** | Solid black barriers the ball ricochets off of; used to create angled bank-shot puzzles. |
| **Wind zones** | Directional current (shown as animated diagonal streaks in-lane) that continuously pushes the ball off its straight-line path while it's inside the zone. |
| **Push tunnels** | Enclosed channels that forcibly eject the ball at a set speed/angle on exit, adding momentum the player must plan around. |
| **Spinning targets** | Rotating diamond/gate obstacles (per reference art) — the ball must pass through the open gap at the right moment, timed to the target's rotation, or it deflects off the target. |
| **Narrow gates / choke points** | Tight gaps requiring precise angle and power. |

Later courses combine multiple obstacle types (e.g., wind zone leading into a spinning target, followed by a wall bank-shot).

## 6. Scoring & Feedback

- No par, no stroke limit, no stipulations — courses are complete whenever the ball goes in.
- Shot count is tracked per course purely for feedback/bragging rights:
  - **Hole-in-one** (1 shot): biggest celebration — screen flash, confetti/particle burst, sound sting, animated banner.
  - **Eagle** (2 shots under an internal "expected shot" baseline, or first applicable low-shot tier): strong celebration.
  - **Birdie** (1 shot under baseline): medium celebration.
  - Standard completion: shot count shown, quick positive confirmation, auto-advance prompt to next course.
- Each course has an internal "expected shots" reference (invisible to the player as a par-like pressure, used only to trigger celebration tiers) so hole-in-one/eagle/birdie logic works without displaying a stipulation.

## 7. Course Library

- **1,500+ unique courses**, hand-authored and systematically varied so each has:
  - a distinct fairway/background/accent color palette
  - a distinct obstacle layout and combination
  - unique decorative details/icons around the course (trees, sand-trap patterns, flags, stars, water accents, etc. consistent with a golf theme) so courses feel individually crafted rather than palette-swapped copies.
- Courses are organized into progressive difficulty bands (early courses = single obstacle type introduced gently; later courses = dense combinations).
- **Progress auto-saves** after every course completion — the player can close the app and resume exactly where they left off, with course-by-course completion/shot history retained.
- Post-hole flow: after sinking the ball, the player is shown their result (shots/celebration tier) and then automatically advances toward the **next course**, keeping momentum between holes.

## 8. Game Modes / Main Menu

Main menu options:
1. **Solo Play** — progress through the course library at your own pace (auto-saved).
2. **Versus CPU** — head-to-head play against a CPU opponent, no room code needed (see Section 9a).
3. **Multiplayer** — room-code based head-to-head play (see Section 9b).
4. (Supporting) Settings, course select/replay, stats.

## 9. Head-to-Head Play (Versus CPU & Multiplayer)

### 9a. Versus CPU

- Same core head-to-head structure and rules as Multiplayer (turn order, camera-lock behavior, point-based match win) — **without any room code or second device**. The player configures the match (points required to win) and immediately plays against a CPU opponent on the same device.
- **Turn structure — consecutive, camera-locked play**:
  - Player plays the current course while the view is (conceptually) "camera-locked" to their own play, same as in multiplayer, until they sink the ball.
  - The CPU then takes its turn on the same course; its shot(s) play out on-screen (animated, not instant) so the player can watch the CPU attempt the hole, mirroring the spectator experience from multiplayer.
  - Whoever completes the hole in fewer shots wins that hole's point(s); tie rules match whatever is defined for Multiplayer (Section 9b).
- **Match win condition**: First to reach the configured point total (player or CPU) wins the match.
- **CPU difficulty**: to be defined — at minimum a baseline difficulty; expandable later to multiple difficulty tiers (e.g., easy/medium/hard) consistent with CPU approaches used in the other games in this portfolio.

### 9b. Multiplayer (Room Code)

- **Room creation**: Host taps "Create Room," configures **party settings** — specifically, **points required to win** the match — and receives a shareable **room code**.
- **Joining**: Second player enters the room code on their own device (mobile or desktop/web) to join the host's match.
- **Turn structure — consecutive, camera-locked play**:
  - Player 1 plays the current course while Player 2's screen is **camera-locked to Player 1's view**, watching in real time until Player 1 sinks the ball.
  - Once Player 1 finishes the hole, control passes to Player 2 on the **same course**, and Player 1's screen becomes the locked spectator view until Player 2 finishes.
  - Whoever completes the hole in fewer shots wins that hole's point(s); tie rules to be defined (e.g., replay tiebreaker hole or split point).
- **Match win condition**: First player to reach the host-configured point total wins the match.
- Cross-platform: a host on one device type (e.g., desktop) can play against a joiner on another (e.g., mobile), as long as both are on the room-code system.

## 10. Reference Art

The three reference screenshots provided (vertical coral-fairway lane, thick black/white/coral frame, black obstacle circle, wind-streak effects, spinning diamond gate obstacles, white ball and black cup, "Your turn" banner, score pill, EXIT button) define the **baseline visual and UI language** for every course. Custom course designs beyond these references should stay consistent with this framing, obstacle iconography, and UI chrome while introducing new colors, layouts, and obstacle combinations.

## 11. Out of Scope (v1)

- Par/stipulation-based scoring or handicap systems.
- In-app purchases / monetization (not specified — flag for future discussion).
- More than 2-player multiplayer (v1 is head-to-head only).

## 12. Open Questions

- Tiebreaker rule when both players finish a hole in the same number of shots.
- Exact "expected shots" baseline formula used to determine birdie/eagle thresholds per course.
- Whether desktop and mobile multiplayer share identical control schemes (e.g., drag-to-aim vs. click-to-aim).
