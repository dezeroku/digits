# Digits! - Game Design Document

## Overview

Digits! is a number-matching puzzle game where players clear a board by pairing digits that follow specific matching and path rules. The game features progressive difficulty through a stage system, distance-based scoring bonuses, and guaranteed solvability.

---

## Game Mechanics

### The Board

The game board is a 9-column by 10-row grid of cells. Each cell contains either:
- A digit from 1 to 9
- Empty (previously matched)

The board can grow vertically when the player uses the "Add Rows" feature, which appends 4 new rows to the bottom.

### Matching Rules

Two digits can be matched if **both** conditions are met:

#### 1. Value Compatibility

The digits must satisfy one of these conditions:
- **Same digit:** Both cells contain the same number (e.g., 4 and 4)
- **Sum to ten:** The digits add up to 10 (e.g., 3 and 7, or 5 and 5)

#### 2. Clear Path

There must be an unobstructed path between the two cells. A path is clear if all cells between the endpoints are empty. The game recognizes four types of paths:

| Path Type | Description | Example |
|-----------|-------------|---------|
| **Horizontal** | Cells on the same row | `[3][ ][ ][7]` - can match |
| **Vertical** | Cells in the same column | Cells stacked vertically with empty cells between |
| **Diagonal** | Cells on a diagonal line | Equal row and column distance, all cells between empty |
| **Wrap-around** | Treats board as continuous line | End of row connects to start of next row |

#### Wrap-around Path (Special Rule)

The board can be viewed as a single continuous line where each row follows the previous. This allows matching across row boundaries:

```
Row 0: [1][2][3]
Row 1: [4][5][6]

Linear view: [1][2][3][4][5][6]
             (indices 0-5)
```

If position (0,2) contains `3` and position (1,0) contains `7`, they are adjacent in linear terms and can be matched if no digits block the path.

### Scoring System

Points are awarded for each successful match:

```
Score = Base Points + Distance Bonus

Base Points = digit₁ + digit₂
Distance Bonus = cells_between × 2
```

**Examples:**

| Match | Cells Between | Calculation | Score |
|-------|---------------|-------------|-------|
| Adjacent 3-7 | 0 | 10 + (0 × 2) | 10 |
| 3-7 with 2 empty cells | 2 | 10 + (2 × 2) | 14 |
| 5-5 with 4 empty cells | 4 | 10 + (4 × 2) | 18 |

This system rewards players for clearing paths to make distant matches possible.

---

## Stage System

### Progression

The game is divided into stages with increasing difficulty:

| Stage | Difficulty | Pair Distribution |
|-------|------------|-------------------|
| 1 | Easy | Pairs placed close together |
| 2 | Medium | Mix of close and spread-out pairs |
| 3+ | Hard | Pairs far apart, requiring path clearing |

### Stage Advancement

A stage is completed when **all cells on the board are cleared**. Upon completion:
1. Stage counter increments
2. A new board is generated with increased difficulty
3. Add Rows counter resets to 4

### Add Rows Mechanic

Players have a limited ability to add new rows:
- **4 uses per stage** maximum
- Each use adds **4 new rows** to the bottom of the board
- Counter resets when advancing to the next stage
- Useful when stuck with no visible matches

---

## Board Generation

### Design Goals

The board generation algorithm ensures:
1. **Solvability:** Every generated board can be completely cleared
2. **Difficulty scaling:** Higher difficulties create more challenging puzzles
3. **Randomness:** Each game feels different

### The Reverse-Solve Algorithm

The core insight is that if we build the board by placing matchable pairs one at a time, ensuring each pair has a valid path when placed, then removing pairs in reverse order will always work.

#### Step-by-Step Process

1. **Initialize:** Start with an empty board (all cells null)

2. **Shuffle positions:** Create a randomized list of all board positions

3. **Place pairs iteratively:**
   - Take the first available position as `position A`
   - Search remaining positions for `position B` that:
     - Has a valid path to A (no occupied cells blocking)
     - Meets the distance requirements for current difficulty
   - Select optimal values using smart value selection (see below)
   - Place values at both positions
   - Remove both positions from the available list
   - Repeat until all positions are filled

4. **Path validation during placement:** When the board is partially filled, check that the path between A and B only passes through empty (null) cells

#### Why This Guarantees Solvability

- Pair 1 is placed when the board is empty (always has valid path)
- Pair 2 is placed with only Pair 1 on the board
- Pair N is placed with Pairs 1 through N-1 on the board
- **Solution:** Remove pairs in reverse order (N, N-1, ..., 2, 1)
- Each pair will have a clear path when it's their turn to be removed

### Minimizing Adjacent Matches

A naive implementation would create many "accidental" adjacent matches—cells that weren't placed as a pair but happen to have matching values next to each other. This makes the puzzle too easy.

#### Smart Value Selection

When placing a pair at positions A and B, the algorithm:

1. **Evaluates all possible value pairs** (17 combinations: 9 sum-to-10 pairs + 8 same-digit pairs)

2. **Counts adjacent conflicts** for each option:
   - For each value, count how many neighboring cells contain a matching value
   - A "match" is same digit OR sum-to-10

3. **Selects the best option** with lowest conflict count:
   - 80% chance: Pick the absolute best (fewest conflicts)
   - 20% chance: Pick randomly from top 5 (adds variety)

This approach reduces accidental adjacent matches from ~55% to ~2%.

### Adaptive Distance Relaxation

As the board fills up, finding positions with valid paths becomes harder. The algorithm adapts:

- **First 60% of pairs:** Full distance requirements apply
- **Last 40% of pairs:** Requirements gradually relax (up to 90% reduction)
- This prevents dead-ends where no valid positions remain

### Difficulty-Based Placement

The algorithm adjusts pair placement based on difficulty:

#### Easy Mode
- **Close pairs**, easy to find matches
- Minimum distance: 0% (adjacent allowed)
- Maximum distance: 25% of board size
- Adjacent matches minimized through smart value selection

#### Medium Mode
- **Some distance**, moderate challenge
- Minimum distance: 2% of board size
- Maximum distance: 40% of board size
- Result: Some path clearing needed

#### Hard Mode
- **Spread out pairs** that require clearing
- Minimum distance: 4% of board size
- Maximum distance: 70% of board size
- Early pairs placed far apart get "buried" by later pairs
- Result: Strategic path-clearing required

#### Progressive Distance (Hard Mode)

In hard mode, the algorithm uses a "burying" strategy:
- **Early pairs** (placed first, solved last) → maximum distance
- **Later pairs** (placed last, solved first) → distance decreases
- This creates layers where accessible pairs must be cleared to reach buried pairs

### Fallback Mechanism

If the algorithm cannot find valid positions after 50 attempts, it uses a fallback strategy:

1. **Distant pair placement:** Pairs position `i` with position `i + 45` (half the board)
   - This ensures intentional pairs are far apart (not adjacent)
   - Wrap-around paths guarantee solvability

2. **Smart value selection:** Same algorithm as main generation
   - Minimizes accidental adjacent matches
   - Maintains board variety

The fallback is always solvable because positions at fixed offsets always have valid wrap-around paths.

### Adding New Rows

When the player adds rows, the same principles apply:
1. New rows are added with empty cells
2. Pairs are generated within the new rows using the same algorithm
3. Difficulty setting is respected
4. New pairs are solvable among themselves

---

## Technical Architecture

### Key Modules

| Module | Responsibility |
|--------|----------------|
| `gameLogic.ts` | Matching rules, path validation, scoring |
| `boardGenerator.ts` | Solvable board generation, difficulty system |
| `useGame.ts` | Game state management, stage progression |

### State Management

The game state includes:
- `board`: 2D array of cells
- `score`: Current point total
- `stage`: Current stage number
- `selectedCell`: Currently selected cell (or null)
- `addRowsRemaining`: Uses left for current stage

### Cell Representation

```typescript
interface Cell {
  value: number | null;  // 1-9 or null if cleared
  position: Position;    // { row, col }
}
```

---

## Mobile Optimization

The board dimensions (9×10) are chosen for mobile screens:
- **Width:** 9 cells × 38px ≈ 358px (fits 375px iPhone SE)
- **Height:** 10 rows visible without scrolling
- **Responsive:** Cells shrink to 34px on very small screens
