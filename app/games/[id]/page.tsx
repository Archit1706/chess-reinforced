'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Chess, type Move } from 'chess.js';
import { ArrowLeft, Bot, Loader2, Trash2, Download, BarChart3, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GameViewer, GameReview, MistakeTrainer } from '@/components/chess';
import { cn } from '@/lib/utils';
import { fetchGame, deleteGame } from '@/lib/games/client';
import type { GameDetailDTO, GameOutcome } from '@/lib/games/types';
import type { GameAnalysis } from '@/types/chess';

const OUTCOME_STYLES: Record<GameOutcome, string> = {
  win: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30',
  loss: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
  draw: 'bg-muted text-muted-foreground border-border',
  unknown: 'bg-muted text-muted-foreground border-border',
};

const OUTCOME_LABEL: Record<GameOutcome, string> = {
  win: 'You won',
  loss: 'You lost',
  draw: 'Draw',
  unknown: 'Unfinished',
};

export default function GameDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [game, setGame] = useState<GameDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [analysis, setAnalysis] = useState<GameAnalysis | null>(null);

  useEffect(() => {
    let active = true;
    fetchGame(params.id)
      .then((g) => {
        if (active) setGame(g);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  // Parse the PGN into a verbose move list for the analysis panel.
  const moves: Move[] = useMemo(() => {
    if (!game?.pgn) return [];
    try {
      const parser = new Chess();
      parser.loadPgn(game.pgn);
      return parser.history({ verbose: true }) as Move[];
    } catch {
      return [];
    }
  }, [game?.pgn]);

  const handleDelete = async () => {
    setDeleting(true);
    const ok = await deleteGame(params.id);
    if (ok) {
      router.push('/games');
    } else {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    if (!game) return;
    const blob = new Blob([game.pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-game-${params.id.slice(0, 8)}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl text-center space-y-4">
        <p className="text-muted-foreground">This game could not be found.</p>
        <Button asChild variant="outline">
          <Link href="/games">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Games
          </Link>
        </Button>
      </div>
    );
  }

  const orientation = game.playerColor === 'black' ? 'black' : 'white';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button asChild variant="ghost" size="sm">
          <Link href="/games">
            <ArrowLeft className="h-4 w-4 mr-2" />
            My Games
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export PGN</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground hover:text-red-500"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className={cn('text-sm px-3 py-1', OUTCOME_STYLES[game.outcome])}>
          {OUTCOME_LABEL[game.outcome]}
        </Badge>
        <h1 className="text-xl sm:text-2xl font-bold">
          {game.openingName || 'Unnamed opening'}
          {game.openingEco ? (
            <span className="text-muted-foreground font-normal text-base ml-2">({game.openingEco})</span>
          ) : null}
        </h1>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap -mt-3">
        <span className="inline-flex items-center gap-1">
          <Bot className="h-4 w-4" />
          Computer{game.opponentElo ? ` (${game.opponentElo} ELO)` : ''}
        </span>
        <span>·</span>
        <span>You played {game.playerColor}</span>
        <span>·</span>
        <span className="tabular-nums">Result {game.result}</span>
        <span>·</span>
        <span>{new Date(game.createdAt).toLocaleString()}</span>
      </div>

      {/* Replay board */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <GameViewer pgn={game.pgn} orientation={orientation} boardWidth={520} />
        </CardContent>
      </Card>

      {/* Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Game Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showReview ? (
            <GameReview moves={moves} onAnalyzed={setAnalysis} />
          ) : (
            <div className="text-center py-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Run a move-by-move accuracy review of this game.
              </p>
              <Button onClick={() => setShowReview(true)} disabled={moves.length === 0}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analyze game
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Train your mistakes — derived from the analysis above */}
      {analysis && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Train Your Mistakes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MistakeTrainer analysis={analysis} playerColor={orientation} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
