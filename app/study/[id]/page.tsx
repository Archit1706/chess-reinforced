'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GameViewer } from '@/components/chess';
import { fetchFamousGame } from '@/lib/famous-games/client';
import { formatTheme } from '@/lib/puzzles/lichess';
import type { FamousGameDetail } from '@/lib/famous-games/types';
import { ArrowLeft, Loader2, Trophy } from 'lucide-react';

type Status = 'loading' | 'ready' | 'notfound';

function resultLabel(result: string): string {
  if (result === '1-0') return 'White won';
  if (result === '0-1') return 'Black won';
  if (result === '1/2-1/2') return 'Draw';
  return result;
}

export default function StudyGamePage() {
  const params = useParams<{ id: string }>();
  const [status, setStatus] = useState<Status>('loading');
  const [game, setGame] = useState<FamousGameDetail | null>(null);

  useEffect(() => {
    let active = true;
    fetchFamousGame(params.id).then((data) => {
      if (!active) return;
      if (!data) {
        setStatus('notfound');
        return;
      }
      setGame(data);
      setStatus('ready');
    });
    return () => {
      active = false;
    };
  }, [params.id]);

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-3">Loading game…</span>
      </div>
    );
  }

  if (status === 'notfound' || !game) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-4">
        <h1 className="text-2xl font-bold">Game not found</h1>
        <Link href="/study">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Study
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 text-sm text-muted-foreground flex items-center gap-1">
        <Link href="/study" className="hover:text-foreground">
          Study
        </Link>
        <span>/</span>
        <span>
          {game.white} vs {game.black}
        </span>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          {game.white} vs {game.black}
        </h1>
        <p className="text-muted-foreground mt-2">
          {[game.event, game.year].filter(Boolean).join(' · ') || 'Classic game'} ·{' '}
          {resultLabel(game.result)}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {game.eco && (
            <Badge variant="outline" className="font-mono">
              {game.eco}
            </Badge>
          )}
          {game.themes.map((t) => (
            <Badge key={t} variant="secondary" className="text-xs">
              {formatTheme(t)}
            </Badge>
          ))}
          <Badge variant="outline">Difficulty {game.difficulty}/5</Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Replay</CardTitle>
        </CardHeader>
        <CardContent>
          <GameViewer pgn={game.pgn} />
          <p className="text-xs text-muted-foreground mt-3">
            Use the controls or arrow keys (← → to step, ↑ start, ↓ end). Click any move to jump.
          </p>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Link href="/study">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            All Games
          </Button>
        </Link>
      </div>
    </div>
  );
}
