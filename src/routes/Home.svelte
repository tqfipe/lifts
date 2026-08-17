<script lang="ts">
  import ExerciseIcon from '../components/ExerciseIcon.svelte';
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

  const weekCount = $derived.by(() => {
    const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
    return app.data.workouts.filter((w) => w.finishedAt && Date.parse(w.startedAt) >= cutoff).length;
  });

  function exerciseFor(id: string): { name: string; icon?: import('../lib/types').IconId } {
    const e = app.data.exercises.find((x) => x.id === id);
    return { name: e?.name ?? '', icon: e?.icon };
  }

  function begin(templateId?: string): void {
    navigate(`/workout/${startWorkout(templateId)}`);
  }
</script>

<header>
  <h1 class="display">Lifts<span class="tick">.</span></h1>
  <p class="sub">
    {weekCount === 0 ? 'No sessions yet this week' : `${weekCount} ${weekCount === 1 ? 'session' : 'sessions'} this week`}
  </p>
</header>

{#if active}
  <button class="resume" onclick={() => navigate(`/workout/${active.id}`)}>
    <span class="pulse" aria-hidden="true"></span>
    <span class="resume-body">
      <span class="resume-label display">Workout in progress</span>
      <span class="resume-sub">
        {active.entries.filter((e) => e.logged).length}/{active.entries.length} logged — tap to resume
      </span>
    </span>
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 5l7 7-7 7" /></svg>
  </button>
{:else}
  <button class="start" onclick={() => begin()}>
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M2.5 12h19M6.5 6.5v11M17.5 6.5v11M9.5 8.5v7M14.5 8.5v7" /></svg>
    <span class="display">Start workout</span>
  </button>
{/if}

{#if templates.length && !active}
  <h2 class="display">Templates</h2>
  <div class="templates">
    {#each templates as t (t.id)}
      <button class="template" onclick={() => begin(t.id)}>
        <span class="t-icons">
          {#each t.exerciseIds.slice(0, 3) as exId (exId)}
            <ExerciseIcon name={exerciseFor(exId).name} icon={exerciseFor(exId).icon} size={17} />
          {/each}
        </span>
        <span class="t-name">{t.name}</span>
        <span class="t-sub">{t.exerciseIds.length} {t.exerciseIds.length === 1 ? 'exercise' : 'exercises'}</span>
      </button>
    {/each}
  </div>
{/if}

<style>
  header {
    margin: 10px 0 26px;
  }
  h1 {
    font-size: 3rem;
    line-height: 1;
  }
  .tick {
    color: var(--accent);
  }
  .sub {
    color: var(--text-dim);
    font-size: 0.9rem;
    margin-top: 6px;
  }
  .start,
  .resume {
    width: 100%;
    border-radius: var(--radius-lg);
    transition: transform 0.12s ease;
  }
  .start {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 26px 22px;
    background: var(--grad-accent);
    color: var(--on-accent);
    box-shadow: var(--shadow-accent);
  }
  .start .display {
    font-size: 1.55rem;
    letter-spacing: 0.05em;
  }
  .resume {
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
    text-align: left;
    padding: 22px;
    background: var(--surface-grad);
    border: 1px solid var(--accent);
    box-shadow: 0 0 0 4px var(--accent-soft), var(--shadow);
    color: var(--accent);
  }
  .pulse {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 10px var(--accent-glow);
    animation: pulse 1.6s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(0.65); opacity: 0.6; }
  }
  .resume-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .resume-label {
    font-size: 1.25rem;
  }
  .resume-sub {
    font-size: 0.85rem;
    color: var(--text-dim);
  }
  .start:active,
  .resume:active,
  .template:active {
    transform: scale(0.97);
  }
  h2 {
    font-size: 0.95rem;
    letter-spacing: 0.12em;
    color: var(--text-dim);
    margin: 30px 0 12px;
  }
  .templates {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .template {
    background: var(--surface-grad);
    border: 1px solid var(--hairline);
    border-radius: var(--radius);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-start;
    text-align: left;
    font-weight: 600;
    transition: transform 0.12s ease, border-color 0.15s ease;
  }
  .t-icons {
    display: flex;
    gap: 7px;
    color: var(--accent);
    margin-bottom: 4px;
  }
  .t-name {
    font-size: 1rem;
  }
  .t-sub {
    font-size: 0.78rem;
    font-weight: 400;
    color: var(--text-dim);
  }
</style>
