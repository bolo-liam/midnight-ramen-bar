// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps, and the renderer paints what is there. Screens: title, play,
// paused and game over.
//
// ?seed=N fixes the ticket pattern. ?shot=start|play|serve|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_ERROR, EVENT_EXPIRE, EVENT_OVER, EVENT_SERVE } from './world.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { createAudio } from './audio.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try { return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; } catch { return 0; }
}
function saveBest(value) {
  try { window.localStorage.setItem(BEST_KEY, String(value)); } catch { /* private mode */ }
}
function announce(text) { status.textContent = text; }

if (shot) {
  const scene = stageShot(shot, world);
  let painted = 0;
  (function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }());
} else {
  runGame();
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let walkTarget = null;

  // Clicking a station walks there; clicking elsewhere just walks.
  const canvas2 = canvas;
  canvas2.addEventListener('mousedown', () => {
    const click = input.takeClick();
    if (click && screen === SCREEN_PLAY) {
      const rect = canvas.getBoundingClientRect();
      const scale = Math.min(rect.width / 1280, rect.height / 720);
      const ox = (rect.width - 1280 * scale) / 2;
      const oy = (rect.height - 720 * scale) / 2;
      walkTarget = { x: (click.x - ox) / scale, y: (click.y - oy) / scale };
    }
  });

  function frame(now) {
    const dt = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    const axis = input.axis();
    const click = input.takeClick();
    if (click && screen === SCREEN_PLAY) {
      const rect = canvas.getBoundingClientRect();
      const scale = Math.min(rect.width / 1280, rect.height / 720);
      const ox = (rect.width - 1280 * scale) / 2;
      const oy = (rect.height - 720 * scale) / 2;
      walkTarget = { x: (click.x - ox) / scale, y: (click.y - oy) / scale };
    }
    if (input.wasPressed(ACTION_MUTE)) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off' : 'Sound on');
    }
    if (screen === SCREEN_TITLE) {
      if (input.wasPressed(ACTION_CONFIRM)) {
        world.reset();
        screen = SCREEN_PLAY;
        announce('Shift started! First ticket is up.');
      }
    } else if (screen === SCREEN_PLAY) {
      if (input.wasPressed(ACTION_PAUSE)) { screen = SCREEN_PAUSED; announce('Paused'); }
      else if (input.wasPressed(ACTION_RESTART)) { world.reset(); announce('Shift restarted'); }
      else {
        const pressed = input.wasPressed(ACTION_CONFIRM);
        let interactThisFrame = pressed;
        accumulator += dt;
        while (accumulator >= STEP) {
          accumulator -= STEP;
          const events = world.step(STEP, axis, interactThisFrame, walkTarget);
          interactThisFrame = false;
          if (events & EVENT_SERVE) audio.serve();
          if (events & EVENT_EXPIRE) audio.expire();
          if (events & EVENT_ERROR) audio.error();
          if (events & EVENT_OVER) {
            screen = SCREEN_OVER;
            if (world.state.score > best) { best = world.state.score; saveBest(best); }
            announce(`Shift over! Score ${world.state.score}.`);
            break;
          }
        }
        // Auto-interact on arrival at a clicked station.
        const near = world.nearestStation();
        if (walkTarget && near) {
          const c = world.state.chef;
          const cx = Math.max(near.x, Math.min(c.x, near.x + near.w));
          const cy = Math.max(near.y, Math.min(c.y, near.y + near.h));
          if (Math.hypot(c.x - cx, c.y - cy) < 70) {
            world.interact();
            walkTarget = null;
          }
        }
      }
    } else if (screen === SCREEN_PAUSED) {
      if (input.wasPressed(ACTION_PAUSE)) { screen = SCREEN_PLAY; announce('Back to the bar'); }
      else if (input.wasPressed(ACTION_RESTART)) { world.reset(); screen = SCREEN_PLAY; }
    } else if (screen === SCREEN_OVER) {
      if (input.wasPressed(ACTION_RESTART) || input.wasPressed(ACTION_CONFIRM)) {
        world.reset(); screen = SCREEN_PLAY; announce('New shift started!');
      }
    }
    world.state._highlight = screen === SCREEN_PLAY ? world.nearestStation() : null;
    renderer.draw(world.state, screen, best);
    input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
