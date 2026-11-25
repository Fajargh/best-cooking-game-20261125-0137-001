// render.js — every pixel of Sizzle & Serve, drawn on one canvas.
// One job: drawing. Game rules live in game.js.

import { ingredientById, PREP_LABEL, INGREDIENTS } from './recipes.js';
import { SCREEN } from './game.js';

export const W = 1280;
export const H = 800;

// Layout: order tickets, prep stations, plate, ingredient counter, buttons.
export const LAYOUT = {
  tickets: [
    { x: 24, y: 76, w: 400, h: 118 },
    { x: 440, y: 76, w: 400, h: 118 },
    { x: 856, y: 76, w: 400, h: 118 },
  ],
  grill: { x: 40, y: 240, w: 280, h: 200 },
  board: { x: 350, y: 240, w: 280, h: 200 },
  pot: { x: 660, y: 240, w: 280, h: 200 },
  plate: { x: 970, y: 240, w: 270, h: 200 },
  serve: { x: 970, y: 452, w: 270, h: 52 },
  clear: { x: 970, y: 512, w: 130, h: 40 },
  trash: { x: 1110, y: 512, w: 130, h: 40 },
  counter: { x: 24, y: 580, w: 1232, h: 150 },
  start: { x: 440, y: 560, w: 400, h: 64 },
  restart: { x: 440, y: 560, w: 400, h: 64 },
};

export function ingredientBins() {
  const bins = [];
  const { x, y, w, h } = LAYOUT.counter;
  const n = 10;
  const gap = 8;
  const bw = (w - gap * (n - 1)) / n;
  for (let i = 0; i < n; i += 1) {
    bins.push({ x: x + i * (bw + gap), y, w: bw, h, index: i });
  }
  return bins;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// ---- vector food icons (drawn, never borrowed) ---------------------------

export function drawIngredient(ctx, id, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  const u = s / 2;
  switch (id) {
    case 'bun':
      ctx.fillStyle = '#e8a54b';
      ctx.beginPath(); ctx.ellipse(0, -u * 0.15, u, u * 0.62, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#c98a35';
      ctx.fillRect(-u, -u * 0.18, u * 2, u * 0.22);
      ctx.fillStyle = '#fff2cf';
      for (const dx of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.ellipse(dx * u, -u * 0.45, u * 0.08, u * 0.05, 0, 0, Math.PI * 2); ctx.fill(); }
      break;
    case 'patty':
      ctx.fillStyle = '#8a5a33';
      ctx.beginPath(); ctx.ellipse(0, 0, u, u * 0.45, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6b4223';
      ctx.beginPath(); ctx.ellipse(-u * 0.3, -u * 0.1, u * 0.25, u * 0.1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(u * 0.35, u * 0.12, u * 0.2, u * 0.08, 0, 0, Math.PI * 2); ctx.fill();
      break;
    case 'cheese':
      ctx.fillStyle = '#ffc93c';
      ctx.beginPath(); ctx.moveTo(-u, u * 0.5); ctx.lineTo(u, u * 0.5); ctx.lineTo(0, -u * 0.6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d99e12';
      for (const [dx, dy] of [[-0.3, 0.2], [0.25, 0.05], [0, 0.35]]) { ctx.beginPath(); ctx.arc(dx * u, dy * u, u * 0.09, 0, Math.PI * 2); ctx.fill(); }
      break;
    case 'lettuce':
      ctx.fillStyle = '#7dc242';
      ctx.beginPath();
      for (let i = 0; i <= 8; i += 1) {
        const a = (i / 8) * Math.PI * 2;
        const r = u * (i % 2 === 0 ? 1 : 0.72);
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r * 0.7;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#4d8a24'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-u * 0.6, 0); ctx.lineTo(u * 0.6, 0); ctx.stroke();
      break;
    case 'tomato':
      ctx.fillStyle = '#e8483f';
      ctx.beginPath(); ctx.arc(0, 0, u * 0.85, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7dc242';
      ctx.beginPath(); ctx.ellipse(0, -u * 0.75, u * 0.3, u * 0.18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f58a82';
      ctx.beginPath(); ctx.ellipse(-u * 0.3, -u * 0.3, u * 0.22, u * 0.14, -0.5, 0, Math.PI * 2); ctx.fill();
      break;
    case 'pasta':
      ctx.strokeStyle = '#f2d38a'; ctx.lineWidth = u * 0.22; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-u * 0.8, (i - 1) * u * 0.45);
        ctx.bezierCurveTo(-u * 0.3, (i - 1) * u * 0.45 - u * 0.3, u * 0.3, (i - 1) * u * 0.45 + u * 0.3, u * 0.8, (i - 1) * u * 0.45);
        ctx.stroke();
      }
      ctx.fillStyle = '#e8483f';
      ctx.beginPath(); ctx.arc(u * 0.4, -u * 0.5, u * 0.18, 0, Math.PI * 2); ctx.fill();
      break;
    case 'berry':
      ctx.fillStyle = '#8e44ad';
      for (const [dx, dy] of [[-0.35, 0.1], [0.35, 0.1], [0, -0.45], [-0.15, 0.55], [0.3, 0.55]]) {
        ctx.beginPath(); ctx.arc(dx * u, dy * u, u * 0.32, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#c39bd3';
      ctx.beginPath(); ctx.arc(-u * 0.45, -u * 0.05, u * 0.08, 0, Math.PI * 2); ctx.fill();
      break;
    case 'cream':
      ctx.fillStyle = '#fff6e8';
      ctx.beginPath(); ctx.moveTo(-u * 0.7, u * 0.6); ctx.quadraticCurveTo(-u * 0.75, -u * 0.2, 0, -u * 0.85); ctx.quadraticCurveTo(u * 0.75, -u * 0.2, u * 0.7, u * 0.6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e8483f';
      ctx.beginPath(); ctx.arc(0, -u * 0.55, u * 0.14, 0, Math.PI * 2); ctx.fill();
      break;
    case 'pancake':
      ctx.fillStyle = '#eec27a';
      ctx.beginPath(); ctx.ellipse(0, u * 0.25, u, u * 0.45, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -u * 0.15, u * 0.9, u * 0.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c98a35';
      ctx.beginPath(); ctx.ellipse(0, -u * 0.35, u * 0.5, u * 0.18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8e44ad';
      ctx.beginPath(); ctx.arc(u * 0.4, -u * 0.45, u * 0.14, 0, Math.PI * 2); ctx.fill();
      break;
    case 'egg':
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(0, 0, u * 0.95, u * 0.7, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffb703';
      ctx.beginPath(); ctx.arc(u * 0.1, 0, u * 0.45, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffdf6b';
      ctx.beginPath(); ctx.arc(u * 0.05, -u * 0.05, u * 0.2, 0, Math.PI * 2); ctx.fill();
      break;
    default:
      break;
  }
  ctx.restore();
}

// ---- pieces ---------------------------------------------------------------

function drawKitchenShell(ctx, state) {
  // Wall tiles.
  ctx.fillStyle = '#f7e8d0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#f2ddba';
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      if ((x + y) % 2 === 0) ctx.fillRect(x * 80 + (y % 2 ? 40 : 0) - 40, y * 20, 78, 18);
    }
  }
  // Top bar.
  ctx.fillStyle = '#3d2b1f';
  ctx.fillRect(0, 0, W, 64);
  text(ctx, '🍳 SIZZLE & SERVE', 24, 33, 30, '#ffd166', 'left');
  text(ctx, `SCORE  ${state.score}`, 330, 33, 24, '#ffffff', 'left');
  text(ctx, `COINS  ${state.coins}`, 520, 33, 24, '#ffd166', 'left');
  text(ctx, `LEVEL  ${state.level}`, 700, 33, 24, '#ffffff', 'left');
  const mm = Math.floor(Math.max(0, state.shiftLeft) / 60);
  const ss = Math.floor(Math.max(0, state.shiftLeft) % 60).toString().padStart(2, '0');
  const urgent = state.shiftLeft <= 20 && state.screen === 'play';
  text(ctx, `⏱ SHIFT ${mm}:${ss}`, 880, 33, 24, urgent ? '#ff6b5e' : '#ffffff', 'left');
  text(ctx, '✖'.repeat(state.strikes) + '○'.repeat(3 - state.strikes), 1120, 33, 22, '#ff6b5e', 'left');
  text(ctx, state.muted ? '🔇 M' : '🔊 M', 1235, 33, 18, '#ffffff', 'right');
}

function drawOrderBoard(ctx, state) {
  text(ctx, '— ORDER BOARD —', 640, 70, 13, '#8a6d4b');
  LAYOUT.tickets.forEach((box, i) => {
    const order = state.orders[i];
    ctx.save();
    if (i === state.selectedOrder && state.screen === 'play') {
      ctx.shadowColor = '#ffb703';
      ctx.shadowBlur = 14;
    }
    ctx.fillStyle = order ? '#fffdf5' : '#e9dcc4';
    rr(ctx, box.x, box.y, box.w, box.h, 10);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#c9a86a';
    ctx.lineWidth = 2;
    rr(ctx, box.x, box.y, box.w, box.h, 10);
    ctx.stroke();
    if (!order) {
      text(ctx, 'Waiting for the next order…', box.x + box.w / 2, box.y + box.h / 2, 16, '#a08a68', 'center', '400');
      return;
    }
    const frac = Math.max(0, order.timeLeft / order.timeTotal);
    const urgent = order.timeLeft <= 10;
    text(ctx, `#${order.seq}  ${order.recipe.name}`, box.x + 16, box.y + 24, 20, '#3d2b1f', 'left');
    text(ctx, `${order.recipe.price} coins`, box.x + box.w - 16, box.y + 24, 16, '#b97a28', 'right');
    // Recipe icons.
    const need = order.recipe.needs;
    const iconW = 44;
    const startX = box.x + 16 + iconW / 2;
    need.forEach((id, k) => {
      drawIngredient(ctx, id, startX + k * (iconW + 6), box.y + 62, 40);
    });
    // Countdown bar.
    ctx.fillStyle = '#e5d9bd';
    rr(ctx, box.x + 16, box.y + 92, box.w - 32, 12, 6);
    ctx.fill();
    ctx.fillStyle = urgent ? '#e8483f' : frac > 0.5 ? '#7dc242' : '#ffb703';
    if (frac > 0) {
      rr(ctx, box.x + 16, box.y + 92, (box.w - 32) * frac, 12, 6);
      ctx.fill();
    }
    text(ctx, `${Math.ceil(order.timeLeft)}s`, box.x + box.w - 16, box.y + 62, 18, urgent ? '#e8483f' : '#6b5a44', 'right');
  });
}

function drawStation(ctx, box, title, sub, body) {
  ctx.fillStyle = '#8a6d4b';
  rr(ctx, box.x, box.y, box.w, box.h, 12);
  ctx.fill();
  ctx.fillStyle = '#a9805a';
  rr(ctx, box.x + 8, box.y + 8, box.w - 16, box.h - 16, 8);
  ctx.fill();
  text(ctx, title, box.x + box.w / 2, box.y + 26, 18, '#fff6e8');
  text(ctx, sub, box.x + box.w / 2, box.y + 48, 13, '#ffe1b0', 'center', '400');
  body(box.x + box.w / 2, box.y + 118);
}

function drawStations(ctx, state) {
  // Grill.
  drawStation(ctx, LAYOUT.grill, '🔥 GRILL', state.grill ? ingredientById(state.grill.id).name : 'click a grill item', (cx, cy) => {
    ctx.fillStyle = '#3d2b1f';
    rr(ctx, cx - 110, cy - 40, 220, 80, 10);
    ctx.fill();
    ctx.strokeStyle = '#5e4632';
    ctx.lineWidth = 4;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath(); ctx.moveTo(cx + i * 40, cy - 36); ctx.lineTo(cx + i * 40, cy + 36); ctx.stroke();
    }
    if (state.grill) {
      drawIngredient(ctx, state.grill.id, cx, cy, 64);
      const left = Math.max(0, state.grill.doneAt - state.now);
      text(ctx, left > 0 ? `grilling… ${left.toFixed(1)}s` : 'READY — click to plate!', cx, cy + 58, 15, left > 0 ? '#ffd166' : '#7dc242');
    } else {
      text(ctx, 'empty', cx, cy + 58, 15, '#d9c9a8', 'center', '400');
    }
  });
  // Chopping board.
  drawStation(ctx, LAYOUT.board, '🔪 CHOP BOARD', state.board ? ingredientById(state.board.id).name : 'click a chop item', (cx, cy) => {
    ctx.fillStyle = '#e8c890';
    rr(ctx, cx - 105, cy - 42, 210, 84, 8);
    ctx.fill();
    if (state.board) {
      drawIngredient(ctx, state.board.id, cx, cy, 64);
      text(ctx, `chop ${state.board.chopsLeft} more time${state.board.chopsLeft === 1 ? '' : 's'} — click here!`, cx, cy + 58, 15, '#3d2b1f');
    } else {
      text(ctx, 'empty', cx, cy + 58, 15, '#d9c9a8', 'center', '400');
    }
  });
  // Pot.
  drawStation(ctx, LAYOUT.pot, '🍲 POT', state.pot ? ingredientById(state.pot.id).name : 'click pasta to boil', (cx, cy) => {
    ctx.fillStyle = '#4a4a52';
    ctx.beginPath(); ctx.ellipse(cx, cy + 10, 105, 48, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b6b75';
    ctx.beginPath(); ctx.ellipse(cx, cy - 6, 105, 36, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8ecae6';
    ctx.beginPath(); ctx.ellipse(cx, cy - 6, 88, 26, 0, 0, Math.PI * 2); ctx.fill();
    if (state.pot) {
      drawIngredient(ctx, state.pot.id, cx, cy - 6, 56);
      const left = Math.max(0, state.pot.doneAt - state.now);
      text(ctx, left > 0 ? `boiling… ${left.toFixed(1)}s` : 'READY — click to plate!', cx, cy + 58, 15, left > 0 ? '#ffd166' : '#7dc242');
    } else {
      text(ctx, 'empty', cx, cy + 58, 15, '#d9c9a8', 'center', '400');
    }
  });
  // Plate / assembly.
  const p = LAYOUT.plate;
  ctx.fillStyle = '#8a6d4b';
  rr(ctx, p.x, p.y, p.w, p.h, 12);
  ctx.fill();
  ctx.fillStyle = '#f7e8d0';
  rr(ctx, p.x + 8, p.y + 8, p.w - 16, p.h - 16, 8);
  ctx.fill();
  text(ctx, '🍽 YOUR PLATE', p.x + p.w / 2, p.y + 26, 18, '#3d2b1f');
  // White plate.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(p.x + p.w / 2, p.y + 118, 105, 58, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d9c9a8'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(p.x + p.w / 2, p.y + 118, 88, 46, 0, 0, Math.PI * 2); ctx.stroke();
  const plate = state.plate;
  if (plate.length === 0) {
    text(ctx, 'add ingredients', p.x + p.w / 2, p.y + 118, 14, '#a08a68', 'center', '400');
  } else {
    // Stack the plated ingredients, newest on top, staggered so each shows.
    plate.forEach((id, i) => {
      const yy = p.y + 118 + 18 - i * 14;
      const xx = p.x + p.w / 2 + (i % 2 === 0 ? -14 : 14);
      drawIngredient(ctx, id, xx, yy, 52);
    });
  }
  // Serve / clear buttons.
  const s = LAYOUT.serve;
  const ready = plate.length > 0;
  ctx.fillStyle = ready ? '#2a9d3f' : '#9db39a';
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  text(ctx, 'SERVE  ⏎', s.x + s.w / 2, s.y + s.h / 2 + 1, 24, '#ffffff');
  const c = LAYOUT.clear;
  ctx.fillStyle = '#e8483f';
  rr(ctx, c.x, c.y, c.w, c.h, 8);
  ctx.fill();
  text(ctx, 'CLEAR (C)', c.x + c.w / 2, c.y + c.h / 2, 15, '#ffffff');
  const t = LAYOUT.trash;
  ctx.fillStyle = '#6b5a44';
  rr(ctx, t.x, t.y, t.w, t.h, 8);
  ctx.fill();
  text(ctx, 'TRASH = CLEAR', t.x + t.w / 2, t.y + t.h / 2, 13, '#ffffff');
}

function drawCounter(ctx, state) {
  const bins = ingredientBins();
  text(ctx, '— INGREDIENT COUNTER —  click an ingredient (or press its key) to add it to your plate  —', 640, 566, 14, '#8a6d4b');
  bins.forEach((bin) => {
    const ing = state.plate ? INGREDIENTS[bin.index] : null;
    ctx.fillStyle = '#fffdf5';
    rr(ctx, bin.x, bin.y, bin.w, bin.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#c9a86a';
    ctx.lineWidth = 2;
    rr(ctx, bin.x, bin.y, bin.w, bin.h, 10);
    ctx.stroke();
    drawIngredient(ctx, ing.id, bin.x + bin.w / 2, bin.y + 52, 56);
    text(ctx, ing.name, bin.x + bin.w / 2, bin.y + 102, 15, '#3d2b1f');
    text(ctx, `[${ing.key}]  ${PREP_LABEL[ing.prep]}`, bin.x + bin.w / 2, bin.y + 124, 12, '#8a6d4b', 'center', '400');
  });
  text(ctx, 'Keys: 1–0 ingredients · Enter serve · C clear plate · Tab switch order · R restart · M mute', 640, 738, 14, '#6b5a44', 'center', '400');
  if (state.message && state.now < state.messageUntil) {
    ctx.fillStyle = 'rgba(61,43,31,0.92)';
    const mw = Math.min(900, ctx.measureText(state.message).width + 48);
    rr(ctx, 640 - mw / 2, 760, mw, 32, 16);
    ctx.fill();
    text(ctx, state.message, 640, 777, 16, '#ffd166');
  }
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(61,43,31,0.82)';
  ctx.fillRect(0, 64, W, H - 64);
  ctx.fillStyle = '#fff6e8';
  rr(ctx, 240, 120, 800, 520, 20);
  ctx.fill();
  text(ctx, '🍳 SIZZLE & SERVE', 640, 190, 52, '#e8483f');
  text(ctx, 'A tiny kitchen, a big dinner rush', 640, 238, 22, '#6b5a44', 'center', '400');
  text(ctx, 'Orders fly in on the board. Grill it, chop it, boil it,', 640, 300, 19, '#3d2b1f', 'center', '400');
  text(ctx, 'stack it on the plate and SERVE before the timer runs out.', 640, 330, 19, '#3d2b1f', 'center', '400');
  text(ctx, '3 strikes and the shift ends. Every 5 dishes: faster orders!', 640, 360, 19, '#3d2b1f', 'center', '400');
  text(ctx, '6 original recipes · 10 ingredients · combos pay extra', 640, 400, 17, '#b97a28', 'center', '400');
  const b = LAYOUT.start;
  ctx.fillStyle = '#2a9d3f';
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  text(ctx, '▶  START SHIFT', b.x + b.w / 2, b.y + b.h / 2 + 1, 26, '#ffffff');
  text(ctx, 'Click START or press Enter · 150-second shift', 640, 660, 15, '#8a6d4b', 'center', '400');
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(61,43,31,0.82)';
  ctx.fillRect(0, 64, W, H - 64);
  ctx.fillStyle = '#fff6e8';
  rr(ctx, 240, 130, 800, 500, 20);
  ctx.fill();
  text(ctx, 'SHIFT OVER', 640, 200, 48, '#e8483f');
  text(ctx, state.overReason, 640, 252, 19, '#3d2b1f', 'center', '400');
  text(ctx, `FINAL SCORE  ${state.score}`, 640, 330, 30, '#b97a28');
  text(ctx, `Dishes served: ${state.served}    Best combo: ×${state.bestCombo}    Level reached: ${state.level}`, 640, 380, 19, '#6b5a44', 'center', '400');
  const grade = state.served >= 15 ? 'HEAD CHEF!' : state.served >= 8 ? 'SOUS CHEF!' : state.served >= 4 ? 'LINE COOK!' : 'APPRENTICE — keep practicing!';
  text(ctx, grade, 640, 430, 26, '#2a9d3f');
  const b = LAYOUT.restart;
  ctx.fillStyle = '#2a9d3f';
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  text(ctx, '↻  COOK AGAIN', b.x + b.w / 2, b.y + b.h / 2 + 1, 26, '#ffffff');
  text(ctx, 'Click COOK AGAIN or press R', 640, 660, 15, '#8a6d4b', 'center', '400');
}

export function drawGame(ctx, state) {
  drawKitchenShell(ctx, state);
  if (state.screen === SCREEN.TITLE) {
    drawOrderBoard(ctx, { ...state, orders: [] });
    drawStations(ctx, state);
    drawCounter(ctx, state);
    drawTitle(ctx, state);
  } else if (state.screen === SCREEN.OVER) {
    drawOrderBoard(ctx, state);
    drawStations(ctx, state);
    drawCounter(ctx, state);
    drawGameOver(ctx, state);
  } else {
    drawOrderBoard(ctx, state);
    drawStations(ctx, state);
    drawCounter(ctx, state);
  }
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255,60,40,${state.flash * 0.5})`;
    ctx.fillRect(0, 0, W, H);
  }
}

export function hitZones(state) {
  const zones = [];
  if (state.screen === SCREEN.TITLE) {
    zones.push({ kind: 'start', ...LAYOUT.start });
    return zones;
  }
  if (state.screen === SCREEN.OVER) {
    zones.push({ kind: 'restart', ...LAYOUT.restart });
    return zones;
  }
  LAYOUT.tickets.forEach((box, i) => zones.push({ kind: 'ticket', index: i, ...box }));
  zones.push({ kind: 'grill', ...LAYOUT.grill });
  zones.push({ kind: 'board', ...LAYOUT.board });
  zones.push({ kind: 'pot', ...LAYOUT.pot });
  zones.push({ kind: 'serve', ...LAYOUT.serve });
  zones.push({ kind: 'clear', ...LAYOUT.clear });
  ingredientBins().forEach((bin) => {
    zones.push({ kind: 'ingredient', index: bin.index, ...bin });
  });
  return zones;
}
