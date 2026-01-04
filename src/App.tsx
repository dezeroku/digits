import { useGame } from './hooks/useGame';
import { Board } from './components/Board';
import { ScoreBoard } from './components/ScoreBoard';
import { GameControls } from './components/GameControls';
import { StageCompleteModal } from './components/StageCompleteModal';

function App() {
  const {
    board,
    score,
    selectedCell,
    stage,
    stageComplete,
    addRowsRemaining,
    clearingRows,
    invalidCells,
    handleCellClick,
    handleAddRows,
    handleNewGame,
    handleContinue,
  } = useGame();

  return (
    <div className="app">
      <header className="header">
        <h1>Digits!</h1>
        <div className="stage-info">
          <span className="stage-label">Stage</span>
          <span className="stage-value">{stage}</span>
        </div>
        <ScoreBoard score={score} />
      </header>
      <main className="main">
        <Board
          board={board}
          selectedCell={selectedCell}
          clearingRows={clearingRows}
          invalidCells={invalidCells}
          onCellClick={handleCellClick}
        />
      </main>
      <footer className="footer">
        <GameControls
          addRowsRemaining={addRowsRemaining}
          onNewGame={handleNewGame}
          onAddRows={handleAddRows}
        />
        <div className="rules">
          <p>Match pairs of digits that are <strong>equal</strong> or <strong>sum to 10</strong>.</p>
          <p>Path must be clear: horizontal, vertical, diagonal, or wrap-around.</p>
          <p><strong>Tip:</strong> Distant matches earn bonus points!</p>
        </div>
      </footer>
      {stageComplete && (
        <StageCompleteModal stage={stage} onContinue={handleContinue} />
      )}
    </div>
  );
}

export default App;
