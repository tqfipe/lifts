<script lang="ts">
  import Sheet from '../components/Sheet.svelte';
  import { downloadExport } from '../lib/export';
  import { parseImport, type ImportResult } from '../lib/importer';
  import { buildImportPrompt } from '../lib/llmPrompt';
  import { isStorageAvailable } from '../lib/storage';
  import { app, applyImport, setWeightStep, wipeAll } from '../lib/store.svelte';
  import { toast } from '../lib/toast.svelte';
  import type { AppState } from '../lib/types';

  const STEPS = [1, 2.5, 5];

  let importText = $state('');
  let result = $state<ImportResult | null>(null);
  let replaceOpen = $state(false);
  let wipeOpen = $state(false);

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
    if (!result?.ok) return;
    applyImport(result.data, 'replace');
    importText = '';
    result = null;
    replaceOpen = false;
    toast('Data replaced');
  }

  function doWipe(): void {
    wipeAll();
    wipeOpen = false;
    toast('All data wiped');
  }
</script>

<header>
  <a href="#/" aria-label="Back">
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 5l-7 7 7 7" /></svg>
  </a>
  <h1>Settings</h1>
</header>

{#if !isStorageAvailable()}
  <p class="warn">Storage unavailable — data won't survive a reload. Export a backup now.</p>
{/if}

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

<h2>Logging</h2>
<div class="panel">
  <p class="hint">Weight step</p>
  <div class="steps">
    {#each STEPS as s (s)}
      <button
        class="chip"
        class:on={app.data.settings.weightStep === s}
        onclick={() => setWeightStep(s)}
      >
        {s} kg
      </button>
    {/each}
  </div>
</div>

<h2>Danger zone</h2>
<div class="panel">
  <button class="danger-link" onclick={() => (wipeOpen = true)}>Wipe all data…</button>
</div>

<Sheet bind:open={replaceOpen}>
  <h2 class="sheet-h">Replace everything?</h2>
  <p class="hint">Your current workouts, templates, and exercises will be deleted and replaced by the import.</p>
  <button class="danger-bg" onclick={doReplace}>Yes, replace all my data</button>
  <button class="cancel" onclick={() => (replaceOpen = false)}>Cancel</button>
</Sheet>

<Sheet bind:open={wipeOpen}>
  <h2 class="sheet-h">Wipe all data?</h2>
  <p class="hint">Every workout, template, and PB will be permanently deleted from this device.</p>
  <button class="danger-bg" onclick={doWipe}>Yes, wipe everything</button>
  <button class="cancel" onclick={() => (wipeOpen = false)}>Cancel</button>
</Sheet>

<style>
  header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 18px;
  }
  header a {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    color: var(--text-dim);
  }
  h1 {
    font-size: 1.3rem;
  }
  h2 {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    margin: 22px 0 10px;
  }
  .warn {
    background: rgb(255 93 93 / 0.12);
    border: 1px solid var(--danger);
    color: var(--danger);
    padding: 12px;
    border-radius: var(--radius);
    font-size: 0.9rem;
  }
  .panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .primary {
    background: var(--accent);
    color: #04120a;
    font-weight: 700;
    padding: 14px;
    border-radius: var(--radius);
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
    color: #fff;
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
