<script lang="ts">
  import { GLYPHS, iconForName } from '../lib/exerciseCatalog';

  let { name, size = 20 }: { name: string; size?: number } = $props();

  const glyph = $derived(GLYPHS[iconForName(name)]);
</script>

<svg
  viewBox="0 0 24 24"
  width={size}
  height={size}
  fill="none"
  stroke="currentColor"
  stroke-width="1.7"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  {#each glyph.paths as d (d)}
    <path {d} />
  {/each}
  {#each glyph.circles ?? [] as c (c.join())}
    <circle cx={c[0]} cy={c[1]} r={c[2]} />
  {/each}
</svg>
