// recipes.js — every dish, ingredient and prep rule for Sizzle & Serve.
// All names, recipes and art are original, made for this game.

export const INGREDIENTS = [
  { id: 'bun',     name: 'Bun',      key: '1', color: '#e8a54b', dark: '#b97a28', prep: 'none',  emoji: '🍞' },
  { id: 'patty',   name: 'Patty',    key: '2', color: '#8a5a33', dark: '#5e3a1e', prep: 'grill', emoji: '🥩' },
  { id: 'cheese',  name: 'Cheese',   key: '3', color: '#ffc93c', dark: '#d99e12', prep: 'none',  emoji: '🧀' },
  { id: 'lettuce', name: 'Lettuce',  key: '4', color: '#7dc242', dark: '#4d8a24', prep: 'chop',  emoji: '🥬' },
  { id: 'tomato',  name: 'Tomato',   key: '5', color: '#e8483f', dark: '#b02a24', prep: 'chop',  emoji: '🍅' },
  { id: 'pasta',   name: 'Pasta',    key: '6', color: '#f2d38a', dark: '#c9a24e', prep: 'boil',  emoji: '🍝' },
  { id: 'berry',   name: 'Berries',  key: '7', color: '#8e44ad', dark: '#5e2a73', prep: 'none',  emoji: '🫐' },
  { id: 'cream',   name: 'Cream',    key: '8', color: '#fff6e8', dark: '#d9c9a8', prep: 'none',  emoji: '🍦' },
  { id: 'pancake', name: 'Pancake',  key: '9', color: '#eec27a', dark: '#b98a3e', prep: 'grill', emoji: '🥞' },
  { id: 'egg',     name: 'Egg',      key: '0', color: '#ffe9a8', dark: '#d9b45c', prep: 'grill', emoji: '🍳' },
];

export const PREP_LABEL = {
  none: 'Ready',
  grill: 'Grill 3s',
  chop: 'Chop ×3',
  boil: 'Boil 4s',
};

export const RECIPES = [
  {
    id: 'sunny-burger',
    name: 'Sunny Burger',
    needs: ['bun', 'patty', 'cheese', 'lettuce'],
    price: 120,
    color: '#e8a54b',
  },
  {
    id: 'garden-salad',
    name: 'Garden Salad',
    needs: ['lettuce', 'tomato', 'cheese'],
    price: 90,
    color: '#7dc242',
  },
  {
    id: 'tomato-pasta',
    name: 'Tomato Pasta',
    needs: ['pasta', 'tomato', 'cheese'],
    price: 110,
    color: '#e8483f',
  },
  {
    id: 'berry-stack',
    name: 'Berry Stack',
    needs: ['pancake', 'berry', 'cream'],
    price: 100,
    color: '#8e44ad',
  },
  {
    id: 'sunrise-plate',
    name: 'Sunrise Plate',
    needs: ['egg', 'bun', 'tomato'],
    price: 95,
    color: '#ffc93c',
  },
  {
    id: 'double-decker',
    name: 'Double Decker',
    needs: ['bun', 'patty', 'patty', 'cheese', 'tomato'],
    price: 180,
    color: '#8a5a33',
  },
];

export function ingredientById(id) {
  return INGREDIENTS.find((i) => i.id === id);
}

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

// Pick a recipe for a new order. Early levels use the simple dishes;
// harder dishes unlock as the level rises.
export function pickRecipe(level, rng) {
  const pool = level >= 4 ? RECIPES : level >= 2 ? RECIPES.slice(0, 5) : RECIPES.slice(0, 3);
  return pool[Math.floor(rng() * pool.length)];
}

// Order time shrinks as levels rise, never below 18 seconds.
export function orderTimeFor(level) {
  return Math.max(18, 38 - level * 2);
}

export function sameMultiset(a, b) {
  if (a.length !== b.length) return false;
  const count = (arr) => {
    const m = new Map();
    for (const x of arr) m.set(x, (m.get(x) || 0) + 1);
    return m;
  };
  const ca = count(a);
  const cb = count(b);
  if (ca.size !== cb.size) return false;
  for (const [k, v] of ca) if (cb.get(k) !== v) return false;
  return true;
}
