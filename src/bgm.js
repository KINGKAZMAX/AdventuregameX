// GameX ambient chiptune — an ORIGINAL, warm Game-Boy-style loop.
//
// This is NOT a Pokémon track: those melodies are copyrighted. Instead this is
// an original cozy tune in the classic handheld idiom (pulse-wave lead + soft
// triangle bass + gentle arpeggio), synthesized live with the Web Audio API so
// it ships with no audio files and no licensing strings attached.

const NOTE = {
  0: 0, // rest
  F3: 174.61, G3: 196.0, A3: 220.0, Bb3: 233.08, C4: 261.63, D4: 293.66,
  E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, Bb4: 466.16, C5: 523.25,
  D5: 587.33, E5: 659.25, F5: 698.46,
};

// Warm, uplifting F major progression: F – Am – Bb – C, twice.
// Each entry is [note, durationInEighths]. The melody is stepwise and gentle.
const LEAD = [
  ['A4', 2], ['C5', 2], ['D5', 2], ['C5', 2],
  ['A4', 2], ['G4', 2], ['F4', 4],
  ['G4', 2], ['A4', 2], ['C5', 2], ['A4', 2],
  ['G4', 4], [0, 4],
  ['C5', 2], ['D5', 2], ['F5', 2], ['D5', 2],
  ['C5', 2], ['A4', 2], ['G4', 4],
  ['A4', 2], ['G4', 2], ['F4', 2], ['G4', 2],
  ['A4', 4], [0, 4],
];

// One root+fifth pair per bar (half notes), following the chords.
const BASS = [
  ['F3', 4], ['C4', 4],
  ['A3', 4], ['E4', 4],
  ['Bb3', 4], ['F4', 4],
  ['C4', 4], ['G4', 4],
  ['F3', 4], ['C4', 4],
  ['A3', 4], ['E4', 4],
  ['Bb3', 4], ['F4', 4],
  ['C4', 4], ['G4', 4],
];

// Soft broken-chord sparkle, one eighth-note arpeggio per chord.
const ARP = [
  ['F4', 1], ['A4', 1], ['C5', 1], ['A4', 1], ['F4', 1], ['A4', 1], ['C5', 1], ['A4', 1],
  ['A3', 1], ['C4', 1], ['E4', 1], ['C4', 1], ['A3', 1], ['C4', 1], ['E4', 1], ['C4', 1],
  ['Bb3', 1], ['D4', 1], ['F4', 1], ['D4', 1], ['Bb3', 1], ['D4', 1], ['F4', 1], ['D4', 1],
  ['C4', 1], ['E4', 1], ['G4', 1], ['E4', 1], ['C4', 1], ['E4', 1], ['G4', 1], ['E4', 1],
  ['F4', 1], ['A4', 1], ['C5', 1], ['A4', 1], ['F4', 1], ['A4', 1], ['C5', 1], ['A4', 1],
  ['A3', 1], ['C4', 1], ['E4', 1], ['C4', 1], ['A3', 1], ['C4', 1], ['E4', 1], ['C4', 1],
  ['Bb3', 1], ['D4', 1], ['F4', 1], ['D4', 1], ['Bb3', 1], ['D4', 1], ['F4', 1], ['D4', 1],
  ['C4', 1], ['E4', 1], ['G4', 1], ['E4', 1], ['C4', 1], ['E4', 1], ['G4', 1], ['E4', 1],
];

const BPM = 100;
const EIGHTH = 30 / BPM; // seconds per eighth note

// A 25%-duty pulse wave gives the classic warm Game Boy lead timbre.
function pulseWave(ctx, duty = 0.25, partials = 22) {
  const real = new Float32Array(partials);
  const imag = new Float32Array(partials);
  for (let n = 1; n < partials; n += 1) {
    imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
  }
  return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
}

function buildEvents() {
  const events = [];
  const lay = (track, type) => {
    let t = 0;
    for (const [name, dur] of track) {
      const freq = NOTE[name];
      if (freq) {
        events.push({ time: t * EIGHTH, dur: dur * EIGHTH, freq, type });
      }
      t += dur;
    }
    return t;
  };

  const leadLen = lay(LEAD, 'lead');
  lay(BASS, 'bass');
  lay(ARP, 'arp');

  return { events, loopDuration: leadLen * EIGHTH };
}

export function createChiptune() {
  let ctx = null;
  let master = null;
  let pulse = null;
  let playing = false;
  let timer = null;
  let loopStart = 0;
  let volume = 0.5;

  const { events, loopDuration } = buildEvents();
  const LOOKAHEAD = 0.25;

  function voiceGain(type) {
    if (type === 'lead') return 0.18;
    if (type === 'bass') return 0.16;
    return 0.06; // arp sparkle sits quietly under the lead
  }

  function playNote(ev, when) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (ev.type === 'bass') {
      osc.type = 'triangle';
    } else {
      osc.setPeriodicWave(pulse);
    }
    osc.frequency.value = ev.freq;

    const peak = voiceGain(ev.type);
    const a = 0.008;
    const end = when + ev.dur;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(peak, when + a);
    gain.gain.setValueAtTime(peak, Math.max(when + a, end - 0.06));
    gain.gain.linearRampToValueAtTime(0, end);

    osc.connect(gain).connect(master);
    osc.start(when);
    osc.stop(end + 0.02);
  }

  function scheduler() {
    const ahead = ctx.currentTime + LOOKAHEAD;
    while (loopStart + loopDuration < ahead) {
      // schedule the whole upcoming loop, then advance the loop cursor
      for (const ev of events) {
        const when = loopStart + ev.time;
        if (when >= ctx.currentTime - 0.05) {
          playNote(ev, when);
        }
      }
      loopStart += loopDuration;
    }
  }

  function start() {
    if (playing) return;
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
      pulse = pulseWave(ctx);
    }
    if (ctx.state === 'suspended') ctx.resume();

    playing = true;
    loopStart = ctx.currentTime + 0.08;
    // Prime the first loop, then keep topping up.
    for (const ev of events) playNote(ev, loopStart + ev.time);
    loopStart += loopDuration;
    timer = window.setInterval(scheduler, 60);
  }

  function stop() {
    if (!playing) return;
    playing = false;
    if (timer) { window.clearInterval(timer); timer = null; }
    if (ctx) {
      // fade the master out briefly to avoid a click, then silence
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + 0.12);
      window.setTimeout(() => { if (!playing && ctx) ctx.suspend(); }, 200);
    }
  }

  function resumeVolume() {
    if (ctx && master) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(0.0001, now);
      master.gain.linearRampToValueAtTime(volume, now + 0.2);
    }
  }

  return {
    isPlaying: () => playing,
    play() { start(); resumeVolume(); },
    stop,
    toggle() { if (playing) stop(); else this.play(); return playing; },
    setVolume(v) { volume = v; if (master) master.gain.value = v; },
  };
}

const STORAGE_KEY = 'gamex:bgm';

// Injects a self-contained, always-on-top music toggle button. Lives on <body>
// (outside the hub's re-rendered #app) so it survives app/language switches.
export function initBgmToggle() {
  if (document.getElementById('gbx-bgm-toggle')) {
    return;
  }

  const engine = createChiptune();
  const zh = (new URLSearchParams(window.location.search).get('lang') || 'en') === 'zh';
  const label = { on: zh ? '音乐：开' : 'Music on', off: zh ? '音乐：关' : 'Music off' };

  const style = document.createElement('style');
  style.textContent = `
    #gbx-bgm-toggle {
      position: fixed; left: 16px; bottom: 16px; z-index: 40;
      display: flex; align-items: center; gap: 0;
      height: 44px; width: 44px; padding: 0; justify-content: center;
      border: 1px solid rgba(23,21,18,0.16); border-radius: 999px;
      background: rgba(255,255,255,0.82); backdrop-filter: blur(18px);
      box-shadow: 0 12px 34px rgba(26,23,19,0.16);
      color: #171512; cursor: pointer; overflow: hidden;
      font: 700 12px/1 Inter, system-ui, -apple-system, sans-serif;
      transition: background 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease, width 0.24s ease, gap 0.24s ease, padding 0.24s ease;
      opacity: 0.78;
    }
    /* Compact icon-only by default so it never covers the corner cartridge;
       widens to reveal the label on hover/focus. */
    #gbx-bgm-toggle:hover, #gbx-bgm-toggle:focus-visible {
      opacity: 1; background: rgba(255,255,255,0.94);
      width: auto; gap: 9px; padding: 0 15px 0 13px; justify-content: flex-start;
    }
    #gbx-bgm-toggle .gbx-bgm-label {
      max-width: 0; opacity: 0; transition: max-width 0.24s ease, opacity 0.2s ease;
    }
    #gbx-bgm-toggle:hover .gbx-bgm-label, #gbx-bgm-toggle:focus-visible .gbx-bgm-label {
      max-width: 120px; opacity: 1;
    }
    #gbx-bgm-toggle .gbx-eq { display: flex; align-items: flex-end; gap: 2px; height: 15px; width: 16px; flex: 0 0 auto; }
    #gbx-bgm-toggle .gbx-eq i {
      flex: 1; background: #3c3c43; border-radius: 1px; height: 30%;
      transform-origin: bottom;
    }
    #gbx-bgm-toggle.is-on .gbx-eq i { animation: gbxEq 0.9s ease-in-out infinite; }
    #gbx-bgm-toggle.is-on .gbx-eq i:nth-child(2) { animation-delay: 0.15s; }
    #gbx-bgm-toggle.is-on .gbx-eq i:nth-child(3) { animation-delay: 0.3s; }
    #gbx-bgm-toggle.is-off .gbx-eq i { height: 22%; opacity: 0.4; }
    #gbx-bgm-toggle .gbx-bgm-label { white-space: nowrap; letter-spacing: 0.01em; }
    @keyframes gbxEq {
      0%, 100% { height: 25%; }
      50% { height: 100%; }
    }
    @media (max-width: 720px) {
      #gbx-bgm-toggle .gbx-bgm-label { display: none; }
      #gbx-bgm-toggle { padding: 0 12px; }
    }
  `;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'gbx-bgm-toggle';
  btn.type = 'button';
  btn.innerHTML = `<span class="gbx-eq" aria-hidden="true"><i></i><i></i><i></i></span><span class="gbx-bgm-label"></span>`;
  const labelEl = btn.querySelector('.gbx-bgm-label');

  function paint(on) {
    btn.classList.toggle('is-on', on);
    btn.classList.toggle('is-off', !on);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? label.on : label.off);
    labelEl.textContent = on ? label.on : label.off;
  }

  btn.addEventListener('click', () => {
    const on = engine.toggle();
    paint(on);
    try { localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off'); } catch (e) { /* ignore */ }
  });

  document.body.appendChild(btn);
  paint(false);

  // If the visitor had music on last time, resume on their first interaction
  // (autoplay is blocked until a user gesture).
  let wantsResume = false;
  try { wantsResume = localStorage.getItem(STORAGE_KEY) === 'on'; } catch (e) { /* ignore */ }

  if (wantsResume) {
    const resume = () => {
      engine.play();
      paint(true);
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown', resume);
    };
    window.addEventListener('pointerdown', resume, { once: true });
    window.addEventListener('keydown', resume, { once: true });
  }

  return engine;
}
