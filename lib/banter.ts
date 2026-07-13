/**
 * Opponent banter engine — the computer's "personality" during a vs-computer
 * game. Pure and dependency-free: it turns a game event into a short line of
 * text (a taunt, a bit of praise, or a coaching nudge). All randomness is
 * injected by the caller so it stays deterministic/testable.
 *
 * Design goals: fun and competitive, lightly instructive, and NOT distracting —
 * the UI only surfaces a line on notable events, never every move.
 */

export type BanterTone = 'taunt' | 'praise' | 'coach' | 'neutral';

export type BanterEvent =
  | { type: 'start' }
  | { type: 'end'; outcome: 'win' | 'loss' | 'draw' }
  | { type: 'undo' }
  | { type: 'blunder'; piece: string }
  | { type: 'playerCapture'; piece: string }
  | { type: 'computerCapture'; piece: string }
  | { type: 'playerCheck' }
  | { type: 'computerCheck' }
  | { type: 'promotion'; by: 'player' | 'computer' }
  | { type: 'castle'; by: 'player' | 'computer' }
  | { type: 'lead'; who: 'player' | 'computer' | 'even' };

export interface BanterLine {
  text: string;
  tone: BanterTone;
}

const PIECE_VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const PIECE_NAME: Record<string, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

export function pieceName(char: string | null | undefined): string {
  if (!char) return 'piece';
  return PIECE_NAME[char.toLowerCase()] ?? 'piece';
}

/**
 * Material balance from a FEN, white-minus-black in points (kings excluded).
 * Positive = White is up material. No engine required.
 */
export function materialBalance(fen: string): number {
  const board = fen.split(' ')[0] ?? '';
  let balance = 0;
  for (const ch of board) {
    if (ch === '/' || (ch >= '1' && ch <= '8')) continue;
    const val = PIECE_VALUE[ch.toLowerCase()] ?? 0;
    balance += ch === ch.toUpperCase() ? val : -val;
  }
  return balance;
}

/** Deterministic pick from a non-empty pool given a 0..1 random value. */
function pick(pool: string[], rand: number): string {
  if (pool.length === 0) return '';
  const i = Math.min(pool.length - 1, Math.max(0, Math.floor(rand * pool.length)));
  return pool[i];
}

// Message pools. Kept short, upbeat and cheeky — trash talk when ahead, gracious
// when behind, and a genuine learning nudge on real mistakes.
const LINES = {
  start: [
    "New game! Let's see what you've got. 🙂",
    'Fresh board, fresh start. Try to keep your pieces this time!',
    "I've had my coffee. Your move.",
    'May the best mind win — no pressure. ♟️',
  ],
  winForComputer: [
    'GG! Study the review and you’ll get me next time. 🤝',
    'That’s mate! Rematch when you’re ready.',
    'I win this one — but you made me work for it.',
  ],
  lossForComputer: [
    'Well played — you got me! 👏 Rematch?',
    'Ouch. That was genuinely good chess. Respect.',
    'You win! Okay, okay, I underestimated you.',
  ],
  draw: [
    'A draw! Honourable. Let’s run it back.',
    'Split point. You held your nerve — nice.',
  ],
  undo: [
    'Take-back? I’ll allow it… this once. 😏',
    'Second thoughts? Smart players reconsider.',
    'Rewinding, are we? I saw that coming.',
    'Undo away — I’ll still be here.',
  ],
  blunder: [
    'Thanks for the free {piece}! Guard your pieces before you move. 😈',
    'You left your {piece} hanging — always ask "is it defended?"',
    'Oof, the {piece} was undefended. I couldn’t say no.',
    'Free {piece}, don’t mind if I do. Check what I attack next time!',
  ],
  playerCapture: [
    'Hey! My {piece}! Okay, that was fair.',
    'You took my {piece}… I’ll get it back.',
    'Nice grab. Don’t get greedy though.',
  ],
  computerCapture: [
    'Your {piece} is mine now. 😏',
    'I’ll take that {piece}, thank you.',
  ],
  playerCheck: [
    'A check? Bold. I like it.',
    'Check! Making me sweat, are you?',
    'Ooh, aggressive. My king can dance though.',
  ],
  computerCheck: [
    'Check! Mind your king. 👑',
    'Check — where’s your king going to hide?',
  ],
  promotionPlayer: [
    'A new queen?! Show-off. 👑',
    'Promotion! Okay, that’s scary.',
  ],
  promotionComputer: [
    'And… I have a new queen. This is going well (for me). 👑',
    'Promoted! The board just got a lot smaller for you.',
  ],
  castlePlayer: [
    'Castled up — safety first. Good habit.',
    'King tucked away. Textbook.',
  ],
  castleComputer: [
    'Castling — my king likes the corner office. 🏰',
  ],
  leadComputer: [
    'I’m ahead on material — but chess isn’t over till it’s over.',
    'Feeling the pressure yet? Look for active moves.',
    'I’m up a bit. Time for you to create some threats!',
  ],
  leadPlayer: [
    'You’re ahead… for now. I’m plotting. 🤔',
    'Nice lead. Now convert it — trade pieces when you’re up!',
    'You’re winning material. Stay sharp, don’t get careless.',
  ],
  leadEven: [
    'Dead level. This is anyone’s game. 🔥',
    'Balanced position — whoever blinks first loses.',
  ],
};

const TONE: Record<string, BanterTone> = {
  start: 'neutral',
  undo: 'taunt',
  blunder: 'coach',
  playerCapture: 'neutral',
  computerCapture: 'taunt',
  playerCheck: 'neutral',
  computerCheck: 'taunt',
  leadComputer: 'coach',
  leadPlayer: 'coach',
  leadEven: 'neutral',
};

/** Turn an event into a line of banter. `rand` is a 0..1 value from the caller. */
export function banterLine(event: BanterEvent, rand: number): BanterLine {
  switch (event.type) {
    case 'start':
      return { text: pick(LINES.start, rand), tone: 'neutral' };
    case 'end':
      return {
        text:
          event.outcome === 'win'
            ? pick(LINES.lossForComputer, rand) // player won → computer lost
            : event.outcome === 'loss'
              ? pick(LINES.winForComputer, rand)
              : pick(LINES.draw, rand),
        tone: event.outcome === 'loss' ? 'taunt' : 'praise',
      };
    case 'undo':
      return { text: pick(LINES.undo, rand), tone: 'taunt' };
    case 'blunder':
      return {
        text: pick(LINES.blunder, rand).replace('{piece}', pieceName(event.piece)),
        tone: 'coach',
      };
    case 'playerCapture':
      return {
        text: pick(LINES.playerCapture, rand).replace('{piece}', pieceName(event.piece)),
        tone: 'neutral',
      };
    case 'computerCapture':
      return {
        text: pick(LINES.computerCapture, rand).replace('{piece}', pieceName(event.piece)),
        tone: 'taunt',
      };
    case 'playerCheck':
      return { text: pick(LINES.playerCheck, rand), tone: 'neutral' };
    case 'computerCheck':
      return { text: pick(LINES.computerCheck, rand), tone: 'taunt' };
    case 'promotion':
      return {
        text: pick(event.by === 'player' ? LINES.promotionPlayer : LINES.promotionComputer, rand),
        tone: event.by === 'player' ? 'praise' : 'taunt',
      };
    case 'castle':
      return {
        text: pick(event.by === 'player' ? LINES.castlePlayer : LINES.castleComputer, rand),
        tone: 'neutral',
      };
    case 'lead':
      return {
        text:
          event.who === 'computer'
            ? pick(LINES.leadComputer, rand)
            : event.who === 'player'
              ? pick(LINES.leadPlayer, rand)
              : pick(LINES.leadEven, rand),
        tone: event.who === 'even' ? 'neutral' : 'coach',
      };
    default:
      return { text: '', tone: 'neutral' };
  }
}

// ---------------------------------------------------------------------------
// Event derivation — pure, so the blunder-vs-trade logic is unit-testable.
// ---------------------------------------------------------------------------

/** A material swing of ≥2 points against the player over one exchange reads as
 * a hung piece / bad trade — the moment worth coaching. */
const BLUNDER_DROP = 2;
/** Minimum plies between unprompted "who's winning" taunts, to stay calm. */
const LEAD_TAUNT_GAP = 8;
/** Only rook/queen captures are chatty on their own; smaller ones are usually
 * trades and are covered by the blunder check. */
const notable = (char: string | null | undefined) =>
  !!char && (PIECE_VALUE[char.toLowerCase()] ?? 0) >= 5;

/** Cross-render memory the derivation carries between moves. */
export interface BanterMemory {
  prevLen: number;
  prevPlayerBal: number;
  /** Material balance (player perspective) BEFORE the player's latest move. */
  preExchangeBal: number;
  prevOver: boolean;
  plyAtLastTaunt: number;
  greeted: boolean;
}

export function initialBanterMemory(): BanterMemory {
  return {
    prevLen: 0,
    prevPlayerBal: 0,
    preExchangeBal: 0,
    prevOver: false,
    plyAtLastTaunt: 0,
    greeted: false,
  };
}

export interface BanterInput {
  /** Number of half-moves played so far. */
  len: number;
  /** Current material balance from the player's perspective (+ = player up). */
  playerBal: number;
  isGameOver: boolean;
  isCheckmate: boolean;
  /** True when it's the player's turn to move (used for a checkmate outcome). */
  turnIsPlayer: boolean;
  playerColor: 'w' | 'b';
  /** The move just played, or null. `captured` is the chess.js piece char. */
  last: { color: 'w' | 'b'; san: string; captured: string | null } | null;
}

/**
 * Decide what (if anything) the opponent should say, given the latest state and
 * the memory from the previous call. Returns the event plus the updated memory
 * (never mutates the input). Returns `event: null` on quiet moves.
 */
export function deriveBanterEvent(
  input: BanterInput,
  memory: BanterMemory
): { event: BanterEvent | null; memory: BanterMemory } {
  const m = { ...memory };
  const { len, playerBal, isGameOver, isCheckmate, turnIsPlayer, playerColor, last } = input;
  const computerColor = playerColor === 'w' ? 'b' : 'w';
  let event: BanterEvent | null = null;

  if (isGameOver && !m.prevOver) {
    const outcome = isCheckmate ? (turnIsPlayer ? 'loss' : 'win') : 'draw';
    event = { type: 'end', outcome };
  } else if (len === 0) {
    if (m.prevLen > 0) m.greeted = false; // a fresh game — greet again
    m.preExchangeBal = 0;
    m.plyAtLastTaunt = 0;
    if (!m.greeted) {
      event = { type: 'start' };
      m.greeted = true;
    }
  } else if (len < m.prevLen) {
    event = { type: 'undo' };
    m.preExchangeBal = playerBal;
  } else if (len > m.prevLen && last) {
    const san = last.san || '';
    const captured = last.captured;
    const gaveCheck = san.includes('+');
    const isPromo = san.includes('=');
    const isCastle = san.startsWith('O-O');

    if (last.color === playerColor) {
      // Baseline the exchange at the material the player had before moving.
      m.preExchangeBal = m.prevPlayerBal;
      if (gaveCheck) event = { type: 'playerCheck' };
      else if (isPromo) event = { type: 'promotion', by: 'player' };
      else if (isCastle) event = { type: 'castle', by: 'player' };
      else if (notable(captured)) event = { type: 'playerCapture', piece: captured! };
    } else if (last.color === computerColor) {
      const netDrop = m.preExchangeBal - playerBal;
      if (netDrop >= BLUNDER_DROP && captured) event = { type: 'blunder', piece: captured };
      else if (gaveCheck) event = { type: 'computerCheck' };
      else if (isPromo) event = { type: 'promotion', by: 'computer' };
      else if (isCastle) event = { type: 'castle', by: 'computer' };
      else if (notable(captured)) event = { type: 'computerCapture', piece: captured! };
    }

    if (!event && len - m.plyAtLastTaunt >= LEAD_TAUNT_GAP) {
      const who = playerBal >= 2 ? 'player' : playerBal <= -2 ? 'computer' : 'even';
      event = { type: 'lead', who };
      m.plyAtLastTaunt = len;
    }
  }

  m.prevLen = len;
  m.prevPlayerBal = playerBal;
  m.prevOver = isGameOver;
  return { event, memory: m };
}
