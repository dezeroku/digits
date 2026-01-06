import { useState, useEffect } from 'react';
import { useGame } from './hooks/useGame';
import { useVersionCheck } from './hooks/useVersionCheck';
import { useSettings } from './hooks/useSettings';
import { Board } from './components/Board';
import { ScoreBoard } from './components/ScoreBoard';
import { GameControls } from './components/GameControls';
import { DigitAvailability } from './components/DigitAvailability';
import { StageCompleteModal } from './components/StageCompleteModal';
import { ConfirmModal } from './components/ConfirmModal';
import { TopScoresModal } from './components/TopScoresModal';
import { WelcomeModal } from './components/WelcomeModal';
import { GameOverModal } from './components/GameOverModal';
import { UpdateBanner } from './components/UpdateBanner';
import { SettingsModal } from './components/SettingsModal';
import { getTopScores, addScore, ScoreEntry } from './utils/scoreStorage';
import { playGameOverSound, playHighScoreSound } from './utils/sounds';

const WELCOME_SEEN_KEY = 'digits-welcome-seen';

function App() {
  const { settings, toggleSound, toggleAnimations } = useSettings();

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
    hintCells,
    helpRemaining,
    showAddRowsHint,
    newCells,
    digitUsage,
    maxDigitUses,
    handleCellClick,
    handleAddRows,
    handleNewGame,
    handleContinue,
    handleHelp,
  } = useGame({
    soundEnabled: settings.soundEnabled,
    animationsEnabled: settings.animationsEnabled,
  });

  const { updateAvailable, reloadApp, dismissUpdate } = useVersionCheck();

  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [showTopScores, setShowTopScores] = useState(false);
  const [topScores, setTopScores] = useState<ScoreEntry[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
      if (settings.soundEnabled) {
        if (achievedHighScore) {
          playHighScoreSound();
        } else {
          playGameOverSound();
        }
      }
    }
  }, [gameOver, score, settings.soundEnabled]);

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
        <div className="header-left">
          <button
            className="btn-icon"
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
            title="Settings"
          >
            ⚙️
          </button>
          <button
            className="btn-icon"
            onClick={handleNewGameClick}
            aria-label="New Game"
            title="New Game"
          >
            🔄
          </button>
        </div>
        <div className="header-center">
          <h1 className="header-title">Digits!</h1>
          <span className="stage-badge" title={`Stage ${stage}`}>
            <span className="stage-icon">⭐</span>
            <span className={`stage-number stage-${Math.min(stage, 5)}`}>{stage}</span>
          </span>
        </div>
        <div className="header-right">
          <ScoreBoard score={score} onTopScores={handleShowTopScores} />
        </div>
      </header>
      <DigitAvailability digitUsage={digitUsage} maxUses={maxDigitUses} />
      <main className="main">
        <Board
          board={board}
          selectedCell={selectedCell}
          clearingRows={clearingRows}
          invalidCells={invalidCells}
          hintCells={hintCells}
          newCells={newCells}
          onCellClick={handleCellClick}
        />
      </main>
      <footer className="footer">
        <GameControls
          addRowsRemaining={addRowsRemaining}
          helpRemaining={helpRemaining}
          showAddRowsHint={showAddRowsHint}
          onAddRows={handleAddRows}
          onHelp={handleHelp}
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
      {showSettings && (
        <SettingsModal
          settings={settings}
          onToggleSound={toggleSound}
          onToggleAnimations={toggleAnimations}
          onClose={() => setShowSettings(false)}
        />
      )}
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
