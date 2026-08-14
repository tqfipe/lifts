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
  <a href="#/" aria-label="Back">
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 5l-7 7 7 7" /></svg>
  </a>
  <h1>History</h1>
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
    background: var(--surface);
    border: 1px solid var(--border);
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
    font-size: 0.7rem;
    font-weight: 800;
    color: #201500;
    background: var(--pb);
    padding: 3px 7px;
    border-radius: 999px;
  }
  .sum {
    font-size: 0.85rem;
    color: var(--text-dim);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
