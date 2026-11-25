// The ramen bar simulation: pots simmer, noodles boil on a timing window, the
// tray carries up to four components, and bowls are assembled to match tickets.
import {
  BROTH_IDS, BROTHS, CHEF, DAY_LENGTH, FIELD, LATE_AFTER, MAX_ORDERS,
  NOODLE_MAX_TIME, NOODLE_PERFECT_MAX, NOODLE_PERFECT_MIN, ORDER_PATIENCE,
  ORDER_PATIENCE_LATE, ORDER_POINTS, PERFECT_NOODLE_BONUS, SPAWN_INTERVAL,
  SPAWN_INTERVAL_LATE, STATIONS, TOPPING_IDS, TRAY_MAX,
} from './config.js';

export const EVENT_SERVE = 1;
export const EVENT_EXPIRE = 2;
export const EVENT_OVER = 4;
export const EVENT_ERROR = 8;

let nextOrderId = 1;

export function createWorld(random) {
  const state = freshState();

  function freshState() {
    return {
      chef: { x: 640, y: 430, tx: null, ty: null },
      tray: [],
      pots: { shoyu: 1, miso: 0.6, tonkotsu: 0.3 },
      boiler: { active: false, t: 0 },
      bowl: { broth: null, noodles: null, toppings: [], readyOrder: null, wrong: false },
      orders: [],
      spawnT: 2,
      elapsed: 0,
      timeLeft: DAY_LENGTH,
      score: 0,
      served: 0,
      mistakes: 0,
      combo: 0,
      bestCombo: 0,
      message: '',
      messageT: 0,
      floaters: [],
    };
  }

  function reset() {
    const fresh = freshState();
    for (const key of Object.keys(fresh)) state[key] = fresh[key];
    state.orders = [];
    nextOrderId = 1;
    spawnOrder();
  }

  function spawnOrder() {
    const toppings = random.shuffle(TOPPING_IDS).slice(0, 2);
    const patience = state.elapsed > LATE_AFTER ? ORDER_PATIENCE_LATE : ORDER_PATIENCE;
    state.orders.push({
      id: nextOrderId++,
      broth: random.pick(BROTH_IDS),
      toppings,
      patience,
      maxPatience: patience,
    });
  }

  function say(text) { state.message = text; state.messageT = 2.2; }
  function float(text, x, y, color) { state.floaters.push({ text, x, y, t: 1.4, color: color || '#f2c94c' }); }

  function nearestStation() {
    const c = state.chef;
    let best = null; let bestD = 1e9;
    for (const s of STATIONS) {
      const cx = Math.max(s.x, Math.min(c.x, s.x + s.w));
      const cy = Math.max(s.y, Math.min(c.y, s.y + s.h));
      const dx = c.x - cx; const dy = c.y - cy;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = s; }
    }
    return bestD < 95 * 95 ? best : null;
  }

  function bowlMatches(order) {
    if (!state.bowl.broth || state.bowl.broth !== order.broth) return false;
    if (!state.bowl.noodles) return false;
    const have = state.bowl.toppings.slice(0, 2);
    return order.toppings.every((t) => have.includes(t)) && have.length === 2;
  }

  function refreshBowl() {
    const b = state.bowl;
    b.readyOrder = null; b.wrong = false;
    if (!b.broth || !b.noodles || b.toppings.length < 2) return;
    const match = state.orders.find((o) => bowlMatches(o));
    if (match) b.readyOrder = match.id;
    else b.wrong = true;
  }

  function interact() {
    const station = nearestStation();
    if (!station) { say('Walk up to a station first!'); return EVENT_ERROR; }
    const tray = state.tray;
    if (station.kind === 'pot') {
      const simmer = state.pots[station.broth];
      if (simmer < 1) { say(`${BROTHS[station.broth].name} is still simmering…`); return EVENT_ERROR; }
      if (tray.length >= TRAY_MAX) { say('Tray is full!'); return EVENT_ERROR; }
      tray.push({ kind: 'broth', broth: station.broth });
      state.pots[station.broth] = 0;
      float(`${BROTHS[station.broth].name} broth`, station.x + 90, station.y - 8, '#f2c94c');
      return 0;
    }
    if (station.kind === 'boiler') {
      if (!state.boiler.active) {
        if (tray.length >= TRAY_MAX) { say('Tray is full!'); return EVENT_ERROR; }
        state.boiler.active = true; state.boiler.t = 0;
        say('Noodles in — pull them in the green!');
        return 0;
      }
      const t = state.boiler.t;
      const quality = t >= NOODLE_PERFECT_MIN && t <= NOODLE_PERFECT_MAX ? 'perfect' : t < NOODLE_PERFECT_MIN ? 'under' : 'soggy';
      if (tray.length >= TRAY_MAX) { say('Tray is full!'); return EVENT_ERROR; }
      tray.push({ kind: 'noodles', quality });
      state.boiler.active = false; state.boiler.t = 0;
      float(quality === 'perfect' ? 'PERFECT noodles!' : quality === 'under' ? 'Undercooked…' : 'Soggy noodles…',
        station.x + 105, station.y - 8, quality === 'perfect' ? '#4caf6d' : '#e0455a');
      return 0;
    }
    if (station.kind === 'topping') {
      if (tray.length >= TRAY_MAX) { say('Tray is full!'); return EVENT_ERROR; }
      tray.push({ kind: 'topping', topping: station.topping });
      return 0;
    }
    if (station.kind === 'assembly') {
      if (tray.length === 0) { say('Your tray is empty — bring broth, noodles and toppings!'); return EVENT_ERROR; }
      const b = state.bowl;
      for (const item of tray) {
        if (item.kind === 'broth' && !b.broth) b.broth = item.broth;
        else if (item.kind === 'noodles' && !b.noodles) b.noodles = item.quality;
        else if (item.kind === 'topping' && b.toppings.length < 2) b.toppings.push(item.topping);
      }
      state.tray = [];
      refreshBowl();
      if (b.readyOrder) say('Bowl complete! Serve it at the window!');
      else if (b.wrong) say('That bowl matches no ticket — trash it!');
      return 0;
    }
    if (station.kind === 'serve') {
      if (!state.bowl.readyOrder) {
        say(state.bowl.wrong ? 'Wrong bowl — trash it first!' : 'No finished bowl on the counter yet!');
        return EVENT_ERROR;
      }
      const order = state.orders.find((o) => o.id === state.bowl.readyOrder);
      if (!order) { state.bowl.readyOrder = null; return EVENT_ERROR; }
      const perfect = state.bowl.noodles === 'perfect';
      const speedBonus = Math.round((order.patience / order.maxPatience) * 20);
      const gained = ORDER_POINTS + (perfect ? PERFECT_NOODLE_BONUS : 0) + speedBonus;
      state.score += gained;
      state.served += 1;
      state.combo += 1;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      state.orders = state.orders.filter((o) => o.id !== order.id);
      float(`+${gained}${perfect ? ' PERFECT!' : ''}`, station.x + 110, station.y - 8, '#4caf6d');
      state.bowl = { broth: null, noodles: null, toppings: [], readyOrder: null, wrong: false };
      return EVENT_SERVE;
    }
    if (station.kind === 'trash') {
      if (!state.bowl.broth && !state.bowl.noodles && state.bowl.toppings.length === 0 && tray.length === 0) {
        say('Nothing to throw away.');
        return EVENT_ERROR;
      }
      state.bowl = { broth: null, noodles: null, toppings: [], readyOrder: null, wrong: false };
      say('Bowl trashed. Start fresh!');
      return 0;
    }
    return 0;
  }

  function step(dt, axis, interactPressed, walkTarget) {
    let events = 0;
    state.elapsed += dt;
    state.timeLeft = Math.max(0, DAY_LENGTH - state.elapsed);
    if (state.messageT > 0) state.messageT -= dt;
    for (const f of state.floaters) f.t -= dt;
    state.floaters = state.floaters.filter((f) => f.t > 0);

    // Pots keep simmering.
    for (const id of BROTH_IDS) {
      state.pots[id] = Math.min(1, state.pots[id] + dt / BROTHS[id].simmer);
    }
    // Noodles left too long go soggy and dump themselves.
    if (state.boiler.active) {
      state.boiler.t += dt;
      if (state.boiler.t > NOODLE_MAX_TIME) {
        state.boiler.active = false; state.boiler.t = 0;
        say('The noodles went soggy and were dumped!');
        events |= EVENT_ERROR;
      }
    }
    // Orders: patience ticks down, new tickets arrive.
    for (const o of state.orders) o.patience -= dt;
    const expired = state.orders.filter((o) => o.patience <= 0);
    if (expired.length > 0) {
      state.orders = state.orders.filter((o) => o.patience > 0);
      state.mistakes += expired.length;
      state.combo = 0;
      say(expired.length > 1 ? 'Two customers walked out!' : 'A customer walked out!');
      events |= EVENT_EXPIRE;
      refreshBowl();
    }
    state.spawnT -= dt;
    if (state.spawnT <= 0 && state.orders.length < MAX_ORDERS) {
      spawnOrder();
      state.spawnT = state.elapsed > LATE_AFTER ? SPAWN_INTERVAL_LATE : SPAWN_INTERVAL;
    }

    // Chef movement: keys win over a mouse walk target.
    const chef = state.chef;
    if (walkTarget) { chef.tx = walkTarget.x; chef.ty = walkTarget.y; }
    let mx = axis.x; let my = axis.y;
    if (mx === 0 && my === 0 && chef.tx !== null) {
      const dx = chef.tx - chef.x; const dy = chef.ty - chef.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 8) { chef.tx = null; chef.ty = null; }
      else { mx = dx / dist; my = dy / dist; }
    } else if (mx !== 0 || my !== 0) { chef.tx = null; chef.ty = null; }
    const len = Math.hypot(mx, my);
    if (len > 0) {
      chef.x += (mx / len) * CHEF.speed * dt;
      chef.y += (my / len) * CHEF.speed * dt;
    }
    chef.x = Math.max(CHEF.radius, Math.min(FIELD.width - CHEF.radius, chef.x));
    chef.y = Math.max(112 + CHEF.radius, Math.min(FIELD.height - CHEF.radius, chef.y));

    if (interactPressed) events |= interact();
    if (state.timeLeft <= 0) events |= EVENT_OVER;
    return events;
  }

  return { state, reset, step, interact, nearestStation, spawnOrder };
}
