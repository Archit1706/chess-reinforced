'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ChevronRight,
  Lock,
  Check,
  Clock,
  Star,
  Swords,
  Castle,
  Crown,
  Target,
  Lightbulb,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Lesson data structure
interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: number;
  completed: boolean;
  locked: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  lessons: Lesson[];
  level: 'beginner' | 'intermediate' | 'advanced';
}

// Sample lesson data
const modules: Module[] = [
  // Beginner Modules
  {
    id: 'piece-movement',
    title: 'Piece Movement',
    description: 'Learn how each piece moves and captures',
    icon: Swords,
    level: 'beginner',
    lessons: [
      {
        id: 'pawn-movement',
        title: 'The Pawn',
        description: 'Learn pawn movement, capturing, en passant, and promotion',
        duration: 10,
        difficulty: 1,
        completed: true,
        locked: false,
      },
      {
        id: 'knight-movement',
        title: 'The Knight',
        description: 'Master the unique L-shaped movement of the knight',
        duration: 10,
        difficulty: 1,
        completed: true,
        locked: false,
      },
      {
        id: 'bishop-movement',
        title: 'The Bishop',
        description: 'Understand diagonal movement and bishop pairs',
        duration: 8,
        difficulty: 1,
        completed: false,
        locked: false,
      },
      {
        id: 'rook-movement',
        title: 'The Rook',
        description: 'Learn horizontal and vertical movement, castling rights',
        duration: 10,
        difficulty: 1,
        completed: false,
        locked: false,
      },
      {
        id: 'queen-movement',
        title: 'The Queen',
        description: 'Combine rook and bishop powers with the queen',
        duration: 8,
        difficulty: 1,
        completed: false,
        locked: false,
      },
      {
        id: 'king-movement',
        title: 'The King',
        description: 'Learn king movement, castling, and safety',
        duration: 12,
        difficulty: 1,
        completed: false,
        locked: false,
      },
    ],
  },
  {
    id: 'basic-tactics',
    title: 'Basic Tactics',
    description: 'Essential tactical patterns every player must know',
    icon: Target,
    level: 'beginner',
    lessons: [
      {
        id: 'forks',
        title: 'Forks',
        description: 'Attack two pieces at once with a single piece',
        duration: 15,
        difficulty: 2,
        completed: false,
        locked: false,
      },
      {
        id: 'pins',
        title: 'Pins',
        description: 'Immobilize pieces by attacking through them',
        duration: 15,
        difficulty: 2,
        completed: false,
        locked: false,
      },
      {
        id: 'skewers',
        title: 'Skewers',
        description: 'Force a valuable piece to move, capturing behind it',
        duration: 12,
        difficulty: 2,
        completed: false,
        locked: true,
      },
      {
        id: 'discovered-attacks',
        title: 'Discovered Attacks',
        description: 'Unleash hidden attacks by moving a piece',
        duration: 15,
        difficulty: 3,
        completed: false,
        locked: true,
      },
    ],
  },
  {
    id: 'checkmate-patterns',
    title: 'Checkmate Patterns',
    description: 'Recognize and execute common checkmate patterns',
    icon: Crown,
    level: 'beginner',
    lessons: [
      {
        id: 'back-rank-mate',
        title: 'Back Rank Mate',
        description: 'Checkmate on the first or eighth rank',
        duration: 12,
        difficulty: 2,
        completed: false,
        locked: false,
      },
      {
        id: 'ladder-mate',
        title: 'Ladder Mate',
        description: 'Systematic checkmate with two rooks',
        duration: 15,
        difficulty: 2,
        completed: false,
        locked: false,
      },
      {
        id: 'scholars-mate',
        title: "Scholar's Mate",
        description: 'Quick checkmate and how to defend against it',
        duration: 10,
        difficulty: 1,
        completed: false,
        locked: false,
      },
      {
        id: 'smothered-mate',
        title: 'Smothered Mate',
        description: 'Knight checkmate where the king is trapped',
        duration: 12,
        difficulty: 3,
        completed: false,
        locked: true,
      },
    ],
  },

  // Intermediate Modules
  {
    id: 'opening-principles',
    title: 'Opening Principles',
    description: 'Fundamental concepts for the opening phase',
    icon: Lightbulb,
    level: 'intermediate',
    lessons: [
      {
        id: 'center-control',
        title: 'Control the Center',
        description: 'Why the center is crucial and how to control it',
        duration: 15,
        difficulty: 2,
        completed: false,
        locked: false,
      },
      {
        id: 'piece-development',
        title: 'Piece Development',
        description: 'Quickly activate your pieces for maximum effect',
        duration: 15,
        difficulty: 2,
        completed: false,
        locked: false,
      },
      {
        id: 'king-safety',
        title: 'King Safety',
        description: 'Castle early and protect your king',
        duration: 12,
        difficulty: 2,
        completed: false,
        locked: false,
      },
      {
        id: 'common-mistakes',
        title: 'Opening Mistakes to Avoid',
        description: 'Learn from common beginner opening errors',
        duration: 15,
        difficulty: 2,
        completed: false,
        locked: true,
      },
    ],
  },
  {
    id: 'endgame-basics',
    title: 'Endgame Basics',
    description: 'Essential endgame techniques',
    icon: Castle,
    level: 'intermediate',
    lessons: [
      {
        id: 'king-pawn-endgame',
        title: 'King and Pawn vs King',
        description: 'Win or draw with just a pawn advantage',
        duration: 20,
        difficulty: 3,
        completed: false,
        locked: false,
      },
      {
        id: 'queen-vs-king',
        title: 'Queen vs King',
        description: 'Technique to checkmate with queen and king',
        duration: 15,
        difficulty: 2,
        completed: false,
        locked: false,
      },
      {
        id: 'rook-vs-king',
        title: 'Rook vs King',
        description: 'Master the box technique for rook checkmates',
        duration: 18,
        difficulty: 3,
        completed: false,
        locked: false,
      },
      {
        id: 'opposition',
        title: 'Opposition',
        description: 'Critical king positioning in endgames',
        duration: 15,
        difficulty: 3,
        completed: false,
        locked: true,
      },
    ],
  },

  // Advanced Modules
  {
    id: 'popular-openings',
    title: 'Popular Openings',
    description: 'Study the most played chess openings',
    icon: BookOpen,
    level: 'advanced',
    lessons: [
      {
        id: 'italian-game',
        title: 'Italian Game',
        description: 'Classic opening aiming for center control',
        duration: 25,
        difficulty: 3,
        completed: false,
        locked: false,
      },
      {
        id: 'sicilian-defense',
        title: 'Sicilian Defense',
        description: "Black's most popular response to 1.e4",
        duration: 30,
        difficulty: 4,
        completed: false,
        locked: false,
      },
      {
        id: 'queens-gambit',
        title: "Queen's Gambit",
        description: 'Strategic opening with 1.d4 d5 2.c4',
        duration: 25,
        difficulty: 4,
        completed: false,
        locked: true,
      },
      {
        id: 'london-system',
        title: 'London System',
        description: 'Solid and easy-to-learn opening system',
        duration: 20,
        difficulty: 3,
        completed: false,
        locked: true,
      },
    ],
  },
  {
    id: 'advanced-tactics',
    title: 'Advanced Tactics',
    description: 'Complex tactical patterns for stronger play',
    icon: Zap,
    level: 'advanced',
    lessons: [
      {
        id: 'deflection',
        title: 'Deflection',
        description: 'Force a defender away from its duty',
        duration: 18,
        difficulty: 4,
        completed: false,
        locked: false,
      },
      {
        id: 'decoy',
        title: 'Decoy',
        description: 'Lure a piece to a vulnerable square',
        duration: 18,
        difficulty: 4,
        completed: false,
        locked: false,
      },
      {
        id: 'interference',
        title: 'Interference',
        description: 'Block coordination between enemy pieces',
        duration: 20,
        difficulty: 4,
        completed: false,
        locked: true,
      },
      {
        id: 'zwischenzug',
        title: 'Zwischenzug (In-between Move)',
        description: 'Intermediate moves that change everything',
        duration: 20,
        difficulty: 5,
        completed: false,
        locked: true,
      },
    ],
  },
];

function ModuleCard({ module }: { module: Module }) {
  const completedLessons = module.lessons.filter((l) => l.completed).length;
  const totalLessons = module.lessons.length;
  const progress = (completedLessons / totalLessons) * 100;
  const Icon = module.icon;

  const levelColors = {
    beginner: 'bg-green-500',
    intermediate: 'bg-yellow-500',
    advanced: 'bg-orange-500',
  };

  return (
    <Card className="card-hover">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="h-12 w-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary-600" />
          </div>
          <Badge
            variant="secondary"
            className={cn(
              'text-white capitalize',
              levelColors[module.level]
            )}
          >
            {module.level}
          </Badge>
        </div>
        <CardTitle className="text-lg mt-4">{module.title}</CardTitle>
        <CardDescription>{module.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {completedLessons}/{totalLessons} lessons
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Lesson list */}
        <div className="space-y-2">
          {module.lessons.slice(0, 3).map((lesson) => (
            <Link
              key={lesson.id}
              href={lesson.locked ? '#' : `/lessons/${module.id}/${lesson.id}`}
              className={cn(
                'flex items-center justify-between p-2 rounded-lg transition-colors',
                lesson.locked
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-muted'
              )}
            >
              <div className="flex items-center gap-2">
                {lesson.completed ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : lesson.locked ? (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                )}
                <span
                  className={cn(
                    'text-sm',
                    lesson.completed && 'text-muted-foreground line-through'
                  )}
                >
                  {lesson.title}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {lesson.duration}m
              </div>
            </Link>
          ))}

          {module.lessons.length > 3 && (
            <p className="text-sm text-muted-foreground text-center pt-2">
              +{module.lessons.length - 3} more lessons
            </p>
          )}
        </div>

        {/* View all button */}
        <Link href={`/lessons/${module.id}`}>
          <Button variant="outline" className="w-full mt-4">
            View All Lessons
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function LessonsPage() {
  const beginnerModules = modules.filter((m) => m.level === 'beginner');
  const intermediateModules = modules.filter((m) => m.level === 'intermediate');
  const advancedModules = modules.filter((m) => m.level === 'advanced');

  // Calculate overall progress
  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessons = modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.completed).length,
    0
  );
  const overallProgress = (completedLessons / totalLessons) * 100;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Learn Chess</h1>
        <p className="text-muted-foreground">
          Master chess through structured lessons from beginner to advanced
        </p>
      </div>

      {/* Overall Progress */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Your Progress</h2>
              <p className="text-sm text-muted-foreground">
                {completedLessons} of {totalLessons} lessons completed
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary-600">
                {Math.round(overallProgress)}%
              </span>
            </div>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Tabs for filtering */}
      <Tabs defaultValue="all" className="mb-8">
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="beginner">Beginner</TabsTrigger>
          <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-8">
            {/* Beginner */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                Beginner
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {beginnerModules.map((module) => (
                  <ModuleCard key={module.id} module={module} />
                ))}
              </div>
            </div>

            {/* Intermediate */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                Intermediate
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {intermediateModules.map((module) => (
                  <ModuleCard key={module.id} module={module} />
                ))}
              </div>
            </div>

            {/* Advanced */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
                Advanced
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {advancedModules.map((module) => (
                  <ModuleCard key={module.id} module={module} />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="beginner" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beginnerModules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="intermediate" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {intermediateModules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advancedModules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
