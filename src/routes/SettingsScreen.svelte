<script lang="ts">
  import Sheet from '../components/Sheet.svelte';
  import { downloadExport } from '../lib/export';
  import { parseImport, type ImportResult } from '../lib/importer';
  import { buildImportPrompt } from '../lib/llmPrompt';
  import { app, applyImport, setTheme, setUnit, setWeightStep, wipeAll } from '../lib/store.svelte';
  import { toast } from '../lib/toast.svelte';
  import type { AppState, ThemeId, WeightUnit } from '../lib/types';

  const THEMES: { id: ThemeId; label: string; color: string }[] = [
    { id: 'emerald', label: 'Emerald', color: '#35e08c' },
    { id: 'volt', label: 'Volt', color: '#c4f43c' },
    { id: 'inferno', label: 'Inferno', color: '#ff6b35' },
    { id: 'ice', label: 'Ice', color: '#4cc9f0' },
    { id: 'violet', label: 'Violet', color: '#a78bfa' },
  ];

  const UNITS: WeightUnit[] = ['kg', 'lb'];

  const unit = $derived(app.data.settings.unit ?? 'kg');
  const theme = $derived(app.data.settings.theme ?? 'emerald');
  const steps = $derived(unit === 'lb' ? [2.5, 5, 10] : [1, 2.5, 5]);

  let importText = $state('');
  let result = $state<ImportResult | null>(null);
  let replaceOpen = $state(false);
  let wipeOpen = $state(false);
  let replaceArmed = $state(false);
  let wipeArmed = $state(false);

  function check(): void {
    result = importText.trim() ? parseImport(importText) : null;
  }

  async function onFile(e: Event): Promise<void> {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    importText = await file.text();
    check();
  }

  function exportNow(): void {
    downloadExport($state.snapshot(app).data as AppState);
    toast('Backup downloaded');
  }

  async function copyPrompt(): Promise<void> {
    await navigator.clipboard.writeText(buildImportPrompt());
    toast('Prompt copied — paste it to any LLM with your notes');
  }

  function doMerge(): void {
    if (!result?.ok) return;
    applyImport(result.data, 'merge');
    importText = '';
    result = null;
    toast('Imported and merged');
  }

  function doReplace(): void {
    if (!replaceArmed) {
      replaceArmed = true;
      return;
    }
    if (!result?.ok) return;
    applyImport(result.data, 'replace');
    importText = '';
    result = null;
    replaceOpen = false;
    toast('Data replaced');
  }

  function doWipe(): void {
    if (!wipeArmed) {
      wipeArmed = true;
      return;
    }
    wipeAll();
    wipeOpen = false;
    toast('All data wiped');
  }

  // Closing either sheet (backdrop tap, Cancel, or after a successful
  // confirm) disarms it, so reopening always starts back at step one.
  $effect(() => {
    if (!replaceOpen) replaceArmed = false;
  });
  $effect(() => {
    if (!wipeOpen) wipeArmed = false;
  });
</script>

<header>
  <h1 class="display">Settings</h1>
</header>

<h2>Backup</h2>
<div class="panel">
  <button class="primary" onclick={exportNow}>Export backup (.json)</button>
  <p class="hint">Everything lives only on this device. Export regularly.</p>
</div>

<h2>Import</h2>
<div class="panel">
  <button class="secondary" onclick={copyPrompt}>Copy LLM conversion prompt</button>
  <p class="hint">
    Paste the prompt plus your freetext notes into any LLM, then paste the JSON it returns below —
    or pick a backup file.
  </p>
  <input type="file" accept="application/json,.json" onchange={onFile} />
  <textarea rows="4" placeholder="…or paste JSON here" bind:value={importText} oninput={check}></textarea>
  {#if result && !result.ok}
    <p class="error">{result.error}</p>
  {/if}
  {#if result?.ok}
    <div class="preview">
      <p>
        <strong>{result.preview.workouts}</strong> workouts,
        <strong>{result.preview.exercises}</strong> exercises
        {#if result.preview.from}· {result.preview.from} → {result.preview.to}{/if}
      </p>
      <div class="preview-actions">
        <button class="primary" onclick={doMerge}>Merge into my data</button>
        <button class="danger-link" onclick={() => (replaceOpen = true)}>Replace everything…</button>
      </div>
    </div>
  {/if}
</div>

<h2>Appearance</h2>
<div class="panel">
  <p class="hint">Theme</p>
  <div class="swatches">
    {#each THEMES as t (t.id)}
      <button
        class="swatch"
        class:on={theme === t.id}
        style:--swatch={t.color}
        aria-label={`${t.label} theme`}
        title={t.label}
        onclick={() => setTheme(t.id)}
      ></button>
    {/each}
  </div>
</div>

<h2>Logging</h2>
<div class="panel">
  <p class="hint">Unit</p>
  <div class="steps">
    {#each UNITS as u (u)}
      <button class="chip" class:on={unit === u} onclick={() => setUnit(u)}>{u}</button>
    {/each}
  </div>
  <p class="hint">Weight step</p>
  <div class="steps">
    {#each steps as s (s)}
      <button
        class="chip"
        class:on={app.data.settings.weightStep === s}
        onclick={() => setWeightStep(s)}
      >
        {s} {unit}
      </button>
    {/each}
  </div>
</div>

<h2>About</h2>
<div class="panel">
  <a class="about-link" href="#/about">
    <span>What is Lifts?</span>
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6" /></svg>
  </a>
</div>

<h2>Danger zone</h2>
<div class="panel">
  <button class="danger-link" onclick={() => (wipeOpen = true)}>Wipe all data…</button>
</div>

<Sheet bind:open={replaceOpen}>
  <h2 class="sheet-h">Replace everything?</h2>
  <p class="hint">Your current workouts, templates, and exercises will be deleted and replaced by the import.</p>
  <button class="danger-bg" onclick={doReplace}>
    {replaceArmed ? 'Tap again to confirm' : 'Yes, replace all my data'}
  </button>
  <button class="cancel" onclick={() => (replaceOpen = false)}>Cancel</button>
</Sheet>

<Sheet bind:open={wipeOpen}>
  <h2 class="sheet-h">Wipe all data?</h2>
  <p class="hint">Every workout, template, and PB will be permanently deleted from this device.</p>
  <button class="danger-bg" onclick={doWipe}>
    {wipeArmed ? 'Tap again to confirm' : 'Yes, wipe everything'}
  </button>
  <button class="cancel" onclick={() => (wipeOpen = false)}>Cancel</button>
</Sheet>

<style>
  header {
    margin: 10px 0 20px;
  }
  h1 {
    font-size: 2.1rem;
    line-height: 1;
  }
  h2 {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-dim);
    margin: 22px 0 10px;
  }
  .panel {
    background: var(--surface-grad);
    border: 1px solid var(--hairline);
    border-radius: var(--radius);
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .primary {
    background: var(--grad-accent);
    color: var(--on-accent);
    font-weight: 700;
    padding: 14px;
    border-radius: var(--radius);
    box-shadow: var(--shadow-accent);
  }
  .secondary {
    background: var(--surface-2);
    font-weight: 600;
    padding: 14px;
    border-radius: var(--radius);
  }
  .hint {
    font-size: 0.85rem;
    color: var(--text-dim);
  }
  .error {
    color: var(--danger);
    font-size: 0.85rem;
    font-family: ui-monospace, monospace;
  }
  .preview {
    background: var(--surface-2);
    border-radius: var(--radius);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .preview-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .steps {
    display: flex;
    gap: 8px;
  }
  .swatches {
    display: flex;
    gap: 14px;
  }
  .swatch {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: radial-gradient(circle at 32% 30%, var(--swatch), color-mix(in srgb, var(--swatch) 55%, #000));
    border: 2px solid transparent;
    transition: transform 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;
  }
  .swatch:active {
    transform: scale(0.9);
  }
  .swatch.on {
    border-color: var(--text);
    box-shadow: 0 0 12px var(--swatch);
  }
  .about-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    padding: 4px 2px;
  }
  .about-link svg {
    color: var(--text-dim);
  }
  .chip {
    padding: 9px 16px;
    border-radius: 999px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    font-weight: 600;
    color: var(--text-dim);
  }
  .chip.on {
    background: var(--accent-soft);
    border-color: var(--accent);
    color: var(--accent);
  }
  .danger-link {
    color: var(--danger);
    font-weight: 600;
    padding: 10px;
  }
  .danger-bg {
    background: var(--danger);
    color: var(--on-danger);
    font-weight: 700;
    padding: 14px;
    border-radius: var(--radius);
  }
  .cancel {
    color: var(--text-dim);
    padding: 8px;
  }
  .sheet-h {
    font-size: 1.1rem;
    margin: 0;
    text-transform: none;
    letter-spacing: 0;
    color: var(--text);
  }
</style>
