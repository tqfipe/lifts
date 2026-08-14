<script lang="ts">
  import { Spring } from 'svelte/motion';
  import { dragWeight, snapWeight, tickMarks } from '../lib/rulerMath';
  import { playTick } from '../lib/tick';
  import { formatWeight } from '../lib/weight';

  const PX_PER_KG = 12;
  const HALF_RANGE = 30;

  let {
    value,
    step = 2.5,
    onchange,
  }: { value: number; step?: number; onchange: (v: number) => void } = $props();

  const center = new Spring(value, { stiffness: 0.2, damping: 0.9 });
  let dragging = $state(false);
  let startX = 0;
  let startWeight = 0;
  let lastSnap = 0;

  $effect(() => {
    if (!dragging && value !== center.target) center.set(value, { instant: true });
  });

  function down(e: PointerEvent): void {
    dragging = true;
    startX = e.clientX;
    startWeight = center.current;
    lastSnap = snapWeight(center.current, step);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function move(e: PointerEvent): void {
    if (!dragging) return;
    const raw = dragWeight(startWeight, startX, e.clientX, PX_PER_KG);
    void center.set(raw, { instant: true });
    const snapped = snapWeight(raw, step);
    if (snapped !== lastSnap) {
      lastSnap = snapped;
      playTick();
    }
  }

  function up(): void {
    if (!dragging) return;
    dragging = false;
    const snapped = snapWeight(center.current, step);
    void center.set(snapped);
    onchange(snapped);
  }
</script>

<div
  class="ruler"
  onpointerdown={down}
  onpointermove={move}
  onpointerup={up}
  onpointercancel={up}
>
  {#each tickMarks(center.current, HALF_RANGE, step) as tick (tick.weight)}
    <div
      class="tick"
      class:major={tick.major}
      style:transform={`translateX(${(tick.weight - center.current) * PX_PER_KG}px)`}
    >
      {#if tick.major}<span class="tick-label">{formatWeight(tick.weight)}</span>{/if}
    </div>
  {/each}
  <div class="needle"></div>
</div>

<style>
  .ruler {
    position: relative;
    height: 72px;
    overflow: hidden;
    touch-action: pan-y;
    cursor: grab;
    user-select: none;
  }
  .tick {
    position: absolute;
    left: 50%;
    top: 18px;
    width: 2px;
    height: 20px;
    background: var(--border);
    border-radius: 1px;
  }
  .tick.major {
    height: 32px;
    background: var(--text-dim);
  }
  .tick-label {
    position: absolute;
    top: 36px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.7rem;
    color: var(--text-dim);
  }
  .needle {
    position: absolute;
    left: 50%;
    top: 8px;
    width: 3px;
    height: 46px;
    background: var(--accent);
    border-radius: 2px;
    transform: translateX(-50%);
    box-shadow: 0 0 8px var(--accent-soft);
  }
</style>
