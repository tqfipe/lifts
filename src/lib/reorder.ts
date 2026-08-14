export function dragTargetIndex(
  originIndex: number,
  dyPx: number,
  rowHeight: number,
  count: number,
): number {
  const target = originIndex + Math.round(dyPx / rowHeight);
  return Math.max(0, Math.min(count - 1, target));
}
