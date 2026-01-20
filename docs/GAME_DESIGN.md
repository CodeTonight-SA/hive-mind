# Hive Mind - Game Design Document

Internal design document for the CodeTonight team.

## Origin

Conceived during a team standup (15 Jan 2026) as a "Wordle for teams" - a quick, cooperative game to build team cohesion.

**Key inspirations:**
- Rush Hour (sliding puzzle)
- Overcooked (cooperative chaos)
- Keep Talking and Nobody Explodes (asymmetric information)

## Design Pillars

### 1. Forced Cooperation

The game is **impossible** to solve alone. Each player has abilities the other lacks. This isn't optional teamwork - it's mandatory.

### 2. Quick Sessions

Target: 3-5 minutes per puzzle. This fits into:
- Morning standup breaks
- Slack/Teams "anyone want to play?" moments
- Quick decompression between tasks

### 3. Communication as Gameplay

The puzzle itself is simple. The challenge is coordinating with your partner:
- "Can you rotate that L-piece?"
- "I need you to move first"
- "Wait, let me slide this out of your way"

### 4. Accessible Complexity

Easy to learn, room to master:
- Rules fit in one sentence per role
- No tutorial needed - learn by playing
- Depth comes from coordination, not mechanics

## The Asymmetric Ability System

### Why Asymmetric?

Symmetric co-op (both players do everything) often leads to:
- One player dominates
- Reduced communication
- "I'll just do it myself" moments

Asymmetric abilities force:
- Verbal communication
- Mutual dependency
- Shared problem-solving

### Current Roles (2 Players)

| Role | Ability | Metaphor |
|------|---------|----------|
| Forager | Slide pieces | "I move things around" |
| Architect | Rotate pieces | "I change their shape" |

### Future Roles (3+ Players)

| Role | Ability | Metaphor |
|------|---------|----------|
| Swapper | Exchange two pieces | "I teleport things" |
| Pusher | Push piece + anything in path | "I bulldoze" |
| Phaser | Move through one obstacle | "I ghost through" |
| Locker | Freeze/unfreeze pieces | "I hold things still" |

Adding roles increases coordination complexity exponentially.

## The Hive Mind Theme

### Why Bees?

- Universal appeal
- Natural cooperation metaphor
- Distinct roles (workers, architects, queen)
- Warm, friendly aesthetic
- "Hive mind" = team thinking together

### Theme Dictionary

| Game Concept | Theme Translation |
|--------------|-------------------|
| Puzzle grid | Hive chamber |
| Target piece | The Queen |
| Blockers | Worker bees, larvae, honey stores |
| Exit | Chamber entrance |
| Slide role | Forager (moves things) |
| Rotate role | Architect (reshapes comb) |
| Win state | Queen is safe |

### Visual Language

- **Colors:** Honey gold (#f4a100), warm amber, cream
- **Shapes:** Rounded corners, organic feel
- **Symbols:** 👑 Queen, 🐝 Worker, 🥚 Larva, 🍯 Honey

## Puzzle Design

### Grid Specifications

- **Size:** 5x5 cells
- **Exit:** Right edge, middle row (row 2)
- **Queen start:** Always on left side, row 2

### Piece Shapes

| Shape | Grid Footprint | Can Rotate? |
|-------|----------------|-------------|
| 2x1 horizontal | ▪▪ | Yes → vertical |
| 2x1 vertical | ▪<br>▪ | Yes → horizontal |
| 3x1 horizontal | ▪▪▪ | Yes → vertical |
| 3x1 vertical | ▪<br>▪<br>▪ | Yes → horizontal |
| L-shape | ▪▪<br>▪ | Yes (4 orientations) |

### Difficulty Progression

| Level | Pieces | Rotation Needed | Moves |
|-------|--------|-----------------|-------|
| 1 (Tutorial) | 2 | No | 3-5 |
| 2 (Easy) | 3-4 | Minimal | 5-8 |
| 3 (Medium) | 4-5 | Required | 8-12 |
| 4 (Hard) | 5-6 | Multiple | 12-18 |
| 5 (Expert) | 6+ | Complex sequence | 18+ |

### Puzzle Design Rules

1. **Always solvable** - Test every puzzle before shipping
2. **Multiple solutions OK** - Optimal path exists but alternatives work
3. **Queen never rotates** - Simplifies win detection
4. **Exit is always middle row** - Consistent mental model
5. **No instant wins** - At least 3 moves minimum

## Scoring System

### Primary Metric: Move Count

- Every slide = 1 move
- Every rotation = 1 move
- Lower is better
- Par displayed for each puzzle

### Why Not Time?

Time pressure:
- Creates anxiety
- Punishes communication
- Favors speed over thoughtfulness
- Doesn't fit "work break" vibe

Move counting:
- Rewards planning
- Encourages discussion
- Allows pausing
- Clear improvement metric

### Future: Leaderboards

- Team scores (combined moves)
- Daily/weekly puzzles
- Company vs Company rankings

## Multiplayer Design

### Room System

- 4-character codes (easy to share verbally)
- Codes use unambiguous characters (no 0/O, 1/I/L)
- Rooms persist until both players leave

### Role Selection

- First-come, first-served
- Roles locked once game starts
- Both roles required to begin

### State Sync

- Server authoritative
- ~50ms typical latency (edge-deployed)
- Optimistic UI updates with server reconciliation

## Future Features (Prioritized)

### High Priority

1. **Touch/drag for mobile** - Essential for phones
2. **Sound effects** - Satisfying slide/rotate sounds
3. **Puzzle progression** - Save progress, unlock harder puzzles

### Medium Priority

4. **Procedural generation** - Infinite puzzles
5. **Daily puzzle** - Wordle-style shared daily challenge
6. **3+ player support** - Additional roles

### Low Priority

7. **Company mode** - Teams compete
8. **Custom puzzles** - User-created levels
9. **Replay system** - Watch solutions
10. **Hints system** - Stuck? Get a nudge

## Success Metrics

### Engagement

- Games played per user per week
- Return rate (play again tomorrow?)
- Session length

### Collaboration

- Chat messages per game (if we add chat)
- Role distribution (do people try both?)
- Completion rate

### Virality

- Invite rate (share room codes)
- Company adoption (multiple teams at same org)

## Open Questions

1. **Should we add chat?** Or rely on external communication (Slack, voice)?
2. **Puzzle difficulty curve?** How steep? Adaptive?
3. **Onboarding?** Tutorial puzzle or learn-by-doing?
4. **Monetization?** (If ever) Premium puzzles? Company subscriptions?

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-20 | M>> + CIPS | Initial GDD |
