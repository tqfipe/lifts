<script lang="ts">
  import { activeWorkout, app, startWorkout } from '../lib/store.svelte';
  import { navigate } from '../lib/router';

  const active = $derived(activeWorkout());

  const templates = $derived.by(() => {
    const lastUse = new Map<string, string>();
    for (const w of app.data.workouts) {
      if (!w.templateId) continue;
      const prev = lastUse.get(w.templateId);
      if (!prev || w.startedAt > prev) lastUse.set(w.templateId, w.startedAt);
    }
    return [...app.data.templates].sort((a, b) =>
      (lastUse.get(b.id) ?? '').localeCompare(lastUse.get(a.id) ?? ''),
    );
  });

  function begin(templateId?: string): void {
    navigate(`/workout/${startWorkout(templateId)}`);
  }
</script>

<header>
  <h1>Lifts</h1>
  <nav>
    <a href="#/history" aria-label="History">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
    </a>
    <a href="#/stats" aria-label="Stats">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M21 20H3" /></svg>
    </a>
    <a href="#/settings" aria-label="Settings">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" /></svg>
    </a>
  </nav>
</header>

{#if active}
  <button class="resume" onclick={() => navigate(`/workout/${active.id}`)}>
    <span class="resume-label">Workout in progress</span>
    <span class="resume-sub">
      {active.entries.filter((e) => e.logged).length}/{active.entries.length} logged — tap to resume
    </span>
  </button>
{:else}
  <button class="start" onclick={() => begin()}>Start workout</button>
{/if}

{#if templates.length && !active}
  <h2>Templates</h2>
  <div class="templates">
    {#each templates as t (t.id)}
      <button class="template" onclick={() => begin(t.id)}>
        <span class="t-name">{t.name}</span>
        <span class="t-sub">{t.exerciseIds.length} exercises</span>
      </button>
    {/each}
  </div>
{/if}

<style>
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }
  h1 {
    font-size: 1.6rem;
  }
  nav {
    display: flex;
    gap: 4px;
  }
  nav a {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    color: var(--text-dim);
  }
  nav a:active {
    background: var(--surface-2);
  }
  .start,
  .resume {
    width: 100%;
    padding: 22px;
    border-radius: var(--radius-lg);
    font-size: 1.2rem;
    font-weight: 700;
    transition: transform 0.1s ease;
  }
  .start {
    background: var(--accent);
    color: #04120a;
  }
  .resume {
    background: var(--surface);
    border: 1px solid var(--accent);
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
    text-align: left;
  }
  .start:active,
  .resume:active,
  .template:active {
    transform: scale(0.97);
  }
  .resume-label {
    color: var(--accent);
  }
  .resume-sub {
    font-size: 0.85rem;
    font-weight: 400;
    color: var(--text-dim);
  }
  h2 {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    margin: 28px 0 12px;
  }
  .templates {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .template {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
    text-align: left;
    font-weight: 600;
    transition: transform 0.1s ease;
  }
  .t-sub {
    font-size: 0.8rem;
    font-weight: 400;
    color: var(--text-dim);
  }
</style>
