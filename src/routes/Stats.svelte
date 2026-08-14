<script lang="ts">
  import { linePath, scaleSeries, workoutsPerWeek } from '../lib/chartMath';
  import { computePBs, sortExercisesForPicker } from '../lib/derive';
  import { app } from '../lib/store.svelte';
  import { formatWeight } from '../lib/weight';

  const W = 320;
  const H = 180;
  const PAD = 24;

  const sorted = $derived(sortExercisesForPicker(app.data.exercises, app.data.workouts));
  let selectedId = $state<string | null>(null);

  $effect(() => {
    if (!selectedId && sorted.length) selectedId = sorted[0].id;
  });

  const series = $derived.by(() => {
    if (!selectedId) return [];
    return app.data.workouts
      .filter((w) => w.finishedAt)
      .map((w) => ({ w, e: w.entries.find((e) => e.exerciseId === selectedId) }))
      .filter((x) => x.e)
      .sort((a, b) => a.w.startedAt.localeCompare(b.w.startedAt))
      .map((x) => ({
        t: Date.parse(x.w.startedAt),
        weight: x.e!.weight,
        isPB: x.e!.isPB,
        sets: x.e!.sets ?? [],
      }));
  });

  const chart = $derived.by(() => {
    const data = series.map((p) => ({ t: p.t, w: p.weight }));
    const extra = series.flatMap((p) => p.sets.map((s) => ({ t: p.t, w: s.weight })));
    return scaleSeries(data, { width: W, height: H, pad: PAD, extra });
  });

  const pbs = $derived.by(() => {
    const map = computePBs(app.data.workouts);
    return sorted
      .filter((e) => map.has(e.id))
      .map((e) => ({ name: e.name, ...map.get(e.id)! }))
      .sort((a, b) => b.weight - a.weight);
  });

  const weeks = $derived(
    workoutsPerWeek(app.data.workouts, 12, new Date()),
  );
  const maxWeek = $derived(Math.max(1, ...weeks.map((w) => w.count)));
</script>

<header>
  <a href="#/" aria-label="Back">
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 5l-7 7 7 7" /></svg>
  </a>
  <h1>Stats</h1>
</header>

{#if !sorted.length}
  <p class="empty">Log a few workouts first.</p>
{:else}
  <div class="chips">
    {#each sorted as e (e.id)}
      <button class="chip" class:on={selectedId === e.id} onclick={() => (selectedId = e.id)}>
        {e.name}
      </button>
    {/each}
  </div>

  <div class="panel">
    {#if series.length}
      <svg viewBox={`0 0 ${W} ${H}`} class="chart" role="img" aria-label="Weight over time">
        {#each series as p (p.t)}
          {#each p.sets as s, si (si)}
            <circle cx={chart.x(p.t)} cy={chart.y(s.weight)} r="2.5" class="set-dot" />
          {/each}
        {/each}
        <path d={linePath(chart.points)} class="line" />
        {#each series as p, i (p.t)}
          <circle cx={chart.points[i].x} cy={chart.points[i].y} r="4" class="dot" class:pb={p.isPB} />
        {/each}
      </svg>
      <p class="chart-sub">
        {series.length} sessions · best {formatWeight(Math.max(...series.map((p) => p.weight)))} kg
      </p>
    {:else}
      <p class="empty">No data for this exercise yet.</p>
    {/if}
  </div>

  <h2>Personal bests</h2>
  <div class="panel table">
    {#each pbs as pb (pb.name)}
      <div class="pb-row">
        <span class="pb-name">{pb.name}</span>
        <span class="pb-weight">{formatWeight(pb.weight)} kg</span>
        <span class="pb-date">{pb.date.slice(0, 10)}</span>
      </div>
    {/each}
  </div>

  <h2>Workouts per week</h2>
  <div class="panel">
    <div class="bars">
      {#each weeks as wk (wk.label)}
        <div class="bar-col" title={`${wk.label}: ${wk.count}`}>
          <div class="bar" style:height={`${(wk.count / maxWeek) * 64}px`}></div>
        </div>
      {/each}
    </div>
    <p class="chart-sub">last 12 weeks</p>
  </div>
{/if}

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
    margin: 24px 0 10px;
  }
  .empty {
    color: var(--text-dim);
    text-align: center;
    padding: 24px 0;
  }
  .chips {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 10px;
    margin-bottom: 6px;
  }
  .chip {
    flex-shrink: 0;
    padding: 8px 14px;
    border-radius: 999px;
    background: var(--surface);
    border: 1px solid var(--border);
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-dim);
  }
  .chip.on {
    background: var(--accent-soft);
    border-color: var(--accent);
    color: var(--accent);
  }
  .panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 14px;
  }
  .chart {
    width: 100%;
    height: auto;
  }
  .line {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .dot {
    fill: var(--surface);
    stroke: var(--accent);
    stroke-width: 2;
  }
  .dot.pb {
    fill: var(--pb);
    stroke: var(--pb);
  }
  .set-dot {
    fill: var(--text-dim);
    opacity: 0.4;
  }
  .chart-sub {
    font-size: 0.8rem;
    color: var(--text-dim);
    text-align: center;
    margin-top: 8px;
  }
  .table {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .pb-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }
  .pb-name {
    flex: 1;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pb-weight {
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    color: var(--pb);
  }
  .pb-date {
    font-size: 0.75rem;
    color: var(--text-dim);
    font-variant-numeric: tabular-nums;
  }
  .bars {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    height: 64px;
  }
  .bar-col {
    flex: 1;
    display: flex;
    align-items: flex-end;
    height: 100%;
  }
  .bar {
    width: 100%;
    background: var(--accent);
    opacity: 0.75;
    border-radius: 3px 3px 0 0;
    min-height: 2px;
    transition: height 0.3s ease;
  }
</style>
