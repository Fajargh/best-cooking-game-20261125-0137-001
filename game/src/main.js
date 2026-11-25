// main.js — Sizzle & Serve bootstrap: canvas setup, input, game loop,
// and ?demo= states that stage the game for screenshots (real renders).

import { W, H, drawGame, hitZones, LAYOUT, ingredientBins } from './render.js';
import {
  newGameState, startShift, update, takeIngredient, chopBoard,
  collectStation, clearPlate, servePlate, endShift, SCREEN,
} from './game.js';
import { INGREDIENTS, recipeById } from './recipes.js';
import * as sfx from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

const state = newGameState();
const params = new URLSearchParams(window.location.search);

// ---- demo states for screenshots (the game itself, staged) ----------------
function stageDemo(kind) {
  startShift(state);
  state.now = 0;
  if (kind === 'play') {
    // Two orders live, one dish half-built on the plate, grill working.
    state.orders = [
      { seq: 1, recipe: recipeById('sunny-burger'), timeLeft: 24, timeTotal: 36, bornAt: 0 },
      { seq: 2, recipe: recipeById('tomato-pasta'), timeLeft: 14, timeTotal: 32, bornAt: 0 },
    ];
    state.plate = ['bun', 'cheese'];
    state.grill = { id: 'patty', doneAt: 2.5 };
    state.shiftLeft = 118;
    state.score = 340;
    state.coins = 340;
    state.served = 3;
    state.level = 1;
    state.message = 'Burger needs the patty + lettuce — patty is on the grill!';
    state.messageUntil = 9999;
  } else if (kind === 'serve') {
    // Plate complete and matching the selected order: ready to serve.
    state.orders = [
      { seq: 1, recipe: recipeById('sunny-burger'), timeLeft: 19, timeTotal: 36, bornAt: 0 },
      { seq: 2, recipe: recipeById('berry-stack'), timeLeft: 27, timeTotal: 34, bornAt: 0 },
    ];
    state.plate = ['bun', 'patty', 'cheese', 'lettuce'];
    state.shiftLeft = 96;
    state.score = 610;
    state.coins = 610;
    state.served = 5;
    state.level = 2;
    state.combo = 2;
    state.message = 'Sunny Burger complete — hit SERVE before the timer runs out!';
    state.messageUntil = 9999;
  } else if (kind === 'over') {
    state.screen = SCREEN.OVER;
    state.score = 1240;
    state.coins = 1240;
    state.served = 9;
    state.bestCombo = 3;
    state.level = 2;
    state.strikes = 3;
    state.overReason = 'Three strikes — the dinner rush got the better of you!';
    state.shiftLeft = 0;
    state.message = '';
    state.messageUntil = 0;
    state.orders = [
      { seq: 4, recipe: recipeById('garden-salad'), timeLeft: 8, timeTotal: 30, bornAt: 0 },
    ];
  }
  state.now = 0;
}

const demo = params.get('demo');
if (demo === 'play' || demo === 'serve' || demo === 'over') {
  stageDemo(demo);
}

// ---- input ----------------------------------------------------------------

function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * W,
    y: ((e.clientY - rect.top) / rect.height) * H,
  };
}

function clickAt(x, y) {
  const zones = hitZones(state);
  for (let i = zones.length - 1; i >= 0; i -= 1) {
    const z = zones[i];
    if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) {
      handleZone(z);
      return;
    }
  }
}

function handleZone(z) {
  sfx.ensureAudio();
  if (z.kind === 'start') { startShift(state); sfx.sfxDing(); return; }
  if (z.kind === 'restart') { startShift(state); sfx.sfxDing(); return; }
  if (state.screen !== SCREEN.PLAY) return;
  if (z.kind === 'ticket') { state.selectedOrder = Math.min(z.index, state.orders.length - 1); sfx.sfxPick(); return; }
  if (z.kind === 'ingredient') { takeIngredient(state, INGREDIENTS[z.index].id); return; }
  if (z.kind === 'board') { chopBoard(state); return; }
  if (z.kind === 'grill') { collectStation(state, 'grill'); return; }
  if (z.kind === 'pot') { collectStation(state, 'pot'); return; }
  if (z.kind === 'serve') { servePlate(state); return; }
  if (z.kind === 'clear') { clearPlate(state); }
}

canvas.addEventListener('click', (e) => {
  const p = canvasPoint(e);
  clickAt(p.x, p.y);
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (state.screen === SCREEN.TITLE) { startShift(state); sfx.sfxDing(); }
    else if (state.screen === SCREEN.PLAY) servePlate(state);
    return;
  }
  if (e.key === 'r' || e.key === 'R') {
    if (state.screen !== SCREEN.TITLE) startShift(state);
    return;
  }
  if (e.key === 'm' || e.key === 'M') {
    state.muted = sfx.toggleMute();
    return;
  }
  if (state.screen !== SCREEN.PLAY) return;
  if (e.key === 'c' || e.key === 'C') { clearPlate(state); return; }
  if (e.key === 'Tab') {
    e.preventDefault();
    if (state.orders.length > 0) state.selectedOrder = (state.selectedOrder + 1) % state.orders.length;
    return;
  }
  const ing = INGREDIENTS.find((i) => i.key === e.key);
  if (ing) takeIngredient(state, ing.id);
});

// ---- loop -----------------------------------------------------------------

let last = performance.now();
function frame(t) {
  const dt = Math.min(0.1, (t - last) / 1000);
  last = t;
  // Demo screenshots stay frozen in their staged state.
  if (!demo) update(state, dt);
  drawGame(ctx, state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Expose a tiny handle for play-testing from the console.
window.__sizzle = { state, startShift, servePlate, takeIngredient };
