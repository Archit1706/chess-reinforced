'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { useUIStore } from '@/store/ui-store';
import { useGameStore } from '@/store/game-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Sun,
  Moon,
  Monitor,
  Volume2,
  VolumeX,
  Eye,
  Keyboard,
  Palette,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { keyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const {
    soundEnabled,
    toggleSound,
    showCoordinates,
    toggleCoordinates,
    showLegalMoves,
    toggleLegalMoves,
    highlightLastMove,
    toggleHighlightLastMove,
    animationSpeed,
    setAnimationSpeed,
    showEvaluation,
    toggleEvaluation,
    analysisDepth,
    setAnalysisDepth,
    autoAnalyze,
    toggleAutoAnalyze,
    opponentBanter,
    toggleOpponentBanter,
    resetSettings,
  } = useUIStore();

  const { computerElo, setComputerElo } = useGameStore();

  // next-themes can't know the theme during SSR, so gate theme-dependent UI on
  // mount: the first client render matches the server (no active button), then
  // the real theme is applied — avoiding a hydration mismatch on the buttons.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const activeTheme = mounted ? theme : undefined;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Customize your chess learning experience
        </p>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how the app looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred color scheme
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={activeTheme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </Button>
                <Button
                  variant={activeTheme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </Button>
                <Button
                  variant={activeTheme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('system')}
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  System
                </Button>
              </div>
            </div>

            {/* Animation Speed */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Animation Speed</p>
                <p className="text-sm text-muted-foreground">
                  Speed of piece movement animations
                </p>
              </div>
              <Select
                value={animationSpeed}
                onValueChange={(value: any) => setAnimationSpeed(value)}
              >
                <SelectTrigger className="w-32" aria-label="Animation speed">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">Slow</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="fast">Fast</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Board Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Board Display
            </CardTitle>
            <CardDescription>Configure chess board options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Show Coordinates</p>
                <p className="text-sm text-muted-foreground">
                  Display rank and file labels
                </p>
              </div>
              <Switch
                checked={showCoordinates}
                onCheckedChange={toggleCoordinates}
                aria-label="Show board coordinates"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Highlight Legal Moves</p>
                <p className="text-sm text-muted-foreground">
                  Show dots on squares where pieces can move
                </p>
              </div>
              <Switch
                checked={showLegalMoves}
                onCheckedChange={toggleLegalMoves}
                aria-label="Highlight legal moves"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Highlight Last Move</p>
                <p className="text-sm text-muted-foreground">
                  Show the previous move on the board
                </p>
              </div>
              <Switch
                checked={highlightLastMove}
                onCheckedChange={toggleHighlightLastMove}
                aria-label="Highlight last move"
              />
            </div>
          </CardContent>
        </Card>

        {/* Analysis Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Engine & Analysis</CardTitle>
            <CardDescription>Configure the computer opponent and analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Opponent Banter &amp; Coaching</p>
                <p className="text-sm text-muted-foreground">
                  Let the computer react as you play — taunts, praise and tips when you slip
                </p>
              </div>
              <Switch
                checked={opponentBanter}
                onCheckedChange={toggleOpponentBanter}
                aria-label="Opponent banter and coaching"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Show Evaluation Bar</p>
                <p className="text-sm text-muted-foreground">
                  Display position evaluation during games
                </p>
              </div>
              <Switch
                checked={showEvaluation}
                onCheckedChange={toggleEvaluation}
                aria-label="Show evaluation bar"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-Analyze Positions</p>
                <p className="text-sm text-muted-foreground">
                  Automatically analyze positions during play
                </p>
              </div>
              <Switch
                checked={autoAnalyze}
                onCheckedChange={toggleAutoAnalyze}
                aria-label="Auto-analyze positions"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Analysis Depth</p>
                <p className="text-sm text-muted-foreground">
                  Higher depth = more accurate but slower
                </p>
              </div>
              <Select
                value={analysisDepth.toString()}
                onValueChange={(value) => setAnalysisDepth(parseInt(value))}
              >
                <SelectTrigger className="w-32" aria-label="Analysis depth">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 (Fast)</SelectItem>
                  <SelectItem value="15">15 (Normal)</SelectItem>
                  <SelectItem value="20">20 (Deep)</SelectItem>
                  <SelectItem value="25">25 (Very Deep)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Default Computer Strength</p>
                <p className="text-sm text-muted-foreground">
                  ELO rating for computer opponent
                </p>
              </div>
              <Select
                value={computerElo.toString()}
                onValueChange={(value) => setComputerElo(parseInt(value))}
              >
                <SelectTrigger className="w-40" aria-label="Default computer strength">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="800">800 (Beginner)</SelectItem>
                  <SelectItem value="1200">1200 (Casual)</SelectItem>
                  <SelectItem value="1500">1500 (Intermediate)</SelectItem>
                  <SelectItem value="1800">1800 (Advanced)</SelectItem>
                  <SelectItem value="2000">2000 (Expert)</SelectItem>
                  <SelectItem value="2200">2200 (Master)</SelectItem>
                  <SelectItem value="2500">2500 (Grandmaster)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sound Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {soundEnabled ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <VolumeX className="h-5 w-5" />
              )}
              Sound
            </CardTitle>
            <CardDescription>Audio feedback settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sound Effects</p>
                <p className="text-sm text-muted-foreground">
                  Play sounds for moves and captures
                </p>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={toggleSound}
                aria-label="Enable sound effects"
              />
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </CardTitle>
            <CardDescription>
              Quick actions for power users — active on the Play page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {keyboardShortcuts.map((category) => (
                <div key={category.category}>
                  <h4 className="font-medium mb-3">{category.category}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {category.shortcuts.map((shortcut) => (
                      <div
                        key={shortcut.key}
                        className="flex items-center justify-between p-2 bg-muted rounded-lg"
                      >
                        <span className="text-sm text-muted-foreground">
                          {shortcut.description}
                        </span>
                        <Badge variant="outline" className="font-mono">
                          {shortcut.key}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reset Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Reset
            </CardTitle>
            <CardDescription>Restore default settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => {
                // Reset all settings to defaults
                resetSettings();
                setTheme('system');
                setComputerElo(1500);
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
