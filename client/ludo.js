/* ═══════════════════════════════════════════════════════════════
   LUDO NAIRA  –  Full multiplayer frontend
   Connects to the existing Node.js + Socket.IO backend.
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────────────────────────
   1.  BOARD COORDINATE DATA
   ──────────────────────────────────────────────────────────────
   Main track: 52 cells (positions 0-51), mapped to [row, col]
   on a 15×15 grid (0-indexed).

   Layout (clockwise from Red entry at [6,1]):
     RED   0-12 : across row 6 right, up col 6, across row 0
     GREEN 13-25: down col 8, across row 6 right, right corner
     YELLOW 26-38: left across row 8, down col 8, across row 14
     BLUE  39-51: up col 6, left across row 8

   Safe cells (SAFE_CELLS): [0,9,14,22,27,35,40,48]
   Entry positions per player index: 0×13=0, 1×13=13, 2×13=26, 3×13=39
   ────────────────────────────────────────────────────────────── */
const TRACK_COORDS = [
  // RED segment (0-12)
  [6,1],[6,2],[6,3],[6,4],[6,5],           // 0-4
  [5,6],[4,6],[3,6],[2,6],[1,6],            // 5-9
  [0,6],[0,7],[0,8],                         // 10-12
  // GREEN segment (13-25)
  [1,8],[2,8],[3,8],[4,8],[5,8],            // 13-17
  [6,8],[6,9],[6,10],[6,11],[6,12],[6,13],  // 18-23
  [6,14],[7,14],                             // 24-25
  // YELLOW segment (26-38)
  [8,14],[8,13],[8,12],[8,11],[8,10],[8,9], // 26-31
  [8,8],[9,8],[10,8],[11,8],[12,8],[13,8],  // 32-37
  [14,8],                                    // 38
  // BLUE segment (39-51)
  [14,7],[14,6],                             // 39-40
  [13,6],[12,6],[11,6],[10,6],[9,6],         // 41-45
  [8,6],[8,5],[8,4],[8,3],[8,2],[8,1]        // 46-51
];

/*
  Home-stretch columns (positions 52-57 per color).
  Index 0 = position 52 (first home-stretch step),
  Index 5 = position 57 (last step before finished).
  Position 58+ means inHome=true → token is finished, render at centre.
*/
const HOME_COORDS = [
  // Red   (color 0): col 7, rows 1→6  (approaching centre from above)
  [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  // Green (color 1): row 7, cols 13→8 (approaching centre from right)
  [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
  // Yellow(color 2): col 7, rows 13→8 (approaching centre from below)
  [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
  // Blue  (color 3): row 7, cols 1→6  (approaching centre from left)
  [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]]
];

/* Yard slot positions for each color (4 token circles per yard) */
const YARD_SLOTS = [
  [[2,2],[2,4],[4,2],[4,4]],           // Red   : top-left yard
  [[2,10],[2,12],[4,10],[4,12]],        // Green : top-right yard
  [[10,2],[10,4],[12,2],[12,4]],        // Yellow: bottom-left yard
  [[10,10],[10,12],[12,10],[12,12]]     // Blue  : bottom-right yard
];

const SAFE_CELLS    = new Set([0, 9, 14, 22, 27, 35, 40, 48]);
const COLOR_NAMES   = ['red', 'green', 'yellow', 'blue'];
const COLOR_LABELS  = ['Red', 'Green', 'Yellow', 'Blue'];
const DICE_EMOJI    = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

/* Build a fast lookup: "r,c" → track position */
const COORD_TO_POS = {};
TRACK_COORDS.forEach(([r, c], i) => { COORD_TO_POS[`${r},${c}`] = i; });

/* ──────────────────────────────────────────────────────────────
   2.  GAME STATE VARIABLES
   ────────────────────────────────────────────────────────────── */
let socket            = null;
let myPlayerId        = null;
let myPlayerName      = '';
let matchId           = null;
let currentGameState  = null;
let diceRolledThisTurn = false;
let movableTokenIds   = [];
let isAnimatingDice   = false;
let toastTimer        = null;

/* ──────────────────────────────────────────────────────────────
   3.  BOARD BUILDING
   ────────────────────────────────────────────────────────────── */
function buildBoard() {
  const boardEl = document.getElementById('ludoBoard');
  boardEl.innerHTML = '';

  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const cell = document.createElement('div');
      cell.className = 'board-cell ' + getCellClasses(r, c);
      cell.id = `cell-${r}-${c}`;
      boardEl.appendChild(cell);
    }
  }
}

function getCellClasses(r, c) {
  /* ── Yard corners ── */
  if (r <= 5 && c <= 5) return getYardClasses(r, c, 'red');
  if (r <= 5 && c >= 9) return getYardClasses(r, c, 'green');
  if (r >= 9 && c <= 5) return getYardClasses(r, c, 'yellow');
  if (r >= 9 && c >= 9) return getYardClasses(r, c, 'blue');

  /* ── Centre 3×3 (rows 6-8, cols 6-8) ──
     Order matters: check track cells first (they overlap with centre corners). */

  /* Track cells that fall inside the centre 3×3 */
  if ((r === 6 && c === 8) || (r === 8 && c === 6) || (r === 8 && c === 8)) {
    /* These are track positions 18, 46, 32 respectively */
    const pos = COORD_TO_POS[`${r},${c}`];
    return SAFE_CELLS.has(pos) ? 'track safe' : 'track';
  }

  if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
    if (r === 7 && c === 7) return 'center-win';
    if (r === 6 && c === 7) return 'home-red';    /* last Red home-stretch cell */
    if (r === 7 && c === 8) return 'home-green';  /* last Green home-stretch cell */
    if (r === 8 && c === 7) return 'home-yellow'; /* last Yellow home-stretch cell */
    if (r === 7 && c === 6) return 'home-blue';   /* last Blue home-stretch cell */
    if (r === 6 && c === 6) return 'center-tl';   /* top-left triangle corner */
    return 'blank';
  }

  /* ── Home columns (non-centre portion) ── */
  if (c === 7 && r >= 1 && r <= 6)  return 'home-red';
  if (r === 7 && c >= 8 && c <= 13) return 'home-green';
  if (c === 7 && r >= 8 && r <= 13) return 'home-yellow';
  if (r === 7 && c >= 1 && c <= 6)  return 'home-blue';

  /* ── Main track ── */
  const pos = COORD_TO_POS[`${r},${c}`];
  if (pos !== undefined) {
    return SAFE_CELLS.has(pos) ? 'track safe' : 'track';
  }

  /* ── Everything else ── */
  return 'blank';
}

function getYardClasses(r, c, color) {
  return isYardInner(r, c, color)
    ? `yard yard-inner-${color}`
    : `yard yard-${color}-bg`;
}

function isYardInner(r, c, color) {
  /* Inner 4×4 token area of each yard */
  const ranges = {
    red:    { r0: 1, r1: 4, c0: 1,  c1: 4  },
    green:  { r0: 1, r1: 4, c0: 10, c1: 13 },
    yellow: { r0: 10,r1: 13,c0: 1,  c1: 4  },
    blue:   { r0: 10,r1: 13,c0: 10, c1: 13 }
  };
  const s = ranges[color];
  return s && r >= s.r0 && r <= s.r1 && c >= s.c0 && c <= s.c1;
}

/* ──────────────────────────────────────────────────────────────
   4.  TOKEN RENDERING
   ────────────────────────────────────────────────────────────── */
function renderTokens(gameState) {
  /* Remove all existing token elements */
  document.querySelectorAll('.token').forEach(t => t.remove());

  gameState.players.forEach(player => {
    player.tokens.forEach(token => {
      const coord = getTokenCoord(player.color, token);
      if (!coord) return;
      const [r, c] = coord;
      const cell = document.getElementById(`cell-${r}-${c}`);
      if (!cell) return;

      const el = document.createElement('div');
      el.className = `token token-${COLOR_NAMES[player.color]}`;
      el.dataset.playerId = player.id;
      el.dataset.tokenId  = String(token.id);
      el.title = `${player.name} – Token ${token.id + 1}`;
      el.addEventListener('click', () => onTokenClick(player.id, token.id));
      cell.appendChild(el);
    });
  });
}

function getTokenCoord(color, token) {
  const { position, inHome, id } = token;

  /* In yard */
  if (inHome && position === -1) {
    return YARD_SLOTS[color][id] || null;
  }

  /* Finished (homeCount reached, inHome set true again with pos >= 52) */
  if (inHome && position > 0) {
    /* Show in centre */
    return [7, 7];
  }

  /* Home stretch (positions 52-57) */
  if (!inHome && position >= 52) {
    const idx = position - 52; /* 0-5 */
    const col = HOME_COORDS[color];
    return (col && col[idx]) ? col[idx] : null;
  }

  /* Main track (positions 0-51) */
  if (!inHome && position >= 0 && position < 52) {
    return TRACK_COORDS[position] || null;
  }

  return null;
}

/* ──────────────────────────────────────────────────────────────
   5.  PLAYER PANEL & TURN UI
   ────────────────────────────────────────────────────────────── */
function renderPlayersPanel(gameState) {
  const panel = document.getElementById('playersPanel');
  panel.innerHTML = '';

  gameState.players.forEach((player, idx) => {
    const card = document.createElement('div');
    card.className = `player-card player-${COLOR_NAMES[player.color]}`;
    if (idx === gameState.currentPlayer) card.classList.add('active');

    card.innerHTML = `
      <div class="player-color-dot"></div>
      <div>
        <div class="player-name">${escHtml(player.name)}${player.id === myPlayerId ? ' <em>(You)</em>' : ''}</div>
        <div class="player-home">🏠 ${player.homeCount}/4</div>
      </div>`;
    panel.appendChild(card);
  });
}

function updateTurnIndicator(gameState) {
  const ind = document.getElementById('turnIndicator');
  const cur = gameState.players[gameState.currentPlayer];
  if (!cur) { ind.textContent = ''; return; }

  const isMe = cur.id === myPlayerId;
  ind.className = 'turn-indicator' + (isMe ? ' my-turn' : '');
  ind.textContent = isMe
    ? '🎯 Your turn – Roll the dice!'
    : `⏳ ${cur.name}'s turn…`;
}

function updateRollButton() {
  const isMe = isMyTurn();
  const btn  = document.getElementById('rollBtn');
  btn.disabled = !isMe || diceRolledThisTurn || isAnimatingDice;
}

function isMyTurn() {
  if (!currentGameState || !myPlayerId) return false;
  const cur = currentGameState.players[currentGameState.currentPlayer];
  return cur && cur.id === myPlayerId;
}

/* ──────────────────────────────────────────────────────────────
   6.  DICE
   ────────────────────────────────────────────────────────────── */
function animateDice(result, onDone) {
  const die   = document.getElementById('dieEl');
  const face  = document.getElementById('dieFace');
  isAnimatingDice = true;
  die.classList.add('rolling');

  /* Show random faces during animation */
  let ticks = 0;
  const iv = setInterval(() => {
    face.textContent = DICE_EMOJI[Math.ceil(Math.random() * 6)];
    ticks++;
    if (ticks >= 6) {
      clearInterval(iv);
      face.textContent = DICE_EMOJI[result] || String(result);
      die.classList.remove('rolling');
      isAnimatingDice = false;
      updateRollButton();
      if (typeof onDone === 'function') onDone();
    }
  }, 100);
}

function clearDice() {
  document.getElementById('dieFace').textContent = '🎲';
}

/* ──────────────────────────────────────────────────────────────
   7.  MOVABLE TOKEN HIGHLIGHTING
   ────────────────────────────────────────────────────────────── */
function highlightMovableTokens(gameState, diceResult) {
  clearMovableHighlights();
  document.getElementById('skipBtn').classList.add('hidden');
  movableTokenIds = [];

  if (!isMyTurn()) return;

  const me = gameState.players.find(p => p.id === myPlayerId);
  if (!me) return;

  me.tokens.forEach(token => {
    if (canMoveToken(token, diceResult)) {
      movableTokenIds.push(token.id);
      const el = document.querySelector(
        `.token[data-player-id="${me.id}"][data-token-id="${token.id}"]`
      );
      if (el) el.classList.add('movable');
    }
  });

  if (movableTokenIds.length === 0) {
    document.getElementById('skipBtn').classList.remove('hidden');
  }
}

function canMoveToken(token, diceResult) {
  /* Finished tokens cannot move */
  if (token.inHome && token.position > 0) return false;
  /* Yard tokens only move on a 6 */
  if (token.inHome && token.position === -1) return diceResult === 6;
  /* Home-stretch or main-track tokens can always move */
  return true;
}

function clearMovableHighlights() {
  document.querySelectorAll('.token.movable').forEach(el => el.classList.remove('movable'));
  movableTokenIds = [];
}

/* ──────────────────────────────────────────────────────────────
   8.  USER EVENT HANDLERS
   ────────────────────────────────────────────────────────────── */
function onRollDice() {
  if (!isMyTurn() || diceRolledThisTurn || isAnimatingDice) return;
  document.getElementById('rollBtn').disabled = true;
  socket.emit('game:roll-dice', { matchId });
}

function onSkipTurn() {
  clearMovableHighlights();
  document.getElementById('skipBtn').classList.add('hidden');
  socket.emit('game:skip-turn', { matchId });
}

function onTokenClick(playerId, tokenId) {
  if (!diceRolledThisTurn)                        return;
  if (!movableTokenIds.includes(tokenId))          return;
  if (!currentGameState)                           return;
  const me = currentGameState.players.find(p => p.id === myPlayerId);
  if (!me || me.id !== playerId)                   return;

  clearMovableHighlights();
  document.getElementById('skipBtn').classList.add('hidden');
  socket.emit('game:move-token', { matchId, tokenId });
}

/* ──────────────────────────────────────────────────────────────
   9.  SCREEN HELPERS
   ────────────────────────────────────────────────────────────── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.toggle('active', s.id === id);
    s.classList.toggle('hidden', s.id !== id);
  });
}

function showWaiting(text) {
  document.getElementById('waitingText').textContent = text || 'Please wait…';
  document.getElementById('waitingOverlay').classList.remove('hidden');
}

function hideWaiting() {
  document.getElementById('waitingOverlay').classList.add('hidden');
}

function updateWaitingText(text) {
  document.getElementById('waitingText').textContent = text;
}

function showGameScreen() {
  showScreen('gameScreen');
}

function showWinner(winner) {
  const name = winner ? escHtml(winner.name) : 'Someone';
  const color = winner ? COLOR_LABELS[winner.color] : '';
  document.getElementById('winnerText').innerHTML =
    `🎉 ${name} wins!<br><small>${color} player</small>`;
  document.getElementById('winnerOverlay').classList.remove('hidden');
}

function showToast(msg, duration) {
  const t = document.getElementById('errorToast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), duration || 3500);
}

/* ──────────────────────────────────────────────────────────────
   10.  FULL BOARD RENDER
   ────────────────────────────────────────────────────────────── */
function renderBoard() {
  if (!currentGameState) return;
  renderTokens(currentGameState);
  renderPlayersPanel(currentGameState);
  updateTurnIndicator(currentGameState);
  updateRollButton();
}

/* ──────────────────────────────────────────────────────────────
   11.  SOCKET CONNECTION
   ────────────────────────────────────────────────────────────── */
function setupSocketListeners() {
  /* Waiting for opponent */
  socket.on('game:waiting', data => {
    updateWaitingText(data.message || 'Waiting for another player…');
  });

  /* Match found */
  socket.on('game:match-found', data => {
    matchId            = data.matchId;
    currentGameState   = data.gameState;
    diceRolledThisTurn = false;
    movableTokenIds    = [];

    hideWaiting();
    showGameScreen();
    buildBoard();
    renderBoard();

    socket.emit('game:join-match', { matchId });
  });

  /* A player joined the room */
  socket.on('game:player-joined', data => {
    currentGameState = data.gameState;
    renderBoard();
  });

  /* Dice rolled (by any player) */
  socket.on('game:dice-rolled', data => {
    diceRolledThisTurn = true;
    animateDice(data.diceResult, () => {
      if (currentGameState) {
        highlightMovableTokens(currentGameState, data.diceResult);
      }
      updateRollButton();
    });
  });

  /* Board state updated after a move */
  socket.on('game:state-updated', data => {
    currentGameState   = data.gameState;
    diceRolledThisTurn = false;
    movableTokenIds    = [];
    clearDice();
    clearMovableHighlights();
    document.getElementById('skipBtn').classList.add('hidden');
    renderBoard();
  });

  /* Turn was skipped */
  socket.on('game:turn-skipped', data => {
    currentGameState   = data.gameState;
    diceRolledThisTurn = false;
    movableTokenIds    = [];
    clearDice();
    renderBoard();
  });

  /* Game ended */
  socket.on('game:ended', data => {
    currentGameState = data.finalState;
    renderBoard();
    showWinner(data.winner);
  });

  /* Server error */
  socket.on('game:error', data => {
    showToast(data.message || 'Game error');
    /* Re-enable roll if server rejected a dice roll that hadn't happened yet */
    if (!diceRolledThisTurn) updateRollButton();
  });

  /* Socket transport errors */
  socket.on('connect_error', err => {
    hideWaiting();
    showToast('Connection error: ' + err.message, 5000);
  });

  socket.on('disconnect', () => {
    showToast('Disconnected from server', 5000);
  });
}

/* ──────────────────────────────────────────────────────────────
   12.  FIND MATCH  (entry point from HTML button)
   ────────────────────────────────────────────────────────────── */
async function startFindMatch() {
  const nameInput = document.getElementById('playerNameInput');
  const name = nameInput.value.trim();
  if (!name) {
    showToast('Please enter your name');
    nameInput.focus();
    return;
  }

  const btn = document.getElementById('findMatchBtn');
  btn.disabled = true;
  myPlayerName = name;

  showWaiting('Connecting to server…');

  try {
    /* 1. Get a signed guest JWT from the server */
    const resp = await fetch(`/api/guest/token?name=${encodeURIComponent(name)}`);
    if (!resp.ok) throw new Error('Could not get guest token (HTTP ' + resp.status + ')');
    const { token, userId } = await resp.json();
    myPlayerId = userId;

    /* 2. Connect Socket.IO with JWT */
    socket = io('/game', {
      auth: { token },
      reconnectionAttempts: 3
    });

    setupSocketListeners();

    socket.on('connect', () => {
      updateWaitingText('Finding an opponent…');
      /* 3. Request matchmaking */
      socket.emit('game:find-match', {
        playerCount: 2,
        gameType:    'free',
        entryFee:    0
      });
    });

  } catch (err) {
    hideWaiting();
    btn.disabled = false;
    showToast(err.message || 'Failed to connect', 5000);
  }
}

/* Cancel while waiting */
function cancelMatch() {
  hideWaiting();
  if (socket) { socket.disconnect(); socket = null; }
  document.getElementById('findMatchBtn').disabled = false;
  myPlayerId = null;
  matchId    = null;
}

/* ──────────────────────────────────────────────────────────────
   13.  UTILITY
   ────────────────────────────────────────────────────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* Enter key on name input triggers Find Match */
document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('playerNameInput');
  if (inp) {
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') startFindMatch();
    });
    inp.focus();
  }
});
