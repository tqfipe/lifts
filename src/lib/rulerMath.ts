export function snapWeight(value: number, step: number): number {
  const snapped = Math.round(value / step) * step;
  return Math.max(0, Math.round(snapped * 100) / 100);
}

export function dragWeight(startWeight: number, startX: number, clientX: number, pxPerKg: number): number {
  return Math.max(0, startWeight + (startX - clientX) / pxPerKg);
}

export function tickMarks(
  center: number,
  halfRange: number,
  step: number,
): { weight: number; major: boolean }[] {
  const first = Math.max(0, Math.ceil((center - halfRange) / step) * step);
  const ticks: { weight: number; major: boolean }[] = [];
  for (let i = 0; ; i++) {
    const w = Math.round((first + i * step) * 100) / 100;
    if (w > center + halfRange) break;
    ticks.push({ weight: w, major: w % 10 === 0 });
  }
  return ticks;
}
