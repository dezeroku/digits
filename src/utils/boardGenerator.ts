import { Board, Cell } from '../types';

const COLS = 12;

function randomDigit(): number {
  return Math.floor(Math.random() * 9) + 1;
}

export function createRow(rowIndex: number, cols: number = COLS): Cell[] {
  const row: Cell[] = [];
  for (let col = 0; col < cols; col++) {
    row.push({
      value: randomDigit(),
      position: { row: rowIndex, col },
    });
  }
  return row;
}

export function generateBoard(rows: number = 20, cols: number = COLS): Board {
  const board: Board = [];
  for (let row = 0; row < rows; row++) {
    board.push(createRow(row, cols));
  }
  return board;
}

export function addRows(board: Board, count: number = 4, cols: number = COLS): Board {
  const newBoard = [...board];
  const startRow = board.length;
  for (let i = 0; i < count; i++) {
    newBoard.push(createRow(startRow + i, cols));
  }
  return newBoard;
}
