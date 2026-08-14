<script lang="ts">
  import { app } from '../lib/store.svelte';
  import { formatWeight } from '../lib/weight';

  const finished = $derived(
    app.data.workouts
      .filter((w) => w.finishedAt)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
  );

  function name(exerciseId: string): string {
    return app.data.exercises.find((e) => e.id === exerciseId)?.name ?? '?';
  }

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function summary(entries: { exerciseId: string; weight: number }[]): string {
    const head = entries.slice(0, 3).map((e) => `${name(e.exerciseId)} ${formatWeight(e.weight)}`);
    return head.join(' · ') + (entries.length > 3 ? ' · …' : '');
  }

  function templateName(id?: string): string | null {
    return app.data.templates.find((t) => t.id === id)?.name ?? null;
  }
</script>

<header>
  <h1 class="display">History</h1>
</header>

{#if !finished.length}
  <p class="empty">No workouts yet — go lift something.</p>
{/if}

<div class="list">
  {#each finished as w (w.id)}
    <a class="card" href={`#/workout/${w.id}`}>
      <div class="top">
        <span class="date">{fmtDate(w.startedAt)}</span>
        {#if templateName(w.templateId)}<span class="tpl">{templateName(w.templateId)}</span>{/if}
        {#if w.entries.some((e) => e.isPB)}
          <span class="pb">{w.entries.filter((e) => e.isPB).length}× PB</span>
        {/if}
      </div>
      <p class="sum">{summary(w.entries)}</p>
    </a>
  {/each}
</div>

<style>
  header {
    margin: 10px 0 20px;
  }
  h1 {
    font-size: 2.1rem;
    line-height: 1;
  }
  .empty {
    color: var(--text-dim);
    text-align: center;
    padding: 40px 0;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .card {
    background: var(--surface-grad);
    border: 1px solid var(--hairline);
    border-radius: var(--radius);
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: transform 0.1s ease;
  }
  .card:active {
    transform: scale(0.98);
  }
  .top {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .date {
    font-weight: 700;
    flex: 1;
  }
  .tpl {
    font-size: 0.75rem;
    color: var(--text-dim);
    background: var(--surface-2);
    padding: 3px 8px;
    border-radius: 999px;
  }
  .pb {
    font-family: var(--font-display);
    font-size: 0.78rem;
    letter-spacing: 0.06em;
    color: var(--on-pb);
    background: var(--pb);
    padding: 3px 8px 2px;
    border-radius: 999px;
    box-shadow: 0 0 10px rgb(255 197 61 / 0.3);
  }
  .sum {
    font-size: 0.85rem;
    color: var(--text-dim);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
