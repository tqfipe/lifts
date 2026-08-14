<script lang="ts">
  import Sheet from './Sheet.svelte';
  import RulerSlider from './RulerSlider.svelte';
  import { app } from '../lib/store.svelte';
  import { formatWeight, fromDisplay, parseWeight, toDisplay } from '../lib/weight';

  let {
    open = $bindable(false),
    value,
    step = 2.5,
    title = '',
    onapply,
  }: {
    open?: boolean;
    value: number;
    step?: number;
    title?: string;
    onapply: (v: number) => void;
  } = $props();

  let working = $state(0); // in the display unit
  let typing = $state(false);
  let text = $state('');
  let shake = $state(false);

  const unit = $derived(app.data.settings.unit ?? 'kg');

  $effect(() => {
    if (open) {
      working = toDisplay(value, unit);
      typing = false;
    }
  });

  function focusSelect(node: HTMLInputElement): void {
    node.focus();
    node.select();
  }

  function commitText(): void {
    const parsed = parseWeight(text);
    if (parsed === null) {
      shake = true;
      setTimeout(() => (shake = false), 400);
      return;
    }
    working = parsed;
    typing = false;
  }

  function apply(): void {
    onapply(fromDisplay(working, unit));
    open = false;
  }
</script>

<Sheet bind:open>
  {#if title}<p class="sheet-title">{title}</p>{/if}
  {#if typing}
    <input
      class="value-input"
      type="text"
      inputmode="decimal"
      bind:value={text}
      use:focusSelect
      onkeydown={(e) => e.key === 'Enter' && commitText()}
      onblur={commitText}
    />
  {:else}
    <button
      class="value"
      class:shake
      onclick={() => {
        text = formatWeight(working);
        typing = true;
      }}
    >
      {formatWeight(working)}<span class="unit">{unit}</span>
    </button>
  {/if}
  <div class="adjust">
    <button class="step-btn" onclick={() => (working = Math.max(0, working - step))} aria-label="Decrease">−</button>
    <RulerSlider value={working} {step} onchange={(v) => (working = v)} />
    <button class="step-btn" onclick={() => (working = working + step)} aria-label="Increase">+</button>
  </div>
  <button class="apply" onclick={apply}>Done</button>
</Sheet>

<style>
  .sheet-title {
    text-align: center;
    color: var(--text-dim);
    font-size: 0.9rem;
  }
  .value,
  .value-input {
    font-family: var(--font-display);
    font-size: 4.2rem;
    font-weight: 800;
    line-height: 1;
    text-align: center;
    width: 100%;
    font-variant-numeric: tabular-nums;
  }
  .value-input {
    background: var(--surface-2);
    border-radius: var(--radius);
  }
  .unit {
    font-size: 1.2rem;
    color: var(--text-dim);
    margin-left: 6px;
    font-weight: 400;
  }
  .adjust {
    display: grid;
    grid-template-columns: 48px 1fr 48px;
    align-items: center;
    gap: 4px;
  }
  .step-btn {
    height: 48px;
    border-radius: 50%;
    background: var(--surface-2);
    font-size: 1.5rem;
    line-height: 1;
  }
  .step-btn:active {
    background: var(--border);
  }
  .apply {
    background: var(--grad-accent);
    color: var(--on-accent);
    font-family: var(--font-display);
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    font-size: 1.2rem;
    padding: 16px;
    border-radius: var(--radius);
    box-shadow: var(--shadow-accent);
    transition: transform 0.1s ease;
  }
  .apply:active {
    transform: scale(0.97);
  }
  .shake {
    animation: shake 0.4s;
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-8px); }
    75% { transform: translateX(8px); }
  }
</style>
