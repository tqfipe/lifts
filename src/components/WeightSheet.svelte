<script lang="ts">
  import Sheet from './Sheet.svelte';
  import RulerSlider from './RulerSlider.svelte';
  import { formatWeight, parseWeight } from '../lib/weight';

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

  let working = $state(0);
  let typing = $state(false);
  let text = $state('');
  let shake = $state(false);

  $effect(() => {
    if (open) {
      working = value;
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
    onapply(working);
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
      {formatWeight(working)}<span class="unit">kg</span>
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
    font-size: 3rem;
    font-weight: 700;
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
    background: var(--accent);
    color: #04120a;
    font-weight: 700;
    font-size: 1.05rem;
    padding: 16px;
    border-radius: var(--radius);
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
