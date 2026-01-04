import { useState } from 'react';
import { useGame } from './hooks/useGame';
import { Board } from './components/Board';
import { ScoreBoard } from './components/ScoreBoard';
import { GameControls } from './components/GameControls';
import { StageCompleteModal } from './components/StageCompleteModal';
import { ConfirmModal } from './components/ConfirmModal';
import { TopScoresModal } from './components/TopScoresModal';
import { getTopScores, addScore, ScoreEntry } from './utils/scoreStorage';

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

  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [showTopScores, setShowTopScores] = useState(false);
  const [topScores, setTopScores] = useState<ScoreEntry[]>([]);

  const handleNewGameClick = () => {
    setShowNewGameConfirm(true);
  };

  const handleConfirmNewGame = () => {
    setShowNewGameConfirm(false);
    // Save current score before starting new game
    addScore(score);
    handleNewGame();
  };

  const handleCancelNewGame = () => {
    setShowNewGameConfirm(false);
  };

  const handleShowTopScores = () => {
    setTopScores(getTopScores());
    setShowTopScores(true);
  };

  const handleCloseTopScores = () => {
    setShowTopScores(false);
  };

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
          onNewGame={handleNewGameClick}
          onAddRows={handleAddRows}
          onTopScores={handleShowTopScores}
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
      {showNewGameConfirm && (
        <ConfirmModal
          title="Start New Game?"
          message="Your current progress will be lost. Are you sure?"
          confirmText="New Game"
          cancelText="Cancel"
          onConfirm={handleConfirmNewGame}
          onCancel={handleCancelNewGame}
        />
      )}
      {showTopScores && (
        <TopScoresModal scores={topScores} onClose={handleCloseTopScores} />
      )}
    </div>
  );
}

export default App;
