// Drawing only: the world's state and the current screen in, pixels out.
// The 1280x720 playfield is scaled to fit the window and centred.
import { BROTHS, DAY_LENGTH, FIELD, FONT, NOODLE_MAX_TIME, NOODLE_PERFECT_MAX, NOODLE_PERFECT_MIN, PALETTE, STATIONS, TOPPINGS } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function stationById(id) { return STATIONS.find((s) => s.id === id); }

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  let steamT = 0;

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width; canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }
  resize();
  window.addEventListener('resize', resize);

  function text(value, x, y, size, color, align, bold) {
    context.font = `${bold ? '700 ' : ''}${size}px ${FONT}`;
    context.fillStyle = color;
    context.textAlign = align || 'left';
    context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }
  function roundRect(x, y, w, h, r) {
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);
    context.closePath();
  }
  function emoji(value, x, y, size) {
    context.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(value, x, y);
  }

  function drawTicket(order, x, y, w) {
    const broth = BROTHS[order.broth];
    const frac = Math.max(0, order.patience / order.maxPatience);
    const urgent = frac < 0.35;
    context.fillStyle = PALETTE.board;
    roundRect(x, y, w, 86, 10); context.fill();
    context.strokeStyle = urgent ? PALETTE.red : PALETTE.boardEdge;
    context.lineWidth = urgent ? 3 : 2;
    roundRect(x, y, w, 86, 10); context.stroke();
    emoji(broth.emoji, x + 26, y + 26, 30);
    text(broth.name, x + 48, y + 24, 17, PALETTE.text, 'left', true);
    text(order.toppings.map((t) => TOPPINGS[t].emoji).join(' '), x + 48, y + 52, 18, PALETTE.text, 'left');
    text(`#${order.id}`, x + w - 10, y + 22, 14, PALETTE.muted, 'right', true);
    context.fillStyle = urgent ? PALETTE.red : '#d9c49a';
    roundRect(x + 10, y + 66, w - 20, 9, 4); context.fill();
    context.fillStyle = urgent ? PALETTE.red : '#4caf6d';
    roundRect(x + 10, y + 66, (w - 20) * frac, 9, 4); context.fill();
  }

  function drawPot(state, station) {
    const broth = BROTHS[station.broth];
    const simmer = state.pots[station.broth];
    const ready = simmer >= 1;
    context.fillStyle = '#3a3348';
    roundRect(station.x, station.y, station.w, station.h, 12); context.fill();
    context.fillStyle = broth.color;
    roundRect(station.x + 10, station.y + 12, station.w - 20, 34, 8); context.fill();
    if (ready) {
      context.strokeStyle = PALETTE.gold; context.lineWidth = 3;
      roundRect(station.x, station.y, station.w, station.h, 12); context.stroke();
      text('READY!', station.x + station.w / 2, station.y + station.h - 6, 13, PALETTE.gold, 'center', true);
      // steam wisps
      context.fillStyle = PALETTE.steam;
      for (let i = 0; i < 3; i += 1) {
        const sx = station.x + 40 + i * 50 + Math.sin(steamT * 2 + i) * 6;
        context.beginPath(); context.arc(sx, station.y - 6 - ((steamT * 14 + i * 9) % 18), 5, 0, Math.PI * 2); context.fill();
      }
    } else {
      context.fillStyle = '#d9c49a';
      roundRect(station.x + 10, station.y + station.h - 28, (station.w - 20) * simmer, 7, 3); context.fill();
      text('simmering…', station.x + station.w / 2, station.y + station.h - 8, 12, PALETTE.muted, 'center');
    }
    emoji(broth.emoji, station.x + 24, station.y + 29, 24);
    text(broth.name, station.x + 44, station.y + 33, 16, '#fff', 'left', true);
  }

  function drawBoiler(state, station) {
    const b = state.boiler;
    context.fillStyle = '#3a3348';
    roundRect(station.x, station.y, station.w, station.h, 12); context.fill();
    context.fillStyle = '#1b1626';
    roundRect(station.x + 10, station.y + 12, station.w - 20, 30, 8); context.fill();
    if (b.active) {
      const frac = Math.min(1, b.t / NOODLE_MAX_TIME);
      const gx0 = NOODLE_PERFECT_MIN / NOODLE_MAX_TIME;
      const gx1 = NOODLE_PERFECT_MAX / NOODLE_MAX_TIME;
      context.fillStyle = '#4caf6d';
      roundRect(station.x + 10 + (station.w - 20) * gx0, station.y + 14, (station.w - 20) * (gx1 - gx0), 26, 4); context.fill();
      context.fillStyle = '#f2c94c';
      roundRect(station.x + 10, station.y + 14, (station.w - 20) * frac, 26, 4); context.fill();
      text('PULL IN THE GREEN!', station.x + station.w / 2, station.y + station.h - 6, 13, PALETTE.gold, 'center', true);
    } else {
      text('Noodles — press E to drop', station.x + station.w / 2, station.y + 30, 14, PALETTE.lightText, 'center');
      text('then E again to pull', station.x + station.w / 2, station.y + station.h - 6, 12, PALETTE.muted, 'center');
    }
    text('Noodle Boiler', station.x + station.w / 2, station.y + 62, 14, PALETTE.lightText, 'center', true);
  }

  function drawBowl(x, y, bowl, scale) {
    const s = scale || 1;
    context.fillStyle = '#f7ead0';
    context.beginPath(); context.arc(x, y, 26 * s, 0, Math.PI); context.fill();
    context.fillRect(x - 26 * s, y, 52 * s, 12 * s);
    if (bowl.broth) {
      context.fillStyle = BROTHS[bowl.broth].color;
      context.beginPath(); context.arc(x, y, 21 * s, 0, Math.PI); context.fill();
    }
    if (bowl.noodles) {
      context.strokeStyle = '#f2c94c'; context.lineWidth = 3 * s;
      for (let i = -1; i <= 1; i += 1) {
        context.beginPath(); context.arc(x + i * 8 * s, y - 2 * s, 6 * s, Math.PI, 0); context.stroke();
      }
    }
    bowl.toppings.forEach((t, i) => emoji(TOPPINGS[t].emoji, x - 14 * s + i * 14 * s, y - 12 * s, 16 * s));
  }

  function drawAssembly(state, station) {
    const b = state.bowl;
    const ready = !!b.readyOrder;
    context.fillStyle = ready ? '#3d6b46' : '#3a3348';
    roundRect(station.x, station.y, station.w, station.h, 12); context.fill();
    if (ready) {
      context.strokeStyle = PALETTE.gold; context.lineWidth = 3;
      roundRect(station.x, station.y, station.w, station.h, 12); context.stroke();
    }
    drawBowl(station.x + 60, station.y + 52, b, 1);
    text(ready ? 'READY TO SERVE!' : b.wrong ? 'NO MATCH — TRASH IT' : 'Assembly Counter', station.x + 120, station.y + 30, 15, ready ? PALETTE.gold : PALETTE.lightText, 'left', true);
    const line1 = [];
    if (b.broth) line1.push(BROTHS[b.broth].name);
    if (b.noodles) line1.push(b.noodles === 'perfect' ? 'Perfect noodles' : `${b.noodles} noodles`);
    text(line1.length ? line1.join(' + ') : 'Empty bowl', station.x + 120, station.y + 54, 13, PALETTE.muted, 'left');
    text(b.toppings.length ? b.toppings.map((t) => TOPPINGS[t].name).join(' + ') : 'Add from your tray (E)', station.x + 120, station.y + 76, 13, PALETTE.muted, 'left');
  }

  function drawServe(state, station) {
    const ready = !!state.bowl.readyOrder;
    context.fillStyle = ready ? '#7a2c3d' : '#3a3348';
    roundRect(station.x, station.y, station.w, station.h, 12); context.fill();
    if (ready) {
      context.strokeStyle = PALETTE.gold; context.lineWidth = 3;
      roundRect(station.x, station.y, station.w, station.h, 12); context.stroke();
      text('SERVE NOW! (E)', station.x + station.w / 2, station.y + station.h - 8, 14, PALETTE.gold, 'center', true);
    }
    emoji('🛎️', station.x + 40, station.y + 42, 34);
    text('Serving Window', station.x + 70, station.y + 36, 16, PALETTE.lightText, 'left', true);
    text(ready ? `Ticket #${state.bowl.readyOrder} is up!` : 'Bring a finished bowl', station.x + 70, station.y + 60, 13, ready ? PALETTE.gold : PALETTE.muted, 'left');
  }

  function drawToppingBin(state, station) {
    const t = TOPPINGS[station.topping];
    context.fillStyle = '#3a3348';
    roundRect(station.x, station.y, station.w, station.h, 10); context.fill();
    context.fillStyle = t.color;
    roundRect(station.x + 8, station.y + 8, station.w - 16, 22, 6); context.fill();
    emoji(t.emoji, station.x + station.w / 2, station.y + 42, 22);
    text(t.name, station.x + station.w / 2, station.y + station.h - 6, 11, PALETTE.lightText, 'center');
  }

  function drawChef(state, highlight) {
    const c = state.chef;
    context.fillStyle = 'rgba(0,0,0,0.35)';
    context.beginPath(); context.ellipse(c.x, c.y + 22, 24, 8, 0, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#e0455a';
    context.beginPath(); context.arc(c.x, c.y, 24, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#f7ead0';
    roundRect(c.x - 18, c.y - 4, 36, 22, 8); context.fill();
    context.fillStyle = '#241a2e';
    context.beginPath(); context.arc(c.x - 8, c.y - 6, 3, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.arc(c.x + 8, c.y - 6, 3, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#f7ead0';
    roundRect(c.x - 14, c.y - 26, 28, 10, 4); context.fill();
    // tray items floating above the chef
    state.tray.forEach((item, i) => {
      const tx = c.x - (state.tray.length - 1) * 14 + i * 28;
      const ty = c.y - 44;
      context.fillStyle = 'rgba(20,16,32,0.85)';
      context.beginPath(); context.arc(tx, ty, 12, 0, Math.PI * 2); context.fill();
      const e = item.kind === 'broth' ? BROTHS[item.broth].emoji : item.kind === 'noodles' ? '🍜' : TOPPINGS[item.topping].emoji;
      emoji(e, tx, ty, 15);
    });
    if (highlight) {
      context.strokeStyle = PALETTE.gold; context.lineWidth = 2;
      context.beginPath(); context.arc(c.x, c.y, 32, 0, Math.PI * 2); context.stroke();
    }
  }

  function drawHud(state) {
    const frac = Math.max(0, state.timeLeft / DAY_LENGTH);
    const mm = Math.floor(state.timeLeft / 60);
    const ss = String(Math.floor(state.timeLeft % 60)).padStart(2, '0');
    text('⏱', 16, 138, 20, PALETTE.lightText, 'left');
    text(`${mm}:${ss}`, 42, 140, 24, frac < 0.25 ? PALETTE.red : PALETTE.lightText, 'left', true);
    context.fillStyle = '#3a3348';
    roundRect(150, 122, 220, 14, 7); context.fill();
    context.fillStyle = frac < 0.25 ? PALETTE.red : PALETTE.gold;
    roundRect(150, 122, 220 * frac, 14, 7); context.fill();
    text(`Score  ${state.score}`, 400, 140, 22, PALETTE.lightText, 'left', true);
    text(`Served  ${state.served}`, 560, 140, 18, PALETTE.lightText, 'left');
    text(`Combo  x${state.combo}`, 680, 140, 18, state.combo >= 3 ? PALETTE.gold : PALETTE.lightText, 'left', true);
    text(`Mistakes  ${state.mistakes}`, 800, 140, 18, PALETTE.muted, 'left');
    text('WASD move · E interact · P pause · M mute', 1280 - 16, 140, 14, PALETTE.muted, 'right');
    if (state.messageT > 0 && state.message) {
      context.fillStyle = PALETTE.panel;
      const w = context.measureText(state.message).width + 32;
      roundRect((FIELD.width - w) / 2, 108, w, 0, 0);
      text(state.message, FIELD.width / 2, 132, 16, PALETTE.gold, 'center', true);
    }
    // floaters
    for (const f of state.floaters) {
      context.globalAlpha = Math.min(1, f.t);
      text(f.text, f.x, f.y - (1.4 - f.t) * 30, 20, f.color, 'center', true);
      context.globalAlpha = 1;
    }
    // tray bar (bottom right)
    text('TRAY', 740, 640, 14, PALETTE.muted, 'left', true);
    for (let i = 0; i < 4; i += 1) {
      const x = 740 + i * 56;
      context.fillStyle = 'rgba(20,16,32,0.8)';
      roundRect(x, 648, 48, 48, 8); context.fill();
      context.strokeStyle = '#4a3a5a'; context.lineWidth = 2;
      roundRect(x, 648, 48, 48, 8); context.stroke();
      const item = state.tray[i];
      if (item) {
        const e = item.kind === 'broth' ? BROTHS[item.broth].emoji : item.kind === 'noodles' ? '🍜' : TOPPINGS[item.topping].emoji;
        emoji(e, x + 24, y0(item), 24);
      }
    }
    function y0() { return 672; }
  }

  function drawWorld(state, highlightStation) {
    steamT += 1 / 60;
    // wall + floor
    context.fillStyle = PALETTE.wall; context.fillRect(0, 0, FIELD.width, 108);
    context.fillStyle = PALETTE.floor;
    for (let y = 108; y < FIELD.height; y += 48) {
      for (let x = ((y / 48) % 2) * 48; x < FIELD.width; x += 96) {
        context.fillRect(x, y, 48, 48);
      }
    }
    context.fillStyle = PALETTE.floorDark;
    for (let y = 108; y < FIELD.height; y += 48) {
      for (let x = (((y / 48) + 1) % 2) * 48; x < FIELD.width; x += 96) {
        context.fillRect(x, y, 48, 48);
      }
    }
    // neon sign, top-left where the ticket rail does not reach
    text('MIDNIGHT RAMEN', 16, 36, 15, PALETTE.neon, 'left', true);
    text('open late · slurp loud', 16, 60, 12, PALETTE.muted, 'left');
    // order rail
    context.fillStyle = 'rgba(20,16,32,0.6)';
    roundRect(8, 8, FIELD.width - 16, 0, 0);
    text('ORDER BOARD', 16, 100, 13, PALETTE.muted, 'left', true);
    if (state.orders.length === 0) {
      text('No tickets — the rush is coming…', 200, 62, 16, PALETTE.muted, 'left');
    }
    state.orders.forEach((o, i) => drawTicket(o, 200 + i * 300, 8, 280));
    // stations
    for (const s of STATIONS) {
      const hot = highlightStation && highlightStation.id === s.id;
      if (hot) {
        context.strokeStyle = PALETTE.gold; context.lineWidth = 3;
        roundRect(s.x - 4, s.y - 4, s.w + 8, s.h + 8, 14); context.stroke();
      }
      if (s.kind === 'pot') drawPot(state, s);
      else if (s.kind === 'boiler') drawBoiler(state, s);
      else if (s.kind === 'assembly') drawAssembly(state, s);
      else if (s.kind === 'serve') drawServe(state, s);
      else if (s.kind === 'topping') drawToppingBin(state, s);
      else if (s.kind === 'trash') {
        context.fillStyle = '#3a3348';
        roundRect(s.x, s.y, s.w, s.h, 10); context.fill();
        emoji('🗑️', s.x + s.w / 2, s.y + 30, 26);
        text('Trash', s.x + s.w / 2, s.y + s.h - 6, 12, PALETTE.lightText, 'center');
      }
    }
    drawChef(state, !!highlightStation);
    drawHud(state);
  }

  function drawPanel(lines, prompt) {
    context.fillStyle = 'rgba(10,8,18,0.72)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.panel;
    roundRect(340, 150, 600, 420, 18); context.fill();
    context.strokeStyle = PALETTE.neon; context.lineWidth = 2;
    roundRect(340, 150, 600, 420, 18); context.stroke();
    let y = 210;
    for (const line of lines) {
      text(line.text, 640, y, line.size || 20, line.color || PALETTE.lightText, 'center', !!line.bold);
      y += line.size ? line.size + 14 : 34;
    }
    if (prompt) text(prompt, 640, 520, 18, PALETTE.gold, 'center', true);
  }

  function draw(state, screen, best) {
    context.save();
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawWorld(state, screen === SCREEN_PLAY ? state._highlight || null : null);
    if (screen === SCREEN_TITLE) {
      drawPanel([
        { text: '🍜 MIDNIGHT RAMEN 🍜', size: 34, color: PALETTE.neon, bold: true },
        { text: 'A late-night ramen bar. Tickets come in —', size: 19 },
        { text: 'simmer a broth, boil noodles to the green,', size: 19 },
        { text: 'grab two toppings, build the bowl, serve it!', size: 19 },
        { text: 'Perfect noodles pay +30. Don\'t let tickets expire.', size: 17, color: PALETTE.muted },
        { text: `Best score: ${best}`, size: 17, color: PALETTE.gold, bold: true },
      ], 'Press SPACE or click to open the bar');
    } else if (screen === SCREEN_PAUSED) {
      drawPanel([
        { text: 'PAUSED', size: 34, color: PALETTE.gold, bold: true },
        { text: 'The broth keeps simmering in your head.', size: 19 },
        { text: `Score ${state.score} · Served ${state.served}`, size: 18, color: PALETTE.muted },
      ], 'Press P to keep cooking');
    } else if (screen === SCREEN_OVER) {
      const grade = state.served >= 7 ? 'RAMEN MASTER!' : state.served >= 4 ? 'Solid line cook!' : 'Keep practising, chef!';
      drawPanel([
        { text: 'SHIFT OVER', size: 34, color: PALETTE.neon, bold: true },
        { text: grade, size: 22, color: PALETTE.gold, bold: true },
        { text: `Score ${state.score} · Bowls served ${state.served} · Best combo x${state.bestCombo}`, size: 19 },
        { text: `Walk-outs ${state.mistakes} · Best score ${best}`, size: 17, color: PALETTE.muted },
      ], 'Press R to open for another shift');
    }
    context.restore();
  }

  return { draw };
}
