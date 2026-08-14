<script lang="ts">
  import { untrack } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { backOut } from 'svelte/easing';
  import { celebration } from '../lib/celebration.svelte';

  interface Particle {
    id: number;
    x0: number; // start position, vw
    dx: number; // horizontal drift, vw
    h: number; // rise height, vh
    rot: number; // total rotation, deg
    delay: number; // s
    dur: number; // s
    color: string;
    w: number; // px
    hgt: number; // px
  }

  function confettiColors(): string[] {
    const s = getComputedStyle(document.documentElement);
    const v = (name: string, fallback: string): string => s.getPropertyValue(name).trim() || fallback;
    return [
      v('--accent', '#35e08c'),
      v('--accent-hi', '#7bf7bb'),
      v('--accent-deep', '#17b26a'),
      v('--pb', '#ffc53d'),
      v('--pb-hi', '#ffe193'),
      v('--text', '#f0f3f8'),
    ];
  }

  let particles = $state<Particle[]>([]);
  let showMsg = $state(false);
  let nextId = 0;
  let clearTimer: ReturnType<typeof setTimeout> | undefined;
  let msgTimer: ReturnType<typeof setTimeout> | undefined;

  const reducedMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  $effect(() => {
    if (celebration.seq > 0) untrack(fire);
  });

  function fire(): void {
    showMsg = true;
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => (showMsg = false), 1800);
    if (reducedMotion) return;
    const COLORS = confettiColors();
    const burst: Particle[] = [];
    for (let i = 0; i < 44; i++) {
      burst.push({
        id: nextId++,
        x0: 6 + Math.random() * 88,
        dx: (Math.random() - 0.5) * 36,
        h: 38 + Math.random() * 52,
        rot: (Math.random() - 0.5) * 940,
        delay: Math.random() * 0.18,
        dur: 1.1 + Math.random() * 0.6,
        color: COLORS[i % COLORS.length],
        w: 5 + Math.random() * 5,
        hgt: 8 + Math.random() * 7,
      });
    }
    particles = burst;
    clearTimeout(clearTimer);
    clearTimer = setTimeout(() => (particles = []), 2100);
  }
</script>

{#each particles as p (p.id)}
  <span
    class="confetti"
    style:--x0={`${p.x0}vw`}
    style:--dx={`${p.dx}vw`}
    style:--h={`${p.h}vh`}
    style:--rot={`${p.rot}deg`}
    style:--delay={`${p.delay}s`}
    style:--dur={`${p.dur}s`}
    style:width={`${p.w}px`}
    style:height={`${p.hgt}px`}
    style:background={p.color}
    aria-hidden="true"
  ></span>
{/each}

{#if showMsg}
  <div
    class="msg"
    role="status"
    in:scale={{ duration: 380, start: 0.4, easing: backOut }}
    out:fade={{ duration: 250 }}
  >
    <span class="msg-main display">Good job!</span>
    <span class="msg-sub">
      {celebration.count > 1 ? `${celebration.count} new personal bests` : 'New personal best'}
    </span>
  </div>
{/if}

<style>
  .confetti {
    position: fixed;
    left: 0;
    bottom: -14px;
    z-index: 70;
    border-radius: 2px;
    pointer-events: none;
    opacity: 0;
    will-change: transform, opacity;
    animation: confetti-fly var(--dur) cubic-bezier(0.16, 0.7, 0.35, 1) var(--delay) forwards;
  }
  @keyframes confetti-fly {
    0% {
      opacity: 1;
      transform: translate(var(--x0), 0) rotate(0deg);
    }
    70% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(calc(var(--x0) + var(--dx)), calc(-1 * var(--h))) rotate(var(--rot));
    }
  }
  .msg {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(150px + env(safe-area-inset-bottom));
    z-index: 71;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    pointer-events: none;
    text-align: center;
  }
  .msg-main {
    font-size: 3rem;
    line-height: 1;
    color: var(--pb);
    text-shadow: 0 0 24px rgb(255 197 61 / 0.45);
  }
  .msg-sub {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-dim);
  }
</style>
