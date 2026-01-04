import { useState, useEffect } from 'react';
import { useGame } from './hooks/useGame';
import { useVersionCheck } from './hooks/useVersionCheck';
import { Board } from './components/Board';
import { ScoreBoard } from './components/ScoreBoard';
import { GameControls } from './components/GameControls';
import { StageCompleteModal } from './components/StageCompleteModal';
import { ConfirmModal } from './components/ConfirmModal';
import { TopScoresModal } from './components/TopScoresModal';
import { WelcomeModal } from './components/WelcomeModal';
import { GameOverModal } from './components/GameOverModal';
import { UpdateBanner } from './components/UpdateBanner';
import { getTopScores, addScore, ScoreEntry } from './utils/scoreStorage';
import { playGameOverSound, playHighScoreSound } from './utils/sounds';

const WELCOME_SEEN_KEY = 'digits-welcome-seen';

function App() {
  const {
    board,
    score,
    selectedCell,
    stage,
    stageComplete,
    gameOver,
    addRowsRemaining,
    clearingRows,
    invalidCells,
    handleCellClick,
    handleAddRows,
    handleNewGame,
    handleContinue,
  } = useGame();

  const { updateAvailable, reloadApp, dismissUpdate } = useVersionCheck();

  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [showTopScores, setShowTopScores] = useState(false);
  const [topScores, setTopScores] = useState<ScoreEntry[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isHighScore, setIsHighScore] = useState(false);

  // Handle game over - save score and check if it's a high score
  useEffect(() => {
    if (gameOver) {
      const wasAdded = addScore(score);
      const scores = getTopScores();
      const isTop1 = scores.length > 0 && scores[0].score === score;
      const achievedHighScore = wasAdded && isTop1;
      setIsHighScore(achievedHighScore);

      // Play appropriate sound
      if (achievedHighScore) {
        playHighScoreSound();
      } else {
        playGameOverSound();
      }
    }
  }, [gameOver, score]);

  const handleGameOverRestart = () => {
    handleNewGame();
  };

  // Show welcome modal on first visit
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(WELCOME_SEEN_KEY);
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    localStorage.setItem(WELCOME_SEEN_KEY, 'true');
    setShowWelcome(false);
  };

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
      {updateAvailable && (
        <UpdateBanner onReload={reloadApp} onDismiss={dismissUpdate} />
      )}
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
        <div className="build-info">
          Build: {__GIT_COMMIT__} ({new Date(__BUILD_TIME__).toLocaleString()})
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
      {showWelcome && <WelcomeModal onClose={handleCloseWelcome} />}
      {gameOver && (
        <GameOverModal
          score={score}
          isHighScore={isHighScore}
          onRestart={handleGameOverRestart}
        />
      )}
    </div>
  );
}

export default App;
