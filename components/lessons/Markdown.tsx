import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Minimal, dependency-free Markdown renderer for trusted lesson content.
 *
 * Supports the subset the lessons use — h1/h2/h3 headings, unordered lists,
 * paragraphs, **bold**, and `inline code`. Renders to React elements (no
 * dangerouslySetInnerHTML), so there's no XSS surface.
 */

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

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const key = String(idx);
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
  });
  flushPara('end');
  flushList('end');

  return <div className={cn('space-y-3', className)}>{blocks}</div>;
}
