import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, CheckCircle2, XCircle, Award, BookOpen, ChevronRight, Home } from 'lucide-react';
import { GameStats, AnsweredQuestion } from '../types/game';

interface GameOverModalProps {
  stats: GameStats;
  history: AnsweredQuestion[];
  highScore: number;
  onPlayAgain: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  history,
  highScore,
  onPlayAgain,
  onHome,
}) => {
  const isCompleted = stats.questionsAnswered >= 10;
  const isNewHighScore = stats.score > 0 && stats.score >= highScore;
  const isTimeOut = stats.timeLeft <= 0;
  const accuracy =
    stats.questionsAnswered > 0
      ? Math.round((stats.correctAnswersCount / stats.questionsAnswered) * 100)
      : 0;

  useEffect(() => {
    if (isCompleted || stats.score > 300 || isNewHighScore) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#f59e0b', '#ec4899', '#10b981'],
      });
    }
  }, [isCompleted, stats.score, isNewHighScore]);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-gray-950/85 backdrop-blur-xs overflow-y-auto pointer-events-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl my-auto flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-bold font-racing uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5" /> KEPUTUSAN MATH DASH TINGKATAN 1
          </div>

          <h2 className="text-3xl md:text-5xl font-black font-racing uppercase tracking-tight text-white">
            {isCompleted ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                TAHNIAH! SEMUA 12 SOALAN SELESAI
              </span>
            ) : isTimeOut ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200">
                MASA PERLUMBAAN TAMAT
              </span>
            ) : (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500">
                PERLUMBAAN TAMAT! NYAWA HABIS
              </span>
            )}
          </h2>

          <p className="text-gray-400 text-sm mt-1">
            {isCompleted
              ? 'Syabas, pelumba cemerlang! Anda berjaya menjawab kesemua 10 soalan matematik.'
              : isTimeOut
              ? 'Masa perlumbaan telah habis. Semak jalan kerja soalan anda di bawah!'
              : 'Anda telah kehabisan 5 nyawa. Ulang kaji penerangan di bawah dan cuba lagi!'}
          </p>
        </div>

        {/* Score & Stats Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gray-950/80 border border-gray-800 p-3.5 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-racing block">
              FINAL SCORE
            </span>
            <span className="text-2xl font-black text-white font-racing tabular-nums">
              {stats.score.toLocaleString()}
            </span>
            {isNewHighScore && (
              <span className="text-[10px] text-amber-400 font-bold font-racing block mt-0.5">
                ★ NEW HIGH!
              </span>
            )}
          </div>

          <div className="bg-gray-950/80 border border-gray-800 p-3.5 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-racing block">
              MATH ACCURACY
            </span>
            <span className="text-2xl font-black text-cyan-400 font-racing tabular-nums">
              {accuracy}%
            </span>
            <span className="text-[10px] text-gray-400 font-racing block mt-0.5">
              {stats.correctAnswersCount}/{stats.questionsAnswered} Correct
            </span>
          </div>

          <div className="bg-gray-950/80 border border-gray-800 p-3.5 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider font-racing block">
              COINS COLLECTED
            </span>
            <span className="text-2xl font-black text-amber-300 font-racing tabular-nums">
              🪙 {stats.coins}
            </span>
            <span className="text-[10px] text-gray-400 font-racing block mt-0.5">
              +{stats.coins * 20} pts
            </span>
          </div>

          <div className="bg-gray-950/80 border border-gray-800 p-3.5 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-racing block">
              DISTANCE
            </span>
            <span className="text-2xl font-black text-white font-racing tabular-nums">
              {Math.floor(stats.distance)} m
            </span>
            <span className="text-[10px] text-gray-400 font-racing block mt-0.5">
              High Combo: {stats.highestCombo}x
            </span>
          </div>
        </div>

        {/* Educational Question Review Section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 font-racing flex items-center gap-1.5">
              <Award className="w-4 h-4 text-cyan-400" /> MATH QUESTIONS REVISION ({history.length})
            </h3>
            <span className="text-xs text-gray-500 font-racing">Form 1 Syllabus</span>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1.5 border border-gray-800 rounded-2xl p-2.5 bg-gray-950/60">
            {history.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-xs">
                No questions encountered this round. Drive further next time!
              </div>
            ) : (
              history.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    item.isCorrect
                      ? 'bg-emerald-950/30 border-emerald-800/40'
                      : 'bg-red-950/30 border-red-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {item.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span className="text-xs font-bold text-gray-200">
                        Q{idx + 1}: {item.question.question}
                      </span>
                    </div>
                    <span className="text-[10px] font-racing uppercase px-2 py-0.5 rounded bg-gray-800 text-gray-300 shrink-0">
                      {item.question.topic}
                    </span>
                  </div>

                  {/* Answers recap */}
                  <div className="mt-2 text-xs flex flex-wrap gap-x-4 gap-y-1 text-gray-300">
                    <div>
                      Jawapan Anda:{' '}
                      <strong className={item.isCorrect ? 'text-emerald-400' : 'text-red-400'}>
                        {item.selectedOptionIndex >= 0
                          ? `${['A', 'B', 'C'][item.selectedOptionIndex]} (${item.question.options[item.selectedOptionIndex]})`
                          : 'Masa Tamat (10 saat)'}
                      </strong>
                    </div>
                    {!item.isCorrect && (
                      <div>
                        Jawapan Betul:{' '}
                        <strong className="text-emerald-400">
                          {['A', 'B', 'C'][item.question.correctIndex]} ({item.question.options[item.question.correctIndex]})
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* Step by step explanation */}
                  <p className="mt-1.5 text-[11px] text-gray-400 bg-gray-900/80 p-2 rounded-lg leading-relaxed">
                    💡 <strong className="text-gray-300">Explanation:</strong> {item.question.explanation}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onHome}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold font-racing flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" /> TITLE SCREEN
          </button>

          <button
            onClick={onPlayAgain}
            className="flex-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-amber-300 to-pink-400 hover:from-cyan-300 hover:to-pink-300 text-black font-black font-racing text-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.6)] hover:scale-102 transition-all cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 fill-black" /> PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
};
