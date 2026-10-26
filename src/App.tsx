import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RacingScene } from './game/threeScene';
import { soundManager } from './audio/soundManager';
import { FORM1_QUESTIONS } from './data/questions';
import { HUD } from './components/HUD';
import { StartScreen } from './components/StartScreen';
import { GameOverModal } from './components/GameOverModal';
import { GameState, GameStats, AnsweredQuestion, MathQuestion, CarColor } from './types/game';

const INITIAL_STATS: GameStats = {
  score: 0,
  coins: 0,
  lives: 5,
  maxLives: 5,
  timeLeft: 90, // Generous 90s race time to complete 10 questions comfortably
  distance: 0,
  speedKmH: 0,
  comboStreak: 1,
  highestCombo: 1,
  questionsAnswered: 0,
  correctAnswersCount: 0,
  speedLevel: 1,
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<RacingScene | null>(null);

  // Game UI States
  const [gameState, setGameState] = useState<GameState>('START');
  const [selectedColor, setSelectedColor] = useState<CarColor>('cyan');
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [history, setHistory] = useState<AnsweredQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<MathQuestion | null>(null);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(15);
  const [highScore, setHighScore] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeLane, setActiveLane] = useState<number>(1);
  const [feedback, setFeedback] = useState<{ message: string; type: 'correct' | 'wrong' | 'hit'; id: number } | null>(null);

  // References to keep mutable game state in sync with Three loop without re-triggering effects
  const gameStateRef = useRef<GameState>('START');
  gameStateRef.current = gameState;

  const statsRef = useRef<GameStats>(INITIAL_STATS);
  statsRef.current = stats;

  const currentQuestionRef = useRef<MathQuestion | null>(null);
  currentQuestionRef.current = currentQuestion;

  const isPausedRef = useRef<boolean>(false);
  isPausedRef.current = isPaused;

  const lastSpawnZRef = useRef<number>(0);
  const nextQuestionSpawnZRef = useRef<number>(-50);
  const questionPoolRef = useRef<MathQuestion[]>([]);
  const questionIdxRef = useRef<number>(0);
  const questionStartTimeRef = useRef<number>(0);
  const nextQuestionAvailableTimeRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number>(0);

  // Load High Score on mount
  useEffect(() => {
    const saved = localStorage.getItem('math_dash_high_score');
    if (saved) {
      setHighScore(parseInt(saved, 10) || 0);
    }
  }, []);

  const showToast = useCallback((message: string, type: 'correct' | 'wrong' | 'hit') => {
    setFeedback({ message, type, id: Date.now() });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 1300);
  }, []);

  const triggerGameOver = useCallback(() => {
    setGameState('GAMEOVER');
    gameStateRef.current = 'GAMEOVER';
    soundManager.stopEngine();
    soundManager.playGameOver();

    const currentScore = statsRef.current.score;
    const saved = localStorage.getItem('math_dash_high_score');
    const prevHigh = saved ? parseInt(saved, 10) || 0 : 0;
    if (currentScore > prevHigh) {
      localStorage.setItem('math_dash_high_score', String(currentScore));
      setHighScore(currentScore);
    }
  }, []);

  // Handle Math Answer (with 10s timeout support)
  const handleAnswer = useCallback((chosenLane: number, isTimeout: boolean = false) => {
    const q = currentQuestionRef.current;
    if (!q || gameStateRef.current !== 'PLAYING') return;

    const isCorrect = !isTimeout && chosenLane === q.correctIndex;
    const currentStats = statsRef.current;

    // Record question in history
    setHistory((prev) => [
      ...prev,
      {
        question: q,
        selectedOptionIndex: isTimeout ? -1 : chosenLane,
        isCorrect,
        timeSpentSeconds: isTimeout ? 15 : Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000)),
      },
    ]);

    if (isCorrect) {
      soundManager.playCorrectAnswer();
      const points = 100 * currentStats.comboStreak;
      const newStreak = currentStats.comboStreak + 1;
      const newHighest = Math.max(currentStats.highestCombo, newStreak);

      setStats((prev) => ({
        ...prev,
        score: prev.score + points,
        timeLeft: Math.min(prev.timeLeft + 8, 99), // +8s time bonus!
        comboStreak: newStreak,
        highestCombo: newHighest,
        questionsAnswered: prev.questionsAnswered + 1,
        correctAnswersCount: prev.correctAnswersCount + 1,
      }));

      showToast(`TAHNIAH! +${points} MARKAH (+8s)`, 'correct');
    } else {
      soundManager.playWrongAnswer();
      sceneRef.current?.triggerCollisionShake();

      const newLives = currentStats.lives - 1;
      setStats((prev) => ({
        ...prev,
        lives: Math.max(0, newLives),
        comboStreak: 1,
        questionsAnswered: prev.questionsAnswered + 1,
      }));

      if (isTimeout) {
        showToast('MASA MENJAWAB TAMAT! -1 NYAWA', 'wrong');
      } else {
        showToast('JAWAPAN SALAH! -1 NYAWA', 'wrong');
      }

      if (newLives <= 0) {
        triggerGameOver();
        return;
      }
    }

    // Check if player completed all 10 questions
    if (currentStats.questionsAnswered + 1 >= 10) {
      setTimeout(() => {
        triggerGameOver();
      }, 1000);
      return;
    }

    // Clean up active gate & schedule next question with an 8-second gap
    sceneRef.current?.removeActiveGate();
    setCurrentQuestion(null);
    currentQuestionRef.current = null;
    setQuestionTimeLeft(15);
    nextQuestionAvailableTimeRef.current = Date.now() + 8000; // 8-second free racing gap!
    if (sceneRef.current) {
      lastSpawnZRef.current = sceneRef.current.carZ;
      nextQuestionSpawnZRef.current = sceneRef.current.carZ - 70;
    }
  }, [showToast, triggerGameOver]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const scene = new RacingScene(canvasMountRef.current, {
      onCollectCoin: (count) => {
        if (gameStateRef.current !== 'PLAYING') return;
        soundManager.playCoin();
        setStats((prev) => ({
          ...prev,
          coins: prev.coins + count,
          score: prev.score + 20,
        }));
      },
      onHitObstacle: () => {
        if (gameStateRef.current !== 'PLAYING') return;
        soundManager.playHitObstacle();
        const currentStats = statsRef.current;
        const newLives = currentStats.lives - 1;

        setStats((prev) => ({
          ...prev,
          lives: Math.max(0, newLives),
          comboStreak: 1,
        }));

        showToast('CRASH! -1 LIFE', 'hit');

        if (newLives <= 0) {
          triggerGameOver();
        }
      },
      onPassGate: (chosenLane) => {
        handleAnswer(chosenLane);
      },
    });

    sceneRef.current = scene;

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, [handleAnswer, showToast, triggerGameOver]);

  // Main 60-second timer & spawning tick loop
  useEffect(() => {
    if (gameState !== 'PLAYING' || isPaused) return;

    const timer = setInterval(() => {
      setStats((prev) => {
        if (prev.timeLeft <= 1) {
          clearInterval(timer);
          triggerGameOver();
          return { ...prev, timeLeft: 0 };
        }

        const nextTime = prev.timeLeft - 1;
        if (nextTime <= 10) {
          soundManager.playUrgentTick();
        } else if (nextTime % 10 === 0) {
          soundManager.playTick();
        }

        return { ...prev, timeLeft: nextTime };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, isPaused, triggerGameOver]);

  // Game update loop for distance, speed & spawning
  useEffect(() => {
    if (gameState !== 'PLAYING' || isPaused) return;

    let animId = 0;
    const gameTick = () => {
      const scene = sceneRef.current;
      if (scene) {
        // Sync stats
        const carDistance = Math.abs(scene.carZ);
        setStats((prev) => ({
          ...prev,
          distance: carDistance,
          speedKmH: scene.speed,
        }));

        setActiveLane(scene.targetLane);
        soundManager.updateEnginePitch(scene.speed / 80);

        // Procedural entity spawning
        const currentZ = scene.carZ;

        // Procedural entity spawning ONLY when NO question is active or approaching
        if (!currentQuestionRef.current && currentZ < lastSpawnZRef.current - 18) {
          lastSpawnZRef.current = currentZ;

          const spawnZ = currentZ - 45;
          const randomType = Math.random();

          if (randomType < 0.6) {
            // Spawn coin cluster across 3 lanes (Lane 0, 1, 2)
            const lane = Math.floor(Math.random() * 3);
            scene.spawnCoin(lane, spawnZ);
            scene.spawnCoin(lane, spawnZ - 3);
          } else {
            // Spawn obstacle in 1 lane (leaves 2 open lanes)
            const obsLane = Math.floor(Math.random() * 3);
            const obsType = Math.random() > 0.5 ? 'barrier' : 'cone';
            scene.spawnObstacle(obsLane, spawnZ, obsType);

            // Put coin in another lane
            const coinLane = (obsLane + 1) % 3;
            scene.spawnCoin(coinLane, spawnZ);
          }
        }

        // Update 10-second question answering timer if a question is active
        if (currentQuestionRef.current) {
          const elapsed = (Date.now() - questionStartTimeRef.current) / 1000;
          const remaining = Math.max(0, 15 - elapsed);
          setQuestionTimeLeft(remaining);

          if (remaining <= 0) {
            handleAnswer(-1, true); // 15 seconds expired!
          }
        }

        // Spawn Math Question Portal after the 8-second free racing gap
        if (
          !currentQuestionRef.current &&
          Date.now() >= nextQuestionAvailableTimeRef.current &&
          currentZ < nextQuestionSpawnZRef.current
        ) {
          // Initialize pool of 10 questions in order
          if (questionPoolRef.current.length === 0) {
            questionPoolRef.current = [...FORM1_QUESTIONS];
            questionIdxRef.current = 0;
          }

          if (questionIdxRef.current < questionPoolRef.current.length) {
            const q = questionPoolRef.current[questionIdxRef.current];
            questionIdxRef.current++;

            setCurrentQuestion(q);
            currentQuestionRef.current = q;
            questionStartTimeRef.current = Date.now();
            setQuestionTimeLeft(15);

            // Spawn Question Portal 125m ahead (giving clean, unobstructed highway approach)
            scene.spawnQuestionGate(currentZ - 125, q);
            soundManager.playTick();
          }
        }
      }

      animId = requestAnimationFrame(gameTick);
    };

    animId = requestAnimationFrame(gameTick);
    return () => cancelAnimationFrame(animId);
  }, [gameState, isPaused]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Start game shortcut
      if ((e.code === 'Space' || e.code === 'Enter') && gameStateRef.current === 'START') {
        e.preventDefault();
        startGame();
        return;
      }

      if (gameStateRef.current !== 'PLAYING') return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        sceneRef.current?.steerLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        sceneRef.current?.steerRight();
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        sceneRef.current?.setBoosting(true);
        soundManager.playBoost();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        sceneRef.current?.setBraking(true);
      } else if (e.key === '1') {
        sceneRef.current?.steerToLane(0);
        handleAnswer(0);
      } else if (e.key === '2') {
        sceneRef.current?.steerToLane(1);
        handleAnswer(1);
      } else if (e.key === '3') {
        sceneRef.current?.steerToLane(2);
        handleAnswer(2);
      } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePause();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        sceneRef.current?.setBoosting(false);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        sceneRef.current?.setBraking(false);
      }
    };

    const handleFocus = () => {
      window.focus();
    };

    window.addEventListener('pointerdown', handleFocus);
    window.addEventListener('click', handleFocus);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('pointerdown', handleFocus);
      window.removeEventListener('click', handleFocus);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleAnswer]);

  // Mobile Touch Gestures (Swipe left/right to steer, tap left/mid/right to jump lane)
  const touchStartPos = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameStateRef.current !== 'PLAYING' || isPausedRef.current) return;
    const touch = e.touches[0];
    touchStartPos.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current || gameStateRef.current !== 'PLAYING' || isPausedRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;
    const dt = Date.now() - touchStartPos.current.time;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    const target = e.target as HTMLElement;
    const isInteractiveButton = !!target.closest('button');

    // Horizontal swipe gesture (> 35px, predominantly horizontal)
    if (absX > 35 && absX > absY * 1.2 && dt < 500) {
      if (dx < 0) {
        sceneRef.current?.steerLeft();
      } else {
        sceneRef.current?.steerRight();
      }
    } else if (!isInteractiveButton && absX < 20 && absY < 20 && dt < 350) {
      // Tap on upper 70% of screen to directly choose lane
      if (touch.clientY < window.innerHeight * 0.72) {
        const screenWidth = window.innerWidth;
        if (touch.clientX < screenWidth * 0.33) {
          sceneRef.current?.steerToLane(0);
        } else if (touch.clientX > screenWidth * 0.67) {
          sceneRef.current?.steerToLane(2);
        } else {
          sceneRef.current?.steerToLane(1);
        }
      }
    }
    touchStartPos.current = null;
  };

  const startGame = () => {
    setStats(INITIAL_STATS);
    setHistory([]);
    setCurrentQuestion(null);
    currentQuestionRef.current = null;
    setQuestionTimeLeft(15);
    lastSpawnZRef.current = 0;
    nextQuestionSpawnZRef.current = -50;
    nextQuestionAvailableTimeRef.current = Date.now() + 4000; // 4s opening run before first question
    questionPoolRef.current = [...FORM1_QUESTIONS];
    questionIdxRef.current = 0;

    if (sceneRef.current) {
      sceneRef.current.isTitleScreen = false;
      sceneRef.current.resetCar();
    }

    setGameState('PLAYING');
    gameStateRef.current = 'PLAYING';
    soundManager.startEngine();
  };

  const togglePause = () => {
    setIsPaused((prev) => {
      const next = !prev;
      if (next) {
        pauseStartTimeRef.current = Date.now();
        soundManager.stopEngine();
      } else {
        const pauseDuration = Date.now() - pauseStartTimeRef.current;
        if (questionStartTimeRef.current > 0) {
          questionStartTimeRef.current += pauseDuration;
        }
        if (nextQuestionAvailableTimeRef.current > 0) {
          nextQuestionAvailableTimeRef.current += pauseDuration;
        }
        soundManager.startEngine();
      }
      return next;
    });
  };

  const toggleMute = () => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

  const handleSelectCarColor = (color: CarColor) => {
    setSelectedColor(color);
    sceneRef.current?.setCarColor(color);
  };

  const handleReturnHome = () => {
    setGameState('START');
    gameStateRef.current = 'START';
    if (sceneRef.current) {
      sceneRef.current.isTitleScreen = true;
      sceneRef.current.resetCar();
    }
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-gray-950 font-racing select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D WebGL Canvas Container */}
      <div ref={canvasMountRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* Title / Start Screen */}
      {gameState === 'START' && (
        <StartScreen
          selectedColor={selectedColor}
          onSelectColor={handleSelectCarColor}
          onStartGame={startGame}
          highScore={highScore}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      )}

      {/* Active Racing HUD */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <HUD
          stats={stats}
          currentQuestion={currentQuestion}
          questionTimeLeft={questionTimeLeft}
          feedback={feedback}
          isMuted={isMuted}
          isPaused={isPaused}
          activeLane={activeLane}
          onToggleMute={toggleMute}
          onTogglePause={togglePause}
          onSelectOption={(idx) => {
            sceneRef.current?.steerToLane(idx);
            handleAnswer(idx);
          }}
          onSteerLeft={() => sceneRef.current?.steerLeft()}
          onSteerRight={() => sceneRef.current?.steerRight()}
          onBoostStart={() => {
            sceneRef.current?.setBoosting(true);
            soundManager.playBoost();
          }}
          onBoostEnd={() => sceneRef.current?.setBoosting(false)}
          onBrakeStart={() => sceneRef.current?.setBraking(true)}
          onBrakeEnd={() => sceneRef.current?.setBraking(false)}
        />
      )}

      {/* Pause Screen Overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-25 flex flex-col items-center justify-center bg-gray-950/80 backdrop-blur-xs pointer-events-auto">
          <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
            <h3 className="text-3xl font-black font-racing text-white uppercase tracking-wider mb-2">
              GAME PAUSED
            </h3>
            <p className="text-gray-400 text-xs mb-6">Take a breather, racer!</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={togglePause}
                className="py-3 px-6 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-black font-racing tracking-wide shadow-lg cursor-pointer transition-all"
              >
                RESUME RACE
              </button>
              <button
                onClick={handleReturnHome}
                className="py-3 px-6 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold font-racing cursor-pointer transition-all"
              >
                QUIT TO TITLE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over / Results Modal */}
      {gameState === 'GAMEOVER' && (
        <GameOverModal
          stats={stats}
          history={history}
          highScore={highScore}
          onPlayAgain={startGame}
          onHome={handleReturnHome}
        />
      )}
    </div>
  );
}
