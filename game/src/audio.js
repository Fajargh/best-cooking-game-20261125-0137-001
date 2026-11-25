// audio.js — tiny synthesized sound effects, no audio files needed.
// Everything is generated with the Web Audio API so the game stays offline.

let ctx = null;
let muted = false;

export function ensureAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function sfxPick() {
  tone(520, 0.07, 'triangle', 0.18);
}

export function sfxChop() {
  tone(180, 0.06, 'square', 0.16, 0, 90);
  tone(140, 0.05, 'square', 0.12, 0.05, 70);
}

export function sfxSizzle() {
  tone(1200, 0.25, 'sawtooth', 0.05, 0, 300);
  tone(900, 0.2, 'sawtooth', 0.04, 0.08, 240);
}

export function sfxDing() {
  tone(880, 0.12, 'sine', 0.2);
  tone(1318, 0.18, 'sine', 0.2, 0.1);
}

export function sfxServe() {
  tone(523, 0.1, 'triangle', 0.2);
  tone(659, 0.1, 'triangle', 0.2, 0.09);
  tone(784, 0.22, 'triangle', 0.22, 0.18);
}

export function sfxBad() {
  tone(220, 0.18, 'sawtooth', 0.14, 0, 110);
}

export function sfxTick() {
  tone(1000, 0.04, 'square', 0.07);
}

export function sfxLevelUp() {
  tone(523, 0.1, 'triangle', 0.2);
  tone(659, 0.1, 'triangle', 0.2, 0.09);
  tone(784, 0.1, 'triangle', 0.2, 0.18);
  tone(1046, 0.25, 'triangle', 0.22, 0.27);
}

export function sfxGameOver() {
  tone(392, 0.2, 'triangle', 0.2);
  tone(330, 0.2, 'triangle', 0.2, 0.18);
  tone(262, 0.45, 'triangle', 0.22, 0.36);
}
