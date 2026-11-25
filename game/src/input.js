// Keyboard + mouse input: WASD/arrows to walk, E to interact, Space to start,
// P to pause, R to restart, M to mute. Clicking sets a walk target; clicking a
// station walks to it and interacts on arrival.
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_RESTART = 'restart';
export const ACTION_MUTE = 'mute';

export function createInput(canvas, onClick) {
  const keys = new Set();
  const pressed = new Set();
  let click = null;

  function keyOf(event) {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    return key;
  }

  function onKeyDown(event) {
    const key = keyOf(event);
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) event.preventDefault();
    if (!event.repeat) pressed.add(key);
    keys.add(key);
  }
  function onKeyUp(event) { keys.delete(keyOf(event)); }
  function onMouse(event) {
    const rect = canvas.getBoundingClientRect();
    click = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    if (onClick) onClick(click);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouse);

  function axis() {
    let x = 0; let y = 0;
    if (keys.has('a') || keys.has('ArrowLeft')) x -= 1;
    if (keys.has('d') || keys.has('ArrowRight')) x += 1;
    if (keys.has('w') || keys.has('ArrowUp')) y -= 1;
    if (keys.has('s') || keys.has('ArrowDown')) y += 1;
    return { x, y };
  }
  function takeClick() { const c = click; click = null; return c; }
  function wasPressed(action) {
    const map = {
      [ACTION_CONFIRM]: [' ', 'enter', 'e'],
      [ACTION_PAUSE]: ['p', 'escape'],
      [ACTION_RESTART]: ['r'],
      [ACTION_MUTE]: ['m'],
    };
    const list = map[action] || [];
    for (const key of list) if (pressed.has(key)) return true;
    return false;
  }
  function interactHeld() { return keys.has('e'); }
  function endFrame() { pressed.clear(); }
  function destroy() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('mousedown', onMouse);
  }
  return { axis, takeClick, wasPressed, interactHeld, endFrame, destroy };
}
