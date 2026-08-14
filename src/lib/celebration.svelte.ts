export const celebration = $state({ seq: 0 });

export function celebrate(): void {
  celebration.seq++;
}
