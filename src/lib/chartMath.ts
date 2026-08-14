import type { Workout } from './types';

export interface ChartPoint {
  x: number;
  y: number;
}

export function scaleSeries(
  data: { t: number; w: number }[],
  opts: { width: number; height: number; pad: number; extra?: { t: number; w: number }[] },
): { points: ChartPoint[]; x: (t: number) => number; y: (w: number) => number } {
  const { width, height, pad, extra = [] } = opts;
  const all = [...data, ...extra];
  if (!all.length) {
    return { points: [], x: () => width / 2, y: () => height / 2 };
  }
  const ts = all.map((d) => d.t);
  const ws = all.map((d) => d.w);
  const t0 = Math.min(...ts);
  const t1 = Math.max(...ts);
  const w0 = Math.min(...ws);
  const w1 = Math.max(...ws);
  const x = (t: number): number =>
    t1 === t0 ? width / 2 : pad + ((t - t0) / (t1 - t0)) * (width - 2 * pad);
  const y = (w: number): number =>
    w1 === w0 ? height / 2 : height - pad - ((w - w0) / (w1 - w0)) * (height - 2 * pad);
  return { points: data.map((d) => ({ x: x(d.t), y: y(d.w) })), x, y };
}

const r1 = (n: number): number => Math.round(n * 10) / 10;

export function linePath(points: ChartPoint[]): string {
  return points.map((p, i) => `${i ? 'L' : 'M'}${r1(p.x)} ${r1(p.y)}`).join(' ');
}

export function weekStart(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export function workoutsPerWeek(
  workouts: Workout[],
  nWeeks: number,
  now: Date,
): { label: string; count: number }[] {
  const currentStart = weekStart(now);
  const out: { label: string; count: number }[] = [];
  for (let i = nWeeks - 1; i >= 0; i--) {
    const from = new Date(currentStart);
    from.setDate(from.getDate() - 7 * i);
    const to = new Date(from);
    to.setDate(to.getDate() + 7);
    const count = workouts.filter((w) => {
      if (!w.finishedAt) return false;
      const t = Date.parse(w.startedAt);
      return t >= from.getTime() && t < to.getTime();
    }).length;
    out.push({ label: `${from.getDate()}/${from.getMonth() + 1}`, count });
  }
  return out;
}
