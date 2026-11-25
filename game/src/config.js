// Midnight Ramen Bar — every tuning number, broth, topping and colour in one place.
// Playfield is a fixed 1280x720 logical area; the renderer scales it to the window.
export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const DAY_LENGTH = 120;
export const BEST_KEY = 'midnight-ramen-bar.best';

export const CHEF = { radius: 24, speed: 350 };

// Three broths, simmered in pots on the left wall. A pot is READY when its simmer
// fills; picking it up empties the pot and it starts simmering again.
export const BROTHS = {
  shoyu:    { name: 'Shoyu',    color: '#c98a3d', dark: '#8a5a20', emoji: '🍜', simmer: 5 },
  miso:     { name: 'Miso',     color: '#d9a05b', dark: '#96682e', emoji: '🍲', simmer: 6 },
  tonkotsu: { name: 'Tonkotsu', color: '#f2e3c2', dark: '#bfa77a', emoji: '🥛', simmer: 7 },
};
export const BROTH_IDS = ['shoyu', 'miso', 'tonkotsu'];

// Six toppings on the counter rail. Grab one at a time onto your tray.
export const TOPPINGS = {
  egg:     { name: 'Ajitama Egg', color: '#fff3b0', emoji: '🥚' },
  chashu:   { name: 'Chashu',     color: '#d98a6a', emoji: '🥩' },
  nori:     { name: 'Nori',       color: '#2e4d2e', emoji: '🌿' },
  naruto:   { name: 'Narutomaki', color: '#f2f2f2', emoji: '🍥' },
  corn:     { name: 'Corn',       color: '#f2d13d', emoji: '🌽' },
  scallion: { name: 'Scallion',   color: '#7bc96f', emoji: '🧅' },
};
export const TOPPING_IDS = ['egg', 'chashu', 'nori', 'naruto', 'corn', 'scallion'];

// A ramen order: one broth + two toppings. Noodles are always part of the bowl.
export const ORDER_POINTS = 120;
export const PERFECT_NOODLE_BONUS = 30;
export const TRAY_MAX = 4;
export const NOODLE_PERFECT_MIN = 1.8;
export const NOODLE_PERFECT_MAX = 2.6;
export const NOODLE_MAX_TIME = 4.0; // past this the noodles go soggy and auto-dump
export const ORDER_PATIENCE = 50;
export const ORDER_PATIENCE_LATE = 40;
export const SPAWN_INTERVAL = 13;
export const SPAWN_INTERVAL_LATE = 10;
export const MAX_ORDERS = 3;
export const LATE_AFTER = 55; // seconds into the shift when the rush starts

// Stations: id, label, kind, rect.
// kind: 'pot' | 'boiler' | 'topping' | 'assembly' | 'serve' | 'trash'
export const STATIONS = [
  { id: 'pot-shoyu',    label: 'Shoyu Pot',    kind: 'pot',      broth: 'shoyu',    x: 16,  y: 150, w: 180, h: 78 },
  { id: 'pot-miso',     label: 'Miso Pot',     kind: 'pot',      broth: 'miso',     x: 16,  y: 240, w: 180, h: 78 },
  { id: 'pot-tonkotsu', label: 'Tonkotsu Pot', kind: 'pot',      broth: 'tonkotsu', x: 16,  y: 330, w: 180, h: 78 },
  { id: 'boiler',       label: 'Noodle Boiler', kind: 'boiler',   x: 260, y: 150, w: 210, h: 92 },
  { id: 'assembly',     label: 'Assembly Counter', kind: 'assembly', x: 780, y: 150, w: 220, h: 92 },
  { id: 'serve',        label: 'Serving Window',  kind: 'serve',  x: 1040, y: 150, w: 224, h: 92 },
  { id: 'trash',        label: 'Trash',           kind: 'trash',  x: 780, y: 300, w: 120, h: 70 },
  { id: 'top-egg',      label: 'Egg',      kind: 'topping', topping: 'egg',     x: 16,  y: 600, w: 106, h: 64 },
  { id: 'top-chashu',   label: 'Chashu',   kind: 'topping', topping: 'chashu',   x: 132, y: 600, w: 106, h: 64 },
  { id: 'top-nori',     label: 'Nori',     kind: 'topping', topping: 'nori',     x: 248, y: 600, w: 106, h: 64 },
  { id: 'top-naruto',   label: 'Naruto',   kind: 'topping', topping: 'naruto',   x: 364, y: 600, w: 106, h: 64 },
  { id: 'top-corn',     label: 'Corn',     kind: 'topping', topping: 'corn',     x: 480, y: 600, w: 106, h: 64 },
  { id: 'top-scallion', label: 'Scallion', kind: 'topping', topping: 'scallion', x: 596, y: 600, w: 106, h: 64 },
];

export const PALETTE = {
  backdrop: '#14121f',
  floor: '#2a2338',
  floorDark: '#221c2e',
  wall: '#1b1626',
  counter: '#4a2c4f',
  counterTop: '#8a5a7a',
  board: '#f7ead0',
  boardEdge: '#b98a4a',
  text: '#241a2e',
  lightText: '#f7ead0',
  muted: '#9a8ba8',
  accent: '#e0455a',
  gold: '#f2c94c',
  green: '#4caf6d',
  red: '#e0455a',
  steam: 'rgba(247,234,208,0.5)',
  panel: 'rgba(20,16,32,0.92)',
  neon: '#ff5a7a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
