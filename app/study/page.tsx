'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, ChevronRight, Crown } from 'lucide-react';
import { fetchFamousGames } from '@/lib/famous-games/client';
import { formatTheme } from '@/lib/puzzles/lichess';
import type { FamousGameSummary } from '@/lib/famous-games/types';

function resultLabel(result: string): string {
  if (result === '1-0') return 'White won';
  if (result === '0-1') return 'Black won';
  if (result === '1/2-1/2') return 'Draw';
  return result;
}

export default function StudyPage() {
  const [games, setGames] = useState<FamousGameSummary[] | null>(null);

  useEffect(() => {
    let active = true;
    fetchFamousGames().then((rows) => {
      if (active) setGames(rows);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Trophy className="h-7 w-7 text-yellow-500" />
          Study Famous Games
        </h1>
        <p className="text-muted-foreground">
          Replay legendary games move by move and learn from the masters
        </p>
      </div>

      {games === null ? (
        <div className="py-24 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-3">Loading games…</span>
        </div>
      ) : games.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground">
          No famous games available yet. Seed the database to add some.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Link key={game.id} href={`/study/${game.id}`}>
              <Card className="card-hover h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="h-12 w-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <Crown className="h-6 w-6 text-primary-600" />
                    </div>
                    <Badge variant="outline">Difficulty {game.difficulty}/5</Badge>
                  </div>
                  <CardTitle className="text-lg mt-4">
                    {game.white} vs {game.black}
                  </CardTitle>
                  <CardDescription>
                    {[game.event, game.year].filter(Boolean).join(' · ') || 'Classic game'} ·{' '}
                    {resultLabel(game.result)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {game.themes.slice(0, 3).map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">
                        {formatTheme(t)}
                      </Badge>
                    ))}
                    {game.eco && (
                      <Badge variant="outline" className="text-xs font-mono">
                        {game.eco}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-primary-600 font-medium">
                    Replay game
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
