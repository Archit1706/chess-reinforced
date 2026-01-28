import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and tailwind-merge
 * This allows for conditional classes and proper Tailwind class merging
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format seconds to MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate ELO change after a game
 * K-factor determines how much ratings change
 */
export function calculateEloChange(
  playerElo: number,
  opponentElo: number,
  result: number, // 1 = win, 0.5 = draw, 0 = loss
  kFactor: number = 32
): number {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  return Math.round(kFactor * (result - expectedScore));
}

/**
 * Get difficulty label from rating
 */
export function getDifficultyLabel(rating: number): string {
  if (rating < 1000) return 'Easy';
  if (rating < 1400) return 'Medium';
  if (rating < 1800) return 'Hard';
  if (rating < 2200) return 'Expert';
  return 'Master';
}

/**
 * Get color class for difficulty
 */
export function getDifficultyColor(rating: number): string {
  if (rating < 1000) return 'text-green-500';
  if (rating < 1400) return 'text-yellow-500';
  if (rating < 1800) return 'text-orange-500';
  if (rating < 2200) return 'text-red-500';
  return 'text-purple-500';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Check if we're running on the client
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
