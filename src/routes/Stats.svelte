<script lang="ts">
  import ExerciseIcon from '../components/ExerciseIcon.svelte';
  import { linePath, nearestIndex, scaleSeries, workoutsPerWeek } from '../lib/chartMath';
  import { computePBs, sortExercisesForPicker } from '../lib/derive';
  import { app } from '../lib/store.svelte';
  import { formatWeight, toDisplay } from '../lib/weight';

  const W = 320;
  const H = 180;
  const PAD = 24;

  const sorted = $derived(sortExercisesForPicker(app.data.exercises, app.data.workouts));
  const unit = $derived(app.data.settings.unit ?? 'kg');
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
        weight: toDisplay(x.e!.weight, unit),
        isPB: x.e!.isPB,
        sets: (x.e!.sets ?? []).map((s) => ({ ...s, weight: toDisplay(s.weight, unit) })),
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

  const areaPath = $derived.by(() => {
    const pts = chart.points;
    if (pts.length < 2) return '';
    const first = pts[0];
    const last = pts[pts.length - 1];
    return `${linePath(pts)} L${last.x} ${H - 6} L${first.x} ${H - 6} Z`;
  });

  // Hold/drag on the chart to inspect a session; snaps to the nearest point.
  let svgEl = $state<SVGSVGElement | null>(null);
  let selIdx = $state<number | null>(null);
  let scrubbing = false;

  const sel = $derived.by(() => {
    if (selIdx == null || selIdx >= series.length) return null;
    return { ...series[selIdx], x: chart.points[selIdx].x, y: chart.points[selIdx].y };
  });

  const tip = $derived.by(() => {
    if (!sel) return null;
    const val = `${formatWeight(sel.weight)} ${unit}${sel.isPB ? ' · PB' : ''}`;
    const date = new Date(sel.t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    const w = Math.max(val.length * 7.2, date.length * 5) + 16;
    const h = 34;
    const x = Math.min(Math.max(sel.x - w / 2, 2), W - w - 2);
    const y = sel.y - h - 10 < 2 ? sel.y + 10 : sel.y - h - 10;
    return { val, date, x, y, w, h };
  });

  function scrub(e: PointerEvent): void {
    if (!svgEl || !chart.points.length) return;
    const rect = svgEl.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    selIdx = nearestIndex(chart.points.map((p) => p.x), x);
  }

  function scrubStart(e: PointerEvent): void {
    scrubbing = true;
    svgEl?.setPointerCapture(e.pointerId);
    scrub(e);
  }

  function fmtSelDate(t: number): string {
    return new Date(t).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  }
</script>

<header>
  <h1 class="display">Stats</h1>
</header>

{#if !sorted.length}
  <p class="empty">Log a few workouts first.</p>
{:else}
  <div class="chips">
    {#each sorted as e (e.id)}
      <button
        class="chip"
        class:on={selectedId === e.id}
        onclick={() => {
          selectedId = e.id;
          selIdx = null;
        }}
      >
        <ExerciseIcon name={e.name} icon={e.icon} size={15} />
        {e.name}
      </button>
    {/each}
  </div>

  <div class="panel">
    {#if series.length}
      <svg
        bind:this={svgEl}
        viewBox={`0 0 ${W} ${H}`}
        class="chart"
        role="img"
        aria-label="Weight over time"
        onpointerdown={scrubStart}
        onpointermove={(e) => scrubbing && scrub(e)}
        onpointerup={() => (scrubbing = false)}
        onpointercancel={() => (scrubbing = false)}
      >
        <defs>
          <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.28" />
            <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
          </linearGradient>
        </defs>
        {#if areaPath}<path d={areaPath} fill="url(#area-fill)" />{/if}
        {#each series as p (p.t)}
          {#each p.sets as s, si (si)}
            <circle cx={chart.x(p.t)} cy={chart.y(s.weight)} r="2.5" class="set-dot" />
          {/each}
        {/each}
        <path d={linePath(chart.points)} class="line" />
        {#each series as p, i (p.t)}
          <circle cx={chart.points[i].x} cy={chart.points[i].y} r="4" class="dot" class:pb={p.isPB} />
        {/each}
        {#if sel && tip}
          <line x1={sel.x} x2={sel.x} y1="8" y2={H - 6} class="guide" />
          <circle cx={sel.x} cy={sel.y} r="6" class="dot-hi" class:pb={sel.isPB} />
          <g transform={`translate(${tip.x} ${tip.y})`}>
            <rect width={tip.w} height={tip.h} rx="7" class="tip-bg" />
            <text x={tip.w / 2} y="15" text-anchor="middle" class="tip-val" class:pb={sel.isPB}>{tip.val}</text>
            <text x={tip.w / 2} y="27" text-anchor="middle" class="tip-date">{tip.date}</text>
          </g>
        {/if}
      </svg>
      <p class="chart-sub">
        {#if sel}
          {fmtSelDate(sel.t)}{sel.sets.length ? ` · ${sel.sets.map((s) => `${formatWeight(s.weight)}×${s.reps ?? '–'}`).join('  ')}` : ''}
        {:else}
          {series.length} {series.length === 1 ? 'session' : 'sessions'} · best {formatWeight(Math.max(...series.map((p) => p.weight)))} {unit}
        {/if}
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
        <span class="pb-weight">{formatWeight(toDisplay(pb.weight, unit))} {unit}</span>
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
    display: flex;
    align-items: center;
    gap: 7px;
    flex-shrink: 0;
    padding: 8px 14px;
    border-radius: 999px;
    background: var(--surface);
    border: 1px solid var(--hairline);
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
    background: var(--surface-grad);
    border: 1px solid var(--hairline);
    border-radius: var(--radius);
    padding: 14px;
  }
  .chart {
    width: 100%;
    height: auto;
    touch-action: pan-y;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    cursor: crosshair;
  }
  .guide {
    stroke: var(--text-dim);
    stroke-width: 1;
    stroke-dasharray: 3 3;
    opacity: 0.6;
  }
  .dot-hi {
    fill: var(--accent);
    stroke: var(--surface);
    stroke-width: 2;
    pointer-events: none;
  }
  .dot-hi.pb {
    fill: var(--pb);
  }
  .tip-bg {
    fill: var(--surface-2);
    stroke: var(--hairline);
  }
  .tip-val {
    font-size: 12px;
    font-weight: 700;
    fill: var(--text);
    font-variant-numeric: tabular-nums;
  }
  .tip-val.pb {
    fill: var(--pb);
  }
  .tip-date {
    font-size: 9px;
    fill: var(--text-dim);
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
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.15rem;
    font-variant-numeric: tabular-nums;
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
