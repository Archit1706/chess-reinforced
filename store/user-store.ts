import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserStats, DailyActivity } from '@/types/user';

/**
 * User state store for tracking progress, stats, and streaks
 */

interface UserState {
  // User data
  user: User | null;
  isLoading: boolean;

  // Current session
  sessionStartTime: Date | null;
  puzzlesSolvedToday: number;
  lessonsCompletedToday: number;
  gamesPlayedToday: number;

  // Puzzle Rush best score per mode (localStorage; merged with server best).
  puzzleRushBest: Record<string, number>;
}

interface UserActions {
  // User management
  setUser: (user: User | null) => void;
  updateStats: (stats: Partial<UserStats>) => void;

  // Session tracking
  startSession: () => void;
  endSession: () => void;

  // Activity tracking
  recordPuzzleSolved: (success: boolean) => void;
  recordLessonCompleted: () => void;
  recordGamePlayed: (result: 'win' | 'loss' | 'draw') => void;

  // Puzzle Rush: record a finished run; returns the new local best for the mode.
  recordPuzzleRushScore: (mode: string, score: number) => number;

  // Streak management
  updateStreak: () => void;

  // Utility
  fetchUser: () => Promise<void>;
  saveProgress: () => Promise<void>;
}

const defaultStats: UserStats = {
  estimatedElo: 800,
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  gamesDraw: 0,
  winRate: 0,
  puzzlesSolved: 0,
  puzzlesFailed: 0,
  puzzleSuccessRate: 0,
  puzzleStreak: 0,
  bestPuzzleStreak: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveAt: new Date(),
};

// Create a default guest user
const createGuestUser = (): User => ({
  id: 'guest',
  username: 'guest',
  displayName: 'Guest',
  createdAt: new Date(),
  stats: { ...defaultStats },
});

export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      sessionStartTime: null,
      puzzlesSolvedToday: 0,
      lessonsCompletedToday: 0,
      gamesPlayedToday: 0,
      puzzleRushBest: {},

      setUser: (user) => set({ user }),

      updateStats: (newStats) => {
        const { user } = get();
        if (!user) return;

        const updatedStats = { ...user.stats, ...newStats };

        // Recalculate derived stats
        if (updatedStats.gamesPlayed > 0) {
          updatedStats.winRate = Math.round(
            (updatedStats.gamesWon / updatedStats.gamesPlayed) * 100
          );
        }

        const totalPuzzles = updatedStats.puzzlesSolved + updatedStats.puzzlesFailed;
        if (totalPuzzles > 0) {
          updatedStats.puzzleSuccessRate = Math.round(
            (updatedStats.puzzlesSolved / totalPuzzles) * 100
          );
        }

        set({
          user: { ...user, stats: updatedStats },
        });
      },

      startSession: () => {
        set({ sessionStartTime: new Date() });

        // Initialize guest user if none exists
        if (!get().user) {
          set({ user: createGuestUser() });
        }

        // Check if it's a new day and reset daily counters
        const lastActive = get().user?.stats.lastActiveAt;
        const today = new Date();
        const isNewDay =
          !lastActive ||
          new Date(lastActive).toDateString() !== today.toDateString();

        if (isNewDay) {
          set({
            puzzlesSolvedToday: 0,
            lessonsCompletedToday: 0,
            gamesPlayedToday: 0,
          });
        }
      },

      endSession: () => {
        const { sessionStartTime } = get();
        if (sessionStartTime) {
          // Calculate session duration
          const duration = Math.floor(
            (new Date().getTime() - sessionStartTime.getTime()) / 1000 / 60
          );
          // Could save this to the database
          console.log(`Session ended. Duration: ${duration} minutes`);
        }
        set({ sessionStartTime: null });
      },

      recordPuzzleSolved: (success) => {
        const { user } = get();
        if (!user) return;

        const stats = { ...user.stats };

        if (success) {
          stats.puzzlesSolved += 1;
          stats.puzzleStreak += 1;
          if (stats.puzzleStreak > stats.bestPuzzleStreak) {
            stats.bestPuzzleStreak = stats.puzzleStreak;
          }
          set((state) => ({ puzzlesSolvedToday: state.puzzlesSolvedToday + 1 }));
        } else {
          stats.puzzlesFailed += 1;
          stats.puzzleStreak = 0;
        }

        get().updateStats(stats);
        get().updateStreak();
        void get().saveProgress();
      },

      recordLessonCompleted: () => {
        set((state) => ({
          lessonsCompletedToday: state.lessonsCompletedToday + 1,
        }));
        get().updateStreak();
        void get().saveProgress();
      },

      recordGamePlayed: (result) => {
        const { user } = get();
        if (!user) return;

        const stats = { ...user.stats };
        stats.gamesPlayed += 1;

        switch (result) {
          case 'win':
            stats.gamesWon += 1;
            // Increase ELO on win (simplified)
            stats.estimatedElo = Math.min(3000, stats.estimatedElo + 10);
            break;
          case 'loss':
            stats.gamesLost += 1;
            // Decrease ELO on loss (simplified)
            stats.estimatedElo = Math.max(100, stats.estimatedElo - 10);
            break;
          case 'draw':
            stats.gamesDraw += 1;
            break;
        }

        set((state) => ({ gamesPlayedToday: state.gamesPlayedToday + 1 }));
        get().updateStats(stats);
        get().updateStreak();
        void get().saveProgress();
      },

      recordPuzzleRushScore: (mode, score) => {
        const current = get().puzzleRushBest[mode] ?? 0;
        const best = Math.max(current, score);
        if (best !== current) {
          set((state) => ({ puzzleRushBest: { ...state.puzzleRushBest, [mode]: best } }));
        }
        return best;
      },

      updateStreak: () => {
        const { user } = get();
        if (!user) return;

        const lastActive = new Date(user.stats.lastActiveAt);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let newStreak = user.stats.currentStreak;

        // Check if last activity was yesterday (continue streak) or before (reset)
        if (lastActive.toDateString() === yesterday.toDateString()) {
          // Continuing streak
          newStreak += 1;
        } else if (lastActive.toDateString() !== today.toDateString()) {
          // Streak broken (last activity was before yesterday)
          newStreak = 1;
        }

        const newLongestStreak = Math.max(newStreak, user.stats.longestStreak);

        get().updateStats({
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          lastActiveAt: today,
        });
      },

      fetchUser: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/user');
          if (response.ok) {
            const user = await response.json();
            set({ user });
          } else {
            // Use guest user if not authenticated
            set({ user: createGuestUser() });
          }
        } catch (error) {
          console.error('Failed to fetch user:', error);
          set({ user: createGuestUser() });
        } finally {
          set({ isLoading: false });
        }
      },

      saveProgress: async () => {
        const { user } = get();
        if (!user || user.id === 'guest') return;

        try {
          await fetch('/api/user/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user.stats),
          });
        } catch (error) {
          console.error('Failed to save progress:', error);
        }
      },
    }),
    {
      name: 'chess-user-storage',
      partialize: (state) => ({
        user: state.user,
        puzzlesSolvedToday: state.puzzlesSolvedToday,
        lessonsCompletedToday: state.lessonsCompletedToday,
        gamesPlayedToday: state.gamesPlayedToday,
        puzzleRushBest: state.puzzleRushBest,
      }),
    }
  )
);
