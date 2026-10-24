import React, { useState } from 'react';
import { Play, Trophy, Volume2, VolumeX, Sparkles, BookOpen, Car, Smartphone, Code, Check, X } from 'lucide-react';
import { CAR_COLORS } from '../data/questions';
import { CarColor } from '../types/game';

interface StartScreenProps {
  selectedColor: CarColor;
  onSelectColor: (color: CarColor) => void;
  onStartGame: () => void;
  highScore: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  selectedColor,
  onSelectColor,
  onStartGame,
  highScore,
  isMuted,
  onToggleMute,
}) => {
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const embedCode = `<iframe src="${window.location.origin}" width="100%" height="720" style="border:0; border-radius:16px; overflow:hidden;" allow="accelerometer; autoplay; encrypted-media; gyroscope" allowfullscreen></iframe>`;

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // fallback
      setCopied(true);
    });
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-between p-3 sm:p-6 md:p-8 bg-gradient-to-t from-gray-950/95 via-gray-950/70 to-gray-950/90 pointer-events-auto overflow-y-auto max-h-[100dvh]">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between max-w-5xl gap-2 shrink-0">
        <div className="flex items-center gap-2 bg-gray-900/80 border border-gray-800 px-3 py-1.5 rounded-full shadow-lg">
          <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-[11px] sm:text-xs font-semibold text-gray-300 font-racing truncate">
            MALAYSIA KSSM FORM 1 MATH
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {highScore > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-600/40 px-2.5 sm:px-3 py-1.5 rounded-full text-amber-300 text-[11px] sm:text-xs font-racing font-bold shadow-md">
              <Trophy className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <span>HIGH: {highScore.toLocaleString()}</span>
            </div>
          )}

          <button
            onClick={() => setShowEmbedModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900/80 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-400 transition-all cursor-pointer shadow-md text-xs font-racing font-bold"
            title="Dapatkan kod embed Google Sites"
          >
            <Code className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">EMBED CODE</span>
          </button>

          <button
            onClick={onToggleMute}
            className="p-2 rounded-full bg-gray-900/80 border border-gray-800 text-gray-300 hover:text-white transition-all cursor-pointer shadow-md"
            title={isMuted ? 'Buka Bunyi' : 'Senyapkan Bunyi'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Hero Title Lockup */}
      <div className="flex flex-col items-center text-center my-auto py-4 max-w-2xl shrink-0">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-[11px] sm:text-xs font-bold font-racing uppercase tracking-widest mb-2">
          <Sparkles className="w-3.5 h-3.5" /> 3D Arcade Math Racer
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-racing tracking-tight text-white uppercase drop-shadow-[0_0_35px_rgba(6,182,212,0.6)]">
          MATH <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-amber-300 to-pink-500">DASH</span>
        </h1>
        <div className="text-lg sm:text-2xl font-bold font-racing tracking-widest text-cyan-300 uppercase mt-0.5 mb-2 drop-shadow">
          ULTIMATE RACE
        </div>

        {/* Mobile Ready Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[11px] sm:text-xs font-bold font-racing mb-3">
          <Smartphone className="w-3.5 h-3.5" /> Sesuai Untuk Komputer &amp; Telefon Bimbit
        </div>

        <p className="text-gray-300 text-xs sm:text-sm max-w-lg mb-4 leading-relaxed px-2">
          Pandu di lebuh raya neon Kuala Lumpur! Kumpul syiling emas, elak halangan dan pilih lorong A, B, atau C untuk menyelesaikan 10 soalan matematik Tingkatan 1:
          <span className="block mt-1 font-semibold text-cyan-300">
            Nisbah · Kadar · Kadaran · Anggaran (KSSM)
          </span>
        </p>

        {/* Car Customizer */}
        <div className="flex flex-col items-center gap-2 mb-5 bg-gray-950/80 border border-gray-800/80 p-3 rounded-2xl shadow-xl w-full max-w-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-racing flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-cyan-400" /> PILIH WARNA KERETA LUMBA
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {CAR_COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectColor(c.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                  selectedColor === c.id
                    ? 'border-white bg-white/20 shadow-[0_0_12px_rgba(255,255,255,0.4)] scale-105'
                    : 'border-gray-800 bg-gray-900/60 hover:border-gray-700'
                }`}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full shadow-inner"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-[11px] font-bold font-racing text-gray-200">
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={onStartGame}
          className="group relative inline-flex items-center gap-3 px-8 sm:px-12 py-3.5 sm:py-4 rounded-2xl font-black font-racing text-xl sm:text-2xl tracking-wider text-black bg-gradient-to-r from-cyan-400 via-amber-300 to-pink-400 hover:from-cyan-300 hover:to-pink-300 shadow-[0_0_30px_rgba(6,182,212,0.8)] hover:shadow-[0_0_50px_rgba(245,158,11,0.9)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
        >
          <Play className="w-6 h-6 fill-black transition-transform group-hover:scale-110" />
          MULA BERLUMBA
        </button>

        <span className="text-[11px] font-racing text-gray-400 tracking-wider mt-2.5">
          Sentuh butang di atas, atau tekan <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-white font-mono">SPACE</kbd> / <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-white font-mono">ENTER</kbd>
        </span>
      </div>

      {/* Footer Controls preview */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[11px] sm:text-xs text-gray-400 font-racing bg-gray-950/60 border border-gray-900 px-3.5 py-2 rounded-xl shrink-0">
        <span>📱 <strong className="text-gray-200">Telefon:</strong> Butang stereng ibu jari atau leret (swipe) skrin</span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline">🎮 <strong className="text-gray-200">Laptop:</strong> ← / → atau A / D</span>
        <span className="hidden sm:inline">·</span>
        <span>⚡ <strong className="text-gray-200">Boost / Brek</strong> disediakan</span>
      </div>

      {/* Google Sites Embed Code Modal */}
      {showEmbedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/90 backdrop-blur-xs">
          <div className="bg-gray-900 border border-cyan-500/40 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setShowEmbedModal(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg bg-gray-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-cyan-400 mb-2">
              <Code className="w-5 h-5" />
              <h3 className="font-racing font-bold text-lg text-white">
                KOD EMBED GOOGLE SITES
              </h3>
            </div>

            <p className="text-xs text-gray-300 mb-3 leading-relaxed">
              Untuk memasukkan game ini ke dalam <strong>Google Sites</strong>:
              <br />
              1. Buka Google Sites &gt; Pilih <strong>Insert (Sisipkan)</strong> &gt; <strong>Embed (Benamkan)</strong>.
              <br />
              2. Pilih tab <strong>Embed code (Kod benam)</strong> dan tampal (paste) kod di bawah:
            </p>

            <div className="relative bg-gray-950 border border-gray-800 p-3 rounded-xl font-mono text-[11px] text-cyan-300 break-all select-all mb-4">
              {embedCode}
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-gray-400">
                Responsif pada laptop, tablet dan telefon bimbit.
              </span>
              <button
                onClick={copyEmbedCode}
                className="py-2.5 px-5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-black font-racing text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-black" />
                    DISALIN!
                  </>
                ) : (
                  'SALIN KOD'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
