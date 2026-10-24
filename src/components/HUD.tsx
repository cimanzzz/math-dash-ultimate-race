import React from 'react';
import { Heart, Volume2, VolumeX, Pause, Play, Zap, Flame, Award, Navigation, Timer, ShieldAlert } from 'lucide-react';
import { MathQuestion, GameStats } from '../types/game';

interface HUDProps {
  stats: GameStats;
  currentQuestion: MathQuestion | null;
  questionTimeLeft: number;
  feedback: { message: string; type: 'correct' | 'wrong' | 'hit'; id: number } | null;
  isMuted: boolean;
  isPaused: boolean;
  activeLane: number;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onSelectOption: (optionIndex: number) => void;
  onSteerLeft: () => void;
  onSteerRight: () => void;
  onBoostStart: () => void;
  onBoostEnd: () => void;
  onBrakeStart?: () => void;
  onBrakeEnd?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  currentQuestion,
  questionTimeLeft,
  feedback,
  isMuted,
  isPaused,
  activeLane,
  onToggleMute,
  onTogglePause,
  onSelectOption,
  onSteerLeft,
  onSteerRight,
  onBoostStart,
  onBoostEnd,
  onBrakeStart,
  onBrakeEnd,
}) => {
  const isUrgent = stats.timeLeft <= 10;
  const isQuestionUrgent = questionTimeLeft <= 3.0;

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-2 sm:p-4 md:p-6 overflow-hidden">
      {/* --- TOP STATUS CLUSTER --- */}
      <div className="w-full flex flex-col gap-2 pointer-events-auto">
        {/* Row 1: Lives, Score, Combo & Timers, Controls */}
        <div className="flex items-center justify-between gap-2 w-full">
          {/* Left: NYAWA & MARKAH */}
          <div className="flex items-center gap-2">
            {/* Lives badge */}
            <div className="flex items-center gap-1.5 bg-gray-950/85 backdrop-blur-xs border border-gray-800 px-2.5 py-1.5 rounded-xl shadow-lg">
              <span className="text-[10px] md:text-xs uppercase font-bold text-gray-400 font-racing tracking-wider mr-0.5">
                NYAWA
              </span>
              {/* Mobile compact number view */}
              <div className="flex md:hidden items-center gap-1 font-racing font-black text-sm">
                <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
                <span className="text-white">{stats.lives}</span>
                <span className="text-gray-500 text-xs">/{stats.maxLives}</span>
              </div>
              {/* Desktop 5 hearts view */}
              <div className="hidden md:flex items-center gap-1">
                {Array.from({ length: stats.maxLives }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-4 h-4 transition-all duration-300 ${
                      i < stats.lives
                        ? 'text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                        : 'text-gray-600 fill-gray-800/40 opacity-40 scale-90'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Score Badge */}
            <div className="bg-gray-950/85 backdrop-blur-xs border border-gray-800 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5">
              <span className="text-[9px] md:text-[10px] uppercase font-bold text-cyan-400 font-racing tracking-wider hidden sm:inline">
                SCORE
              </span>
              <span className="text-base md:text-xl font-black text-white tabular-nums font-racing">
                {stats.score.toLocaleString()}
              </span>
            </div>

            {/* Combo Streak */}
            {stats.comboStreak > 1 && (
              <div className="bg-gradient-to-r from-amber-600 to-yellow-500 border border-yellow-300 px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1 animate-bounce">
                <Flame className="w-3.5 h-3.5 text-white fill-white" />
                <span className="text-[11px] md:text-xs font-black text-white font-racing">
                  {stats.comboStreak}X
                </span>
              </div>
            )}
          </div>

          {/* Right: Race Time Left, Sound & Pause Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Total Race Time Left */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-lg font-racing transition-all ${
                isUrgent
                  ? 'bg-red-950/90 border-red-500 text-red-300 animate-pulse box-neon-red'
                  : 'bg-gray-950/85 backdrop-blur-xs border-gray-800 text-white'
              }`}
            >
              <Timer className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm md:text-lg font-black tabular-nums">
                {stats.timeLeft}s
              </span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="p-2 md:p-2.5 rounded-xl bg-gray-950/85 border border-gray-800 text-gray-300 hover:text-white active:scale-95 transition-all cursor-pointer shadow-md"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Pause Toggle */}
            <button
              onClick={onTogglePause}
              title={isPaused ? 'Resume Race' : 'Pause Race'}
              className="p-2 md:p-2.5 rounded-xl bg-gray-950/85 border border-gray-800 text-gray-300 hover:text-white active:scale-95 transition-all cursor-pointer shadow-md"
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Row 2: Active Math Question Banner (Full Width, Centered, Highly Responsive) */}
        {currentQuestion && (
          <div className="w-full flex justify-center mt-0.5 sm:mt-1 transition-all animate-in fade-in slide-in-from-top-2 duration-300">
            <div
              className={`w-full max-w-xl bg-gray-950/95 backdrop-blur-md border rounded-2xl shadow-2xl p-2.5 sm:p-3.5 text-center transition-all ${
                isQuestionUrgent
                  ? 'border-red-500/80 shadow-[0_0_25px_rgba(239,68,68,0.5)]'
                  : 'border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
              }`}
            >
              {/* Question Header: Topic & 10s Timer */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full font-racing truncate max-w-[200px] sm:max-w-none">
                  {currentQuestion.topicMalay}
                </span>

                {/* 10-Second Question Timer */}
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-racing text-[11px] sm:text-xs font-bold tabular-nums shrink-0 transition-all ${
                    isQuestionUrgent
                      ? 'bg-red-500/30 text-red-300 border border-red-500/70 animate-pulse'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  <Timer className="w-3 h-3" />
                  <span>MASA: {Math.max(0, questionTimeLeft).toFixed(1)}s</span>
                </div>
              </div>

              {/* 10-Second Countdown Progress Bar */}
              <div className="w-full bg-gray-800/80 h-1.5 rounded-full mb-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 rounded-full ${
                    questionTimeLeft > 5
                      ? 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                      : questionTimeLeft > 2.5
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-400'
                      : 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, (questionTimeLeft / 10) * 100))}%` }}
                />
              </div>

              {/* Question Text */}
              <p className="text-white font-semibold text-xs sm:text-sm md:text-base leading-snug drop-shadow-md mb-2 px-1">
                {currentQuestion.question}
              </p>

              {/* 3 Lane Option Choices (A, B, C) */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 w-full">
                {currentQuestion.options.map((opt, idx) => {
                  const laneLabels = ['A', 'B', 'C'];
                  const laneNames = ['LANE 1', 'LANE 2', 'LANE 3'];
                  const isCurrentCarLane = activeLane === idx;
                  const borderColors = [
                    'border-cyan-500/70 hover:border-cyan-400',
                    'border-amber-500/70 hover:border-amber-400',
                    'border-emerald-500/70 hover:border-emerald-400',
                  ];
                  const badgeColors = [
                    'bg-cyan-500 text-black',
                    'bg-amber-500 text-black',
                    'bg-emerald-500 text-black',
                  ];

                  return (
                    <button
                      key={idx}
                      onClick={() => onSelectOption(idx)}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                      }}
                      className={`relative flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border transition-all duration-200 cursor-pointer min-h-[48px] sm:min-h-[54px] active:scale-95 ${
                        borderColors[idx]
                      } ${
                        isCurrentCarLane
                          ? 'bg-white/20 scale-102 shadow-[0_0_15px_rgba(56,189,248,0.5)] ring-2 ring-white/60'
                          : 'bg-gray-900/85 hover:bg-gray-800/90'
                      }`}
                    >
                      {/* Active car position indicator */}
                      {isCurrentCarLane && (
                        <div className="absolute -top-2.5 bg-yellow-400 text-gray-950 font-black text-[8px] sm:text-[9px] px-2 py-0.2 rounded-full font-racing flex items-center gap-1 shadow-md">
                          <Navigation className="w-2.5 h-2.5 fill-current" /> YOU
                        </div>
                      )}

                      <div className="flex items-center gap-1 mb-0.5">
                        <span className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.2 rounded ${badgeColors[idx]}`}>
                          {laneLabels[idx]}
                        </span>
                        <span className="text-[9px] text-gray-400 font-racing hidden sm:inline">
                          {laneNames[idx]}
                        </span>
                      </div>

                      <span className="text-white font-bold text-xs sm:text-sm font-racing tracking-wide text-center line-clamp-2">
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- FLOATING TOAST FEEDBACK --- */}
      {feedback && (
        <div className="self-center my-auto pointer-events-none transition-all duration-300 transform scale-105 sm:scale-110 z-20">
          <div
            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl font-black font-racing text-base sm:text-xl border shadow-2xl tracking-wider uppercase text-center flex items-center gap-2 ${
              feedback.type === 'correct'
                ? 'bg-emerald-950/95 border-emerald-400 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.7)]'
                : feedback.type === 'hit'
                ? 'bg-amber-950/95 border-amber-500 text-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.7)]'
                : 'bg-red-950/95 border-red-500 text-red-300 shadow-[0_0_30px_rgba(239,68,68,0.7)]'
            }`}
          >
            {feedback.type === 'correct' ? (
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 shrink-0" />
            ) : feedback.type === 'hit' ? (
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 shrink-0" />
            ) : (
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      {/* --- BOTTOM CLUSTER: CONTROLS & TELEMETRY --- */}
      <div className="w-full flex flex-col gap-2 pointer-events-auto">
        {/* Mobile Telemetry Quick Pill (compact bar on mobile above thumb controls) */}
        <div className="flex md:hidden items-center justify-between bg-gray-950/85 backdrop-blur-xs border border-gray-800/80 px-3 py-1 rounded-xl text-xs font-racing text-gray-300 shadow-md">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400 font-bold">JARAK:</span>
            <span className="font-bold text-white tabular-nums">{Math.floor(stats.distance)}m</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-amber-400 font-bold">SYILING:</span>
            <span className="font-bold text-amber-300 tabular-nums">🪙 {stats.coins}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-cyan-400 font-bold">KELAJUAN:</span>
            <span className="font-bold text-cyan-300 tabular-nums">{Math.round(stats.speedKmH)} KM/J</span>
          </div>
        </div>

        {/* Dual Ergonomic Mobile Thumb Controls Row (Mobile Only) */}
        <div className="flex md:hidden items-center justify-between w-full gap-2">
          {/* Left Thumb: Steering D-Pad (Left / Right) */}
          <div className="flex items-center gap-2">
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                onSteerLeft();
              }}
              onClick={onSteerLeft}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-cyan-950/85 active:bg-cyan-500 border-2 border-cyan-500/60 active:border-white active:scale-95 text-cyan-300 active:text-black flex flex-col items-center justify-center font-black text-2xl shadow-xl transition-all select-none cursor-pointer"
            >
              <span className="text-2xl leading-none">◀</span>
              <span className="text-[9px] font-racing font-bold tracking-tight">KIRI</span>
            </button>

            <button
              onTouchStart={(e) => {
                e.preventDefault();
                onSteerRight();
              }}
              onClick={onSteerRight}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-cyan-950/85 active:bg-cyan-500 border-2 border-cyan-500/60 active:border-white active:scale-95 text-cyan-300 active:text-black flex flex-col items-center justify-center font-black text-2xl shadow-xl transition-all select-none cursor-pointer"
            >
              <span className="text-2xl leading-none">▶</span>
              <span className="text-[9px] font-racing font-bold tracking-tight">KANAN</span>
            </button>
          </div>

          {/* Right Thumb: Turbo Boost & Brake */}
          <div className="flex items-center gap-2">
            {onBrakeStart && onBrakeEnd && (
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  onBrakeStart();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  onBrakeEnd();
                }}
                onMouseDown={onBrakeStart}
                onMouseUp={onBrakeEnd}
                onMouseLeave={onBrakeEnd}
                className="w-14 h-16 sm:w-16 sm:h-20 rounded-2xl bg-gray-900/85 active:bg-red-600 border border-gray-700 active:border-red-400 active:scale-95 text-gray-300 active:text-white flex flex-col items-center justify-center font-black text-xs font-racing shadow-xl transition-all select-none cursor-pointer"
              >
                <span className="text-lg leading-none">🛑</span>
                <span className="text-[9px] tracking-tight">BREK</span>
              </button>
            )}

            <button
              onTouchStart={(e) => {
                e.preventDefault();
                onBoostStart();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                onBoostEnd();
              }}
              onMouseDown={onBoostStart}
              onMouseUp={onBoostEnd}
              onMouseLeave={onBoostEnd}
              className="w-20 h-16 sm:w-24 sm:h-20 rounded-2xl bg-gradient-to-t from-amber-600 to-yellow-500 active:from-yellow-400 active:to-yellow-300 active:scale-95 text-white active:text-black flex flex-col items-center justify-center font-black text-xs font-racing shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-yellow-300/60 transition-all select-none cursor-pointer"
            >
              <Zap className="w-6 h-6 fill-current animate-pulse" />
              <span className="text-[10px] tracking-wider">BOOST</span>
            </button>
          </div>
        </div>

        {/* Desktop Telemetry & Controls Row (Desktop Only) */}
        <div className="hidden md:flex items-end justify-between w-full">
          {/* Left: Distance & Coins */}
          <div className="flex flex-col gap-2 pointer-events-auto">
            <div className="flex items-center gap-3 bg-gray-950/80 border border-gray-800/80 px-3.5 py-2 rounded-xl shadow-lg">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block font-racing">
                  DISTANCE
                </span>
                <span className="text-base md:text-lg font-black text-white tabular-nums font-racing">
                  {Math.floor(stats.distance)} m
                </span>
              </div>
              <div className="h-6 w-[1px] bg-gray-800" />
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block font-racing">
                  COINS
                </span>
                <span className="text-base md:text-lg font-black text-amber-300 tabular-nums font-racing">
                  🪙 {stats.coins}
                </span>
              </div>
            </div>

            {/* Desktop Controls hint */}
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-950/60 px-3 py-1 rounded-lg border border-gray-800/50">
              <span>Steer: <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-white font-mono">←</kbd> <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-white font-mono">→</kbd> or <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-white font-mono">A</kbd> <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-white font-mono">D</kbd></span>
              <span>·</span>
              <span>Boost: <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-white font-mono">↑</kbd> or <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-white font-mono">W</kbd></span>
              <span>·</span>
              <span>Brake: <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-white font-mono">↓</kbd> or <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-white font-mono">S</kbd></span>
              <span>·</span>
              <span>Select: <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-white font-mono">1</kbd> <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-white font-mono">2</kbd> <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-white font-mono">3</kbd></span>
            </div>
          </div>

          {/* Right: Digital Speedometer */}
          <div className="flex flex-col items-end pointer-events-auto">
            <div className="bg-gray-950/80 border border-gray-800/80 px-4 py-2 rounded-xl shadow-lg text-right">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block font-racing">
                SPEED
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl md:text-3xl font-black text-cyan-400 tabular-nums font-racing">
                  {Math.round(stats.speedKmH)}
                </span>
                <span className="text-xs font-bold text-gray-400 font-racing">KM/H</span>
              </div>
              {/* Speed bar */}
              <div className="w-24 md:w-32 h-1.5 bg-gray-800 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-yellow-400 to-red-500 transition-all duration-150"
                  style={{ width: `${Math.min((stats.speedKmH / 160) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
