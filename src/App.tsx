import { useGame } from './hooks/useGame';
import { Board } from './components/Board';
import { ScoreBoard } from './components/ScoreBoard';
import { GameControls } from './components/GameControls';

function App() {
  const {
    board,
    score,
    selectedCell,
    handleCellClick,
    handleAddRows,
    handleNewGame,
  } = useGame();

  return (
    <div className="app">
      <header className="header">
        <h1>Digits!</h1>
        <ScoreBoard score={score} />
      </header>
      <main className="main">
        <Board
          board={board}
          selectedCell={selectedCell}
          onCellClick={handleCellClick}
        />
      </main>
      <footer className="footer">
        <GameControls onNewGame={handleNewGame} onAddRows={handleAddRows} />
        <div className="rules">
          <p>Match pairs of digits that are <strong>equal</strong> or <strong>sum to 10</strong>.</p>
          <p>Path must be clear: horizontal, vertical, diagonal, or wrap-around.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
