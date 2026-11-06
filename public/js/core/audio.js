/**
 * Suoni chiptune generati al volo con la Web Audio API (nessun file audio).
 * Sfx.play('shot') ecc. La musica di sottofondo è una piccola sequenza in loop.
 */
(function () {
  'use strict';

  let ctx = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
  let muted = false;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.22; musicBus.connect(master);
    // Rumore bianco riutilizzabile (esplosioni, spari)
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  /** Nota a onda quadra/triangolare con inviluppo e glissando. */
  function tone(type, f0, f1, dur, vol, when, bus) {
    const t = ctx.currentTime + (when || 0);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(bus || sfxBus);
    o.start(t); o.stop(t + dur + 0.02);
  }

  /** Rumore filtrato (passa-basso che si chiude) */
  function noise(dur, vol, fStart, fEnd, when) {
    const t = ctx.currentTime + (when || 0);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(fStart, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(40, fEnd), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    src.connect(f); f.connect(g); g.connect(sfxBus);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }

  const N = (n) => 440 * Math.pow(2, (n - 69) / 12); // numero MIDI -> Hz

  const SOUNDS = {
    shot() { tone('square', 880, 140, 0.09, 0.18); noise(0.07, 0.25, 6000, 800); },
    empty() { tone('square', 160, 120, 0.05, 0.12); tone('square', 120, 90, 0.05, 0.1, 0.06); },
    explosion() {
      noise(0.9, 0.9, 2400, 60);
      tone('triangle', 120, 30, 0.6, 0.6);
      tone('square', 70, 30, 0.35, 0.25);
    },
    small_explosion() { noise(0.45, 0.6, 3000, 90); tone('triangle', 160, 40, 0.35, 0.4); },
    death() {
      tone('square', 600, 80, 0.45, 0.16);
      tone('square', 300, 40, 0.5, 0.1, 0.05);
    },
    hit_shield() { tone('square', 1400, 900, 0.08, 0.14); tone('triangle', 2000, 1500, 0.15, 0.12, 0.04); },
    pickup_ammo() { [0, 4, 7].forEach((n, i) => tone('square', N(72 + n), null, 0.06, 0.14, i * 0.05)); },
    pickup_power() { [0, 4, 7, 12, 16].forEach((n, i) => tone('square', N(76 + n), null, 0.06, 0.13, i * 0.04)); },
    flash() { tone('sawtooth', 200, 1600, 0.3, 0.12); tone('square', 400, 2400, 0.25, 0.08, 0.05); },
    shield() { tone('triangle', 300, 900, 0.3, 0.2); tone('square', 600, 1200, 0.25, 0.06, 0.1); },
    throw() { tone('triangle', 500, 250, 0.15, 0.15); },
    bounce() { tone('square', 300, 280, 0.03, 0.08); },
    respawn() { [0, 7, 12].forEach((n, i) => tone('triangle', N(60 + n), null, 0.08, 0.2, i * 0.06)); },
    beep() { tone('square', N(72), null, 0.12, 0.18); },
    go() { tone('square', N(84), null, 0.35, 0.2); tone('square', N(79), null, 0.35, 0.12); },
    join() { tone('square', N(67), null, 0.06, 0.15); tone('square', N(74), null, 0.1, 0.15, 0.07); },
    tick() { tone('square', N(96), null, 0.03, 0.06); },
    start_jingle() {
      const mel = [[67, 0.1], [72, 0.1], [76, 0.1], [79, 0.25], [76, 0.1], [79, 0.4]];
      let t = 0;
      for (const [n, d] of mel) { tone('square', N(n), null, d * 0.95, 0.16, t); tone('triangle', N(n - 24), null, d, 0.25, t); t += d; }
    },
    win_jingle() {
      const mel = [[72, 0.12], [72, 0.12], [72, 0.12], [72, 0.36], [68, 0.36], [70, 0.36], [72, 0.24], [70, 0.12], [72, 0.7]];
      let t = 0;
      for (const [n, d] of mel) {
        tone('square', N(n), null, d * 0.9, 0.17, t);
        tone('square', N(n - 5), null, d * 0.9, 0.07, t);
        tone('triangle', N(n - 24), null, d, 0.3, t);
        t += d;
      }
    },
  };

  let lastPlay = {};
  function play(name) {
    if (!ctx || muted || !SOUNDS[name]) return;
    // evita che lo stesso suono si accavalli troppe volte nello stesso istante
    const now = performance.now();
    if (lastPlay[name] && now - lastPlay[name] < 25) return;
    lastPlay[name] = now;
    try { SOUNDS[name](); } catch (e) { /* audio non disponibile */ }
  }

  // --- Voce dell'annunciatore (sintesi vocale del browser, se presente) ---
  function announce(text, opts) {
    if (muted || !('speechSynthesis' in window)) return;
    opts = opts || {};
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = opts.lang || 'en-US';
      u.rate = opts.rate || 0.95;
      u.pitch = opts.pitch != null ? opts.pitch : 0.4;  // voce bassa "da arcade"
      u.volume = 1;
      speechSynthesis.speak(u);
    } catch (e) { /* ignora */ }
  }

  // --- Musica: giro di basso + melodia in loop, programmato in anticipo ---
  // Ogni gioco può avere il suo tema (Sfx.startMusic('farm')).
  const THEMES = {
    // Soldatini Arena: marcetta militare
    army: {
      bpm: 150, leadFrom: 32, leadWave: 'square',
      bass: [40, 40, 52, 40, 43, 43, 55, 43, 38, 38, 50, 38, 45, 45, 47, 45],
      lead: [64, 0, 67, 0, 71, 0, 67, 64, 62, 0, 67, 0, 69, 0, 71, 0, 64, 0, 67, 0, 72, 0, 71, 67, 69, 0, 67, 0, 64, 0, 62, 0],
      snare: [2],
    },
    // Holy Sheep: polka di campagna
    farm: {
      bpm: 168, leadFrom: 0, leadWave: 'square',
      bass: [48, 0, 55, 0, 48, 0, 55, 0, 53, 0, 60, 0, 55, 0, 59, 0],
      lead: [72, 74, 76, 72, 76, 0, 79, 0, 77, 76, 74, 72, 74, 0, 67, 0, 72, 74, 76, 77, 79, 0, 79, 0, 81, 79, 77, 74, 72, 0, 0, 0],
      snare: [1, 3],
    },
    // The Billionaire: tensione da quiz televisivo (tema originale, basso che pulsa)
    quiz: {
      bpm: 104, leadFrom: 16, leadWave: 'triangle',
      bass: [38, 38, 0, 38, 38, 0, 38, 0, 36, 36, 0, 36, 36, 0, 36, 0],
      lead: [0, 0, 0, 0, 0, 0, 0, 0, 62, 0, 0, 65, 0, 0, 69, 0, 0, 0, 0, 0, 0, 0, 0, 0, 68, 0, 0, 64, 0, 0, 61, 0],
      snare: [],
    },
    // Pippo Kart: corsa
    race: {
      bpm: 176, leadFrom: 16, leadWave: 'square',
      bass: [45, 45, 57, 45, 45, 57, 45, 57, 41, 41, 53, 41, 43, 43, 55, 43],
      lead: [69, 0, 72, 76, 0, 74, 72, 0, 69, 0, 72, 74, 76, 0, 79, 0, 77, 0, 76, 74, 0, 72, 74, 0, 76, 0, 72, 0, 69, 0, 0, 0],
      snare: [2],
    },
  };
  let musicTimer = null, nextBeat = 0, step = 0, theme = THEMES.army;

  function scheduleMusic() {
    const STEP = 60 / theme.bpm / 2; // crome
    while (nextBeat < ctx.currentTime + 0.2) {
      const when = nextBeat - ctx.currentTime;
      const b = theme.bass[step % theme.bass.length];
      if (b) tone('triangle', N(b), null, STEP * 0.9, 0.5, when, musicBus);
      const l = theme.lead[step % theme.lead.length];
      if (l && step % 64 >= theme.leadFrom) tone(theme.leadWave, N(l), null, STEP * 0.8, 0.12, when, musicBus);
      if (theme.snare.includes(step % 4)) { // rullante
        const t = ctx.currentTime + when;
        const src = ctx.createBufferSource(); src.buffer = noiseBuf;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        src.connect(g); g.connect(musicBus); src.start(t, Math.random()); src.stop(t + 0.1);
      }
      nextBeat += STEP; step++;
    }
  }
  function startMusic(name) {
    if (!ctx) return;
    theme = THEMES[name] || THEMES.army;
    if (musicTimer) return;
    nextBeat = ctx.currentTime + 0.1; step = 0;
    musicTimer = setInterval(scheduleMusic, 50);
  }
  function stopMusic() { clearInterval(musicTimer); musicTimer = null; }

  /** Un gioco può aggiungere i suoi effetti: Sfx.register('bark', (lib) => {...}) */
  function register(name, fn) { SOUNDS[name] = () => fn({ tone, noise, N, ctx }); }

  function toggleMute() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : 0.55;
    if (muted && 'speechSynthesis' in window) speechSynthesis.cancel();
    return muted;
  }

  window.Sfx = { init, play, announce, startMusic, stopMusic, toggleMute, register, isMuted: () => muted };
})();
