// Virtual clock, injected in the app page before anything else runs.
// Time only moves when the capture script calls window.__advance(ms): every animation (Animated,
// Reanimated, timers) then renders exactly the same, frame by frame, however slow the machine is.
(() => {
  const RealDate = Date;
  const realSetTimeout = setTimeout.bind(window);
  const base = RealDate.now();
  let now = 0;
  let nextId = 1;
  const timers = new Map();
  const frames = new Map();

  class VirtualDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(base + now);
      else super(...args);
    }
    static now() {
      return base + now;
    }
  }
  window.Date = VirtualDate;
  Object.defineProperty(performance, 'now', { value: () => now, configurable: true });

  const add = (fn, ms, args, every) => {
    const id = nextId++;
    timers.set(id, { at: now + Math.max(0, Number(ms) || 0), fn, args, every });
    return id;
  };
  window.setTimeout = (fn, ms, ...args) => add(fn, ms, args, 0);
  window.setInterval = (fn, ms, ...args) => add(fn, ms, args, Math.max(1, Number(ms) || 1));
  window.clearTimeout = window.clearInterval = (id) => timers.delete(id);
  window.requestAnimationFrame = (fn) => {
    const id = nextId++;
    frames.set(id, fn);
    return id;
  };
  window.cancelAnimationFrame = (id) => frames.delete(id);

  const call = (fn, args) => {
    try {
      if (typeof fn === 'function') fn(...args);
    } catch (e) {
      console.error(e);
    }
  };

  /** Moves the clock `ms` forward: due timers in order, then one animation frame. */
  window.__advance = async (ms) => {
    const end = now + ms;
    for (let guard = 0; guard < 20000; guard++) {
      let id = null;
      let next = null;
      for (const [k, tm] of timers) if (tm.at <= end && (!next || tm.at < next.at)) [id, next] = [k, tm];
      if (!next) break;
      now = Math.max(now, next.at);
      if (next.every) next.at += next.every;
      else timers.delete(id);
      call(next.fn, next.args);
    }
    now = end;
    const due = [...frames.values()];
    frames.clear();
    for (const fn of due) call(fn, [now]);
    // Let React commit what the timers and the frame changed (it schedules on real tasks).
    await new Promise((r) => realSetTimeout(r, 0));
    await new Promise((r) => realSetTimeout(r, 0));
  };
  window.__now = () => now;

  // Same "random" choices on every take (grids, wheel): the same level looks the same in every language.
  let seed = 20261003;
  const forced = [];
  /** The next Math.random() values (to film one particular, real outcome of the game). */
  window.__nextRandom = (...v) => forced.push(...v);
  Math.random = () => {
    if (forced.length) return forced.shift();
    seed = (seed + 0x6d2b79f5) >>> 0;
    let x = seed;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
})();
