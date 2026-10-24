export type MathTopic = 'Ratios' | 'Rates' | 'Proportions' | 'Estimation';

export interface MathQuestion {
  id: string;
  topic: string;
  topicMalay: string;
  question: string;
  options: string[]; // Options [A, B, C, D]
  correctIndex: number; // 0, 1, 2, or 3
  difficulty: 1 | 2 | 3;
  explanation: string;
}

export interface AnsweredQuestion {
  question: MathQuestion;
  selectedOptionIndex: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export type CarColor = 'cyan' | 'red' | 'lime' | 'gold' | 'purple';

export interface CarColorConfig {
  id: CarColor;
  name: string;
  hex: string;
  threeColor: number;
  glowHex: string;
}

export type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export interface GameStats {
  score: number;
  coins: number;
  lives: number;
  maxLives: number;
  timeLeft: number;
  distance: number; // in meters
  speedKmH: number;
  comboStreak: number;
  highestCombo: number;
  questionsAnswered: number;
  correctAnswersCount: number;
  speedLevel: number;
}
