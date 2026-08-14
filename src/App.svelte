<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { app, init } from './lib/store.svelte';
  import { parseRoute, type Route } from './lib/router';
  import { isStorageAvailable } from './lib/storage';
  import { toasts } from './lib/toast.svelte';
  import BottomNav from './components/BottomNav.svelte';
  import Home from './routes/Home.svelte';
  import Workout from './routes/Workout.svelte';
  import History from './routes/History.svelte';
  import Stats from './routes/Stats.svelte';
  import SettingsScreen from './routes/SettingsScreen.svelte';

  let route = $state<Route>(parseRoute(location.hash));

  onMount(() => {
    void init();
    const onHash = (): void => {
      route = parseRoute(location.hash);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  });
</script>

{#if app.ready}
  <main>
    {#if !isStorageAvailable()}
      <p class="warn">Storage unavailable — data won't survive a reload. Export a backup now.</p>
    {/if}
    {#if route.name === 'home'}
      <Home />
    {:else if route.name === 'workout'}
      <Workout id={route.id} />
    {:else if route.name === 'history'}
      <History />
    {:else if route.name === 'stats'}
      <Stats />
    {:else if route.name === 'settings'}
      <SettingsScreen />
    {/if}
  </main>
  {#if route.name !== 'workout'}
    <BottomNav {route} />
  {/if}
{/if}

<div class="toasts">
  {#each toasts as t (t.id)}
    <div class="toast" transition:fly={{ y: 20, duration: 180 }}>{t.msg}</div>
  {/each}
</div>

<style>
  main {
    max-width: 28rem;
    margin: 0 auto;
    padding: calc(14px + env(safe-area-inset-top)) 16px var(--nav-clearance);
  }
  .warn {
    background: rgb(255 93 93 / 0.12);
    border: 1px solid var(--danger);
    color: var(--danger);
    padding: 12px;
    border-radius: var(--radius);
    font-size: 0.9rem;
    margin-bottom: 16px;
  }
  .toasts {
    position: fixed;
    bottom: calc(96px + env(safe-area-inset-bottom));
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    z-index: 60;
    pointer-events: none;
  }
  .toast {
    background: var(--surface-2);
    color: var(--text);
    padding: 10px 18px;
    border-radius: 999px;
    box-shadow: var(--shadow);
    font-size: 0.9rem;
  }
</style>
