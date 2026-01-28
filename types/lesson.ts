import type { BoardArrow, BoardHighlight } from './chess';

// Learning levels
export type LessonLevel = 'beginner' | 'intermediate' | 'advanced';

// Module (collection of lessons)
export interface Module {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: LessonLevel;
  order: number;
  icon?: string;
  lessons: Lesson[];
  progress?: ModuleProgress;
}

export interface ModuleProgress {
  lessonsCompleted: number;
  totalLessons: number;
  percentComplete: number;
}

// Individual lesson
export interface Lesson {
  id: string;
  slug: string;
  moduleId: string;
  title: string;
  description: string;
  content: string; // Markdown content
  order: number;
  difficulty: number; // 1-5
  estimatedMinutes: number;
  positions: LessonPosition[];
  puzzles: LessonPuzzle[];
  progress?: LessonProgressData;
}

export interface LessonProgressData {
  started: boolean;
  completed: boolean;
  completedAt?: Date;
  positionsViewed: string[];
  puzzlesSolved: string[];
}

// Position demonstration in lessons
export interface LessonPosition {
  id: string;
  fen: string;
  description?: string;
  arrows?: BoardArrow[];
  highlights?: BoardHighlight[];
  order: number;
}

// Puzzle in lessons
export interface LessonPuzzle {
  id: string;
  fen: string;
  moves: string[]; // Correct move sequence
  themes: string[];
  rating: number;
  hint?: string;
}

// Puzzle themes for categorization
export type PuzzleTheme =
  | 'fork'
  | 'pin'
  | 'skewer'
  | 'discoveredAttack'
  | 'doubleCheck'
  | 'deflection'
  | 'decoy'
  | 'sacrifice'
  | 'clearance'
  | 'interference'
  | 'xRay'
  | 'zwischenzug'
  | 'quietMove'
  | 'backRankMate'
  | 'ladderMate'
  | 'smotheredMate'
  | 'anastasiasMate'
  | 'arabianMate'
  | 'bodensMate'
  | 'mateIn1'
  | 'mateIn2'
  | 'mateIn3'
  | 'endgame'
  | 'opening'
  | 'middlegame'
  | 'defensiveMove'
  | 'attackingMove'
  | 'promotion'
  | 'underPromotion'
  | 'enPassant'
  | 'castling'
  | 'trapped'
  | 'hangingPiece';

// Lesson content block types for rich content
export interface LessonContentBlock {
  type: 'text' | 'diagram' | 'puzzle' | 'tip' | 'warning' | 'exercise';
  content: string;
  position?: LessonPosition;
  puzzle?: LessonPuzzle;
}
