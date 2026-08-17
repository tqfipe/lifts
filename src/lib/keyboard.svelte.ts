/** Tracks the on-screen keyboard's height via the VisualViewport API so
 * bottom sheets can lift themselves above it. 0 on desktop / keyboard closed. */
export const keyboard = $state({ inset: 0 });

let started = false;

export function trackKeyboard(): void {
  if (started || typeof window === 'undefined' || !window.visualViewport) return;
  started = true;
  const vv = window.visualViewport;
  const update = (): void => {
    // Height the keyboard steals from the layout viewport. offsetTop accounts
    // for iOS scrolling the visual viewport while an input is focused.
    keyboard.inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
  };
  vv.addEventListener('resize', update);
  vv.addEventListener('scroll', update);
  update();
}
