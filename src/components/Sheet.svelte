<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  let { open = $bindable(false), children }: { open?: boolean; children: Snippet } = $props();
</script>

{#if open}
  <div
    class="backdrop"
    transition:fade={{ duration: 150 }}
    onclick={() => (open = false)}
    aria-hidden="true"
  ></div>
  <div class="sheet" transition:fly={{ y: 320, duration: 220 }} role="dialog" aria-modal="true">
    {@render children()}
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgb(0 0 0 / 0.55);
    z-index: 40;
  }
  .sheet {
    position: fixed;
    left: 50%;
    bottom: 0;
    transform: translateX(-50%);
    width: 100%;
    max-width: 28rem;
    z-index: 41;
    background: var(--surface);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    padding: 20px 20px calc(20px + env(safe-area-inset-bottom));
    box-shadow: var(--shadow);
    max-height: 85dvh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
</style>
