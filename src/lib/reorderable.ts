import { dragTargetIndex } from './reorder';

export interface ReorderParams {
  index: number;
  count: number;
  onreorder: (from: number, to: number) => void;
  enabled?: boolean;
}

const LONG_PRESS_MS = 350;
const ROW_GAP = 8;

export function reorderable(node: HTMLElement, params: ReorderParams) {
  let p = params;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let dragging = false;
  let startY = 0;
  let pointerId = 0;

  const preventScroll = (e: TouchEvent): void => e.preventDefault();

  function down(e: PointerEvent): void {
    if (!e.isPrimary || p.enabled === false) return;
    startY = e.clientY;
    pointerId = e.pointerId;
    timer = setTimeout(start, LONG_PRESS_MS);
  }

  function start(): void {
    dragging = true;
    node.setPointerCapture(pointerId);
    node.classList.add('dragging');
    node.addEventListener('touchmove', preventScroll, { passive: false });
    navigator.vibrate?.(10);
  }

  function move(e: PointerEvent): void {
    if (!dragging) {
      if (Math.abs(e.clientY - startY) > 8) clearTimeout(timer);
      return;
    }
    node.style.transform = `translateY(${e.clientY - startY}px)`;
  }

  function up(e: PointerEvent): void {
    clearTimeout(timer);
    if (!dragging) return;
    dragging = false;
    node.classList.remove('dragging');
    node.style.transform = '';
    node.removeEventListener('touchmove', preventScroll);
    const rowHeight = node.offsetHeight + ROW_GAP;
    const to = dragTargetIndex(p.index, e.clientY - startY, rowHeight, p.count);
    if (to !== p.index) p.onreorder(p.index, to);
    node.addEventListener('click', (c) => { c.stopPropagation(); c.preventDefault(); }, { capture: true, once: true });
  }

  node.addEventListener('pointerdown', down);
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerup', up);
  node.addEventListener('pointercancel', up);

  return {
    update(next: ReorderParams): void {
      p = next;
    },
    destroy(): void {
      clearTimeout(timer);
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', up);
      node.removeEventListener('touchmove', preventScroll);
    },
  };
}
