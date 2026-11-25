// game.js — Sizzle & Serve state, orders, prep stations and scoring.
// One job: the rules. Drawing lives in render.js, input in main.js.

import {
  INGREDIENTS, RECIPES, ingredientById, pickRecipe, orderTimeFor, sameMultiset,
} from './recipes.js';
import * as sfx from './audio.js';

export const SCREEN = { TITLE: 'title', PLAY: 'play', OVER: 'over' };
export const SHIFT_SECONDS = 150;
export const MAX_STRIKES = 3;
export const MAX_ORDERS = 3;

let orderSeq = 0;

export function newGameState() {
  return {
    screen: SCREEN.TITLE,
    score: 0,
    coins: 0,
    served: 0,
    strikes: 0,
    level: 1,
    shiftLeft: SHIFT_SECONDS,
    orders: [],
    plate: [],
    grill: null, // { id, doneAt }
    board: null, // { id, chopsLeft }
    pot: null,   // { id, doneAt }
    selectedOrder: 0,
    message: '',
    messageUntil: 0,
    combo: 0,
    bestCombo: 0,
    now: 0,
    overReason: '',
    muted: false,
    flash: 0,
  };
}

export function startShift(state) {
  state.screen = SCREEN.PLAY;
  state.score = 0;
  state.coins = 0;
  state.served = 0;
  state.strikes = 0;
  state.level = 1;
  state.shiftLeft = SHIFT_SECONDS;
  state.orders = [];
  state.plate = [];
  state.grill = null;
  state.board = null;
  state.pot = null;
  state.selectedOrder = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.message = 'Shift started — serve every order before its timer runs out!';
  state.messageUntil = state.now + 3;
  state.overReason = '';
  spawnOrder(state);
  spawnOrder(state);
}

export function spawnOrder(state) {
  if (state.orders.length >= MAX_ORDERS) return;
  const recipe = pickRecipe(state.level, Math.random);
  const total = orderTimeFor(state.level);
  state.orders.push({
    seq: ++orderSeq,
    recipe,
    timeLeft: total,
    timeTotal: total,
    bornAt: state.now,
  });
}

function showMessage(state, text, seconds = 2.2) {
  state.message = text;
  state.messageUntil = state.now + seconds;
}

export function addStrike(state, reason) {
  state.strikes += 1;
  state.combo = 0;
  state.flash = 0.35;
  sfx.sfxBad();
  showMessage(state, reason, 2.2);
  if (state.strikes >= MAX_STRIKES) endShift(state, 'Three strikes — the dinner rush got the better of you!');
}

export function endShift(state, reason) {
  state.screen = SCREEN.OVER;
  state.overReason = reason;
  sfx.sfxGameOver();
}

// ---- prep stations -------------------------------------------------------

export function stationBusy(state) {
  return {
    grill: !!state.grill,
    board: !!state.board,
    pot: !!state.pot,
  };
}

// Click (or press the key for) an ingredient on the counter.
export function takeIngredient(state, id) {
  if (state.screen !== SCREEN.PLAY) return;
  const ing = ingredientById(id);
  if (!ing) return;
  sfx.ensureAudio();
  if (ing.prep === 'none') {
    state.plate.push(id);
    sfx.sfxPick();
    showMessage(state, `${ing.name} on the plate.`, 1.2);
    return;
  }
  if (ing.prep === 'grill') {
    if (state.grill) { showMessage(state, 'The grill is busy!', 1.4); sfx.sfxBad(); return; }
    state.grill = { id, doneAt: state.now + 3 };
    sfx.sfxSizzle();
    showMessage(state, `${ing.name} on the grill — wait for the sizzle to finish!`, 1.6);
    return;
  }
  if (ing.prep === 'chop') {
    if (state.board) { showMessage(state, 'The chopping board is busy!', 1.4); sfx.sfxBad(); return; }
    state.board = { id, chopsLeft: 3 };
    sfx.sfxChop();
    showMessage(state, `${ing.name} on the board — chop it 3 times!`, 1.6);
    return;
  }
  if (ing.prep === 'boil') {
    if (state.pot) { showMessage(state, 'The pot is busy!', 1.4); sfx.sfxBad(); return; }
    state.pot = { id, doneAt: state.now + 4 };
    sfx.sfxSizzle();
    showMessage(state, `${ing.name} in the pot — boiling!`, 1.6);
  }
}

export function chopBoard(state) {
  if (!state.board) return;
  state.board.chopsLeft -= 1;
  sfx.sfxChop();
  if (state.board.chopsLeft <= 0) {
    state.plate.push(state.board.id);
    const name = ingredientById(state.board.id).name;
    state.board = null;
    sfx.sfxDing();
    showMessage(state, `${name} chopped and plated!`, 1.4);
  }
}

export function collectStation(state, which) {
  if (which === 'grill' && state.grill && state.now >= state.grill.doneAt) {
    state.plate.push(state.grill.id);
    const name = ingredientById(state.grill.id).name;
    state.grill = null;
    sfx.sfxDing();
    showMessage(state, `${name} grilled and plated!`, 1.4);
  } else if (which === 'pot' && state.pot && state.now >= state.pot.doneAt) {
    state.plate.push(state.pot.id);
    const name = ingredientById(state.pot.id).name;
    state.pot = null;
    sfx.sfxDing();
    showMessage(state, `${name} boiled and plated!`, 1.4);
  } else if (which === 'grill' || which === 'pot') {
    showMessage(state, 'Not ready yet — wait for the timer ring!', 1.2);
  }
}

export function clearPlate(state) {
  if (state.plate.length === 0) return;
  state.plate = [];
  sfx.sfxPick();
  showMessage(state, 'Plate cleared.', 1.0);
}

// ---- serving -------------------------------------------------------------

export function servePlate(state) {
  if (state.screen !== SCREEN.PLAY) return;
  if (state.plate.length === 0) {
    showMessage(state, 'The plate is empty — add ingredients first!', 1.6);
    return;
  }
  const order = state.orders[state.selectedOrder] || state.orders[0];
  if (!order) {
    showMessage(state, 'No orders right now!', 1.4);
    return;
  }
  if (sameMultiset(state.plate, order.recipe.needs)) {
    const timeBonus = Math.round((order.timeLeft / order.timeTotal) * 50);
    const comboBonus = state.combo * 10;
    const earned = order.recipe.price + timeBonus + comboBonus;
    state.score += earned;
    state.coins += earned;
    state.served += 1;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.orders.splice(state.orders.indexOf(order), 1);
    state.plate = [];
    state.selectedOrder = 0;
    state.flash = 0.3;
    sfx.sfxServe();
    showMessage(state, `Served ${order.recipe.name}! +${earned} coins${state.combo > 1 ? ` (combo ×${state.combo})` : ''}`, 2.4);
    const newLevel = 1 + Math.floor(state.served / 5);
    if (newLevel > state.level) {
      state.level = newLevel;
      sfx.sfxLevelUp();
      showMessage(state, `Level ${newLevel}! Orders come faster now.`, 2.6);
    }
    spawnOrder(state);
  } else {
    addStrike(state, 'Wrong dish! That plate does not match the order.');
    state.plate = [];
  }
}

// ---- per-frame update ----------------------------------------------------

export function update(state, dt) {
  state.now += dt;
  if (state.flash > 0) state.flash = Math.max(0, state.flash - dt);
  if (state.screen !== SCREEN.PLAY) return;

  state.shiftLeft -= dt;
  if (state.shiftLeft <= 0) {
    state.shiftLeft = 0;
    endShift(state, 'Shift over! The kitchen closes — great cooking!');
    return;
  }

  // Order countdowns.
  for (let i = state.orders.length - 1; i >= 0; i -= 1) {
    const o = state.orders[i];
    o.timeLeft -= dt;
    if (o.timeLeft <= 10 && Math.ceil(o.timeLeft) !== Math.ceil(o.timeLeft + dt)) sfx.sfxTick();
    if (o.timeLeft <= 0) {
      state.orders.splice(i, 1);
      addStrike(state, `Too late! The ${o.recipe.name} order walked out.`);
      if (state.screen !== SCREEN.PLAY) return;
      spawnOrder(state);
    }
  }

  // New orders trickle in.
  if (state.orders.length < MAX_ORDERS && Math.random() < dt * 0.12) spawnOrder(state);

  // Finished prep rings once.
  if (state.grill && state.now >= state.grill.doneAt && !state.grill.rang) {
    state.grill.rang = true;
    sfx.sfxDing();
  }
  if (state.pot && state.now >= state.pot.doneAt && !state.pot.rang) {
    state.pot.rang = true;
    sfx.sfxDing();
  }
}

export { INGREDIENTS, RECIPES };
