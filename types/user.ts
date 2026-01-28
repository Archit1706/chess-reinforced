// User profile and stats
export interface User {
  id: string;
  username: string;
  displayName?: string;
  createdAt: Date;
  stats: UserStats;
}

export interface UserStats {
  // Estimated skill level
  estimatedElo: number;

  // Game statistics
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDraw: number;
  winRate: number;

  // Puzzle statistics
  puzzlesSolved: number;
  puzzlesFailed: number;
  puzzleSuccessRate: number;
  puzzleStreak: number;
  bestPuzzleStreak: number;

  // Streak tracking
  currentStreak: number;
  longestStreak: number;
  lastActiveAt: Date;
}

// Daily activity for calendar/heatmap
export interface DailyActivity {
  date: Date;
  puzzlesSolved: number;
  lessonsCompleted: number;
  gamesPlayed: number;
  minutesSpent: number;
}

// Progress tracking
export interface UserProgress {
  user: User;
  modules: ModuleProgressSummary[];
  recentActivity: DailyActivity[];
  skillProgression: SkillPoint[];
}

export interface ModuleProgressSummary {
  moduleId: string;
  moduleTitle: string;
  level: string;
  lessonsCompleted: number;
  totalLessons: number;
  percentComplete: number;
}

export interface SkillPoint {
  date: Date;
  elo: number;
  source: 'game' | 'puzzle' | 'initial';
}

// Game history entry
export interface GameHistoryEntry {
  id: string;
  createdAt: Date;
  pgn: string;
  result: string;
  playerColor: 'white' | 'black';
  opponentType: 'computer' | 'puzzle';
  opponentElo?: number;
  timeControl?: string;
  openingName?: string;
  openingEco?: string;
  analyzed: boolean;
}

// Puzzle attempt record
export interface PuzzleAttempt {
  id: string;
  puzzleId: string;
  solved: boolean;
  timeSpent: number;
  hintsUsed: number;
  createdAt: Date;
}
