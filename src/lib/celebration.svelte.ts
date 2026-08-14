export const celebration = $state({ seq: 0, count: 1 });

export function celebrate(count = 1): void {
  celebration.count = count;
  celebration.seq++;
}
