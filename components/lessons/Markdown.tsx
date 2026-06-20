import React from 'react';
import { cn } from '@/lib/utils';
import { LessonBoard } from './LessonBoard';

/**
 * Minimal, dependency-free Markdown renderer for trusted lesson content.
 *
 * Supports the subset the lessons use — h1/h2/h3 headings, unordered lists,
 * paragraphs, **bold**, `inline code`, and a ```chess fenced block that embeds
 * an interactive/animated board. Renders to React elements (no
 * dangerouslySetInnerHTML), so there's no XSS surface.
 *
 * A ```chess block accepts key: value lines, e.g.
 *   ```chess
 *   mode: interactive            # or: animate (default)
 *   fen: 4k3/8/8/3N4/8/8/8/4K3 w - - 0 1
 *   moves: e4 e5 Nf3             # SAN/UCI, for animate mode
 *   autoplay: true
 *   flip: false
 *   caption: Drag the knight
 *   ```
 */

interface ChessBlockConfig {
  interactive?: boolean;
  fen?: string;
  moves?: string[];
  autoPlay?: boolean;
  flip?: boolean;
  caption?: string;
}

function parseChessBlock(body: string): ChessBlockConfig {
  const cfg: ChessBlockConfig = {};
  for (const line of body.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const val = line.slice(idx + 1).trim();
    if (!val) continue;
    if (key === 'fen') cfg.fen = val;
    else if (key === 'mode') cfg.interactive = val.toLowerCase() === 'interactive';
    else if (key === 'moves') cfg.moves = val.split(/\s+/).filter(Boolean);
    else if (key === 'autoplay') cfg.autoPlay = val.toLowerCase() === 'true';
    else if (key === 'flip') cfg.flip = val.toLowerCase() === 'true';
    else if (key === 'caption') cfg.caption = val;
  }
  return cfg;
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (/^`[^`]+`$/.test(part)) {
      return (
        <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-sm">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

export function Markdown({ content, className }: { content: string; className?: string }) {
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = (key: string) => {
    if (para.length === 0) return;
    blocks.push(
      <p key={`p-${key}`} className="leading-relaxed text-muted-foreground">
        {renderInline(para.join(' '), `p-${key}`)}
      </p>
    );
    para = [];
  };
  const flushList = (key: string) => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={`ul-${key}`} className="list-disc space-y-1 pl-6 text-muted-foreground">
        {list.map((item, i) => (
          <li key={i}>{renderInline(item, `li-${key}-${i}`)}</li>
        ))}
      </ul>
    );
    list = [];
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const raw = lines[idx];
    const line = raw.trimEnd();
    const key = String(idx);

    // Fenced code block: ```lang ... ```
    const fence = line.match(/^```(\w*)/);
    if (fence) {
      flushPara(key);
      flushList(key);
      const lang = fence[1].toLowerCase();
      const bodyLines: string[] = [];
      idx++; // move past the opening fence
      while (idx < lines.length && !/^```/.test(lines[idx])) {
        bodyLines.push(lines[idx]);
        idx++;
      }
      // idx now points at the closing fence (or end of input)
      const body = bodyLines.join('\n');
      if (lang === 'chess') {
        const cfg = parseChessBlock(body);
        blocks.push(
          <div key={`chess-${key}`} className="flex justify-center">
            <LessonBoard
              interactive={cfg.interactive}
              fen={cfg.fen}
              moves={cfg.moves}
              autoPlay={cfg.autoPlay}
              flip={cfg.flip}
              caption={cfg.caption}
            />
          </div>
        );
      } else {
        blocks.push(
          <pre key={`pre-${key}`} className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
            <code className="font-mono">{body}</code>
          </pre>
        );
      }
      continue;
    }

    if (/^###\s+/.test(line)) {
      flushPara(key);
      flushList(key);
      blocks.push(
        <h3 key={`h3-${key}`} className="mt-6 text-lg font-semibold">
          {renderInline(line.replace(/^###\s+/, ''), `h3-${key}`)}
        </h3>
      );
    } else if (/^##\s+/.test(line)) {
      flushPara(key);
      flushList(key);
      blocks.push(
        <h2 key={`h2-${key}`} className="mt-8 text-xl font-bold">
          {renderInline(line.replace(/^##\s+/, ''), `h2-${key}`)}
        </h2>
      );
    } else if (/^#\s+/.test(line)) {
      flushPara(key);
      flushList(key);
      blocks.push(
        <h1 key={`h1-${key}`} className="text-2xl font-bold">
          {renderInline(line.replace(/^#\s+/, ''), `h1-${key}`)}
        </h1>
      );
    } else if (/^[-*]\s+/.test(line)) {
      flushPara(key);
      list.push(line.replace(/^[-*]\s+/, ''));
    } else if (line.trim() === '') {
      flushPara(key);
      flushList(key);
    } else {
      flushList(key);
      para.push(line.trim());
    }
  }
  flushPara('end');
  flushList('end');

  return <div className={cn('space-y-3', className)}>{blocks}</div>;
}
