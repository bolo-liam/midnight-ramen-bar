// The screenshot scenes behind ?shot=start|play|serve|end. Each one builds its
// frame by driving the real world state directly (same rules, same renderer),
// so every shot is a genuine render of the game's own code at a fixed seed.
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

export function stageShot(name, world) {
  world.reset();
  const s = world.state;
  if (name === 'start') {
    s.orders = [
      { id: 1, broth: 'shoyu', toppings: ['egg', 'nori'], patience: 42, maxPatience: 50 },
      { id: 2, broth: 'tonkotsu', toppings: ['chashu', 'corn'], patience: 30, maxPatience: 50 },
    ];
    s.pots = { shoyu: 1, miso: 0.7, tonkotsu: 0.4 };
    s.tray = [{ kind: 'broth', broth: 'shoyu' }];
    s.chef.x = 560; s.chef.y = 430;
    s.timeLeft = 118; s.elapsed = 2; s.score = 0;
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'serve') {
    s.orders = [
      { id: 3, broth: 'miso', toppings: ['egg', 'scallion'], patience: 38, maxPatience: 50 },
      { id: 4, broth: 'shoyu', toppings: ['nori', 'naruto'], patience: 22, maxPatience: 50 },
    ];
    s.pots = { shoyu: 1, miso: 1, tonkotsu: 0.5 };
    s.bowl = { broth: 'miso', noodles: 'perfect', toppings: ['egg', 'scallion'], readyOrder: 3, wrong: false };
    s.boiler = { active: true, t: 2.1 };
    s.chef.x = 1060; s.chef.y = 300;
    s.timeLeft = 74; s.elapsed = 46; s.score = 360; s.served = 3; s.combo = 3; s.bestCombo = 3;
    s._highlight = { id: 'serve' };
    return { screen: SCREEN_PLAY, best: 360 };
  }
  if (name === 'end') {
    s.orders = [];
    s.pots = { shoyu: 0.4, miso: 0.2, tonkotsu: 0.8 };
    s.timeLeft = 0; s.elapsed = 120;
    s.score = 540; s.served = 5; s.combo = 0; s.bestCombo = 4; s.mistakes = 1;
    return { screen: SCREEN_OVER, best: 540 };
  }
  // play (default): mid-shift, noodles boiling, tray half full, bowl mid-assembly.
  s.orders = [
    { id: 1, broth: 'tonkotsu', toppings: ['chashu', 'egg'], patience: 34, maxPatience: 50 },
    { id: 2, broth: 'miso', toppings: ['corn', 'nori'], patience: 18, maxPatience: 50 },
  ];
  s.pots = { shoyu: 1, miso: 0.5, tonkotsu: 1 };
  s.boiler = { active: true, t: 2.1 };
  s.bowl = { broth: 'tonkotsu', noodles: null, toppings: ['chashu'], readyOrder: null, wrong: false };
  s.tray = [{ kind: 'noodles', quality: 'perfect' }, { kind: 'topping', topping: 'egg' }];
  s.chef.x = 620; s.chef.y = 380;
  s.timeLeft = 92; s.elapsed = 28; s.score = 240; s.served = 2; s.combo = 2; s.bestCombo = 2;
  return { screen: SCREEN_PLAY, best: 240 };
}
