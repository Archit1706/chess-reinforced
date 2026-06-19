/** Famous game DTOs shared between the API and client. */

export interface FamousGameSummary {
  id: string;
  white: string;
  black: string;
  year: number | null;
  event: string | null;
  result: string;
  eco: string | null;
  themes: string[];
  difficulty: number;
}

export interface FamousGameDetail extends FamousGameSummary {
  pgn: string;
}
