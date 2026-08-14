export const toasts = $state<{ id: number; msg: string }[]>([]);

let nextId = 1;

export function toast(msg: string): void {
  const id = nextId++;
  toasts.push({ id, msg });
  setTimeout(() => {
    const i = toasts.findIndex((t) => t.id === id);
    if (i !== -1) toasts.splice(i, 1);
  }, 2500);
}
