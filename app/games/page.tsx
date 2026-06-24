'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bot, Loader2, Swords, Trash2, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fetchGames, deleteGame } from '@/lib/games/client';
import type { GameOutcome, GameSummaryDTO } from '@/lib/games/types';

const OUTCOME_STYLES: Record<GameOutcome, string> = {
  win: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30',
  loss: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
  draw: 'bg-muted text-muted-foreground border-border',
  unknown: 'bg-muted text-muted-foreground border-border',
};

const OUTCOME_LABEL: Record<GameOutcome, string> = {
  win: 'Win',
  loss: 'Loss',
  draw: 'Draw',
  unknown: 'Unfinished',
};

export default function GamesPage() {
  const [games, setGames] = useState<GameSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchGames()
      .then(setGames)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const ok = await deleteGame(id);
    if (ok) setGames((prev) => prev.filter((g) => g.id !== id));
    setDeletingId(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Swords className="h-7 w-7 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold">My Games</h1>
          <p className="text-sm text-muted-foreground">
            Your games against the computer — replay and review any of them.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : games.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <p className="text-muted-foreground">
              You haven&apos;t saved any games yet.
            </p>
            <Button asChild>
              <Link href="/play">Play a game</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {games.map((game) => (
            <Card key={game.id} className="card-hover">
              <CardContent className="flex items-center gap-3 p-3 sm:p-4">
                <Badge
                  variant="outline"
                  className={cn('shrink-0 w-16 justify-center', OUTCOME_STYLES[game.outcome])}
                >
                  {OUTCOME_LABEL[game.outcome]}
                </Badge>

                <Link href={`/games/${game.id}`} className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {game.openingName || 'Unnamed opening'}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Bot className="h-3 w-3" />
                      Computer{game.opponentElo ? ` (${game.opponentElo})` : ''}
                    </span>
                    <span>·</span>
                    <span>You played {game.playerColor}</span>
                    <span>·</span>
                    <span className="tabular-nums">{game.result}</span>
                    <span>·</span>
                    <span>{new Date(game.createdAt).toLocaleDateString()}</span>
                  </div>
                </Link>

                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-red-500"
                  onClick={() => handleDelete(game.id)}
                  disabled={deletingId === game.id}
                  aria-label="Delete game"
                >
                  {deletingId === game.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
                <Link href={`/games/${game.id}`} aria-label="Open game">
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
