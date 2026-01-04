# Digits!

A puzzle game that challenges your pattern recognition skills. Match pairs of digits to clear the board and advance through increasingly difficult stages.

## Quick Start

```bash
npm install
npm run dev
```

## How to Play

**Goal:** Clear all digits from the board by matching them in pairs.

**Matching Rules:**
- Two digits match if they are **equal** (e.g., 5-5) or **sum to 10** (e.g., 3-7)
- There must be a **clear path** between them (no digits blocking)

**Valid Paths:**
| Direction | Description |
|-----------|-------------|
| Horizontal | Same row, no digits between |
| Vertical | Same column, no digits between |
| Diagonal | Along diagonal, no digits between |
| Wrap-around | Across row boundaries (end of one row to start of next) |

**Scoring:**
- Base points = sum of matched digits
- Bonus = 2 points per cell between the matched pair

## Game Progression

- **Stages:** Clear the board to advance. Each stage gets harder.
- **Add Rows:** Limited to 4 uses per stage. Adds new rows when stuck.

## Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm test         # Run tests
```

## Documentation

See [design.md](./design.md) for detailed game mechanics and technical implementation.

---

*Built with React + TypeScript + Vite*
