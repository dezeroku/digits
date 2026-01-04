export interface Position {
  row: number;
  col: number;
}

export interface Cell {
  value: number | null;
  position: Position;
}

export interface GameState {
  board: Cell[][];
  score: number;
  selectedCell: Position | null;
  cols: number;
}

export type Board = Cell[][];
