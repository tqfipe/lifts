<script lang="ts">
  import type { Route } from '../lib/router';

  let { route }: { route: Route } = $props();

  const tabs = [
    {
      name: 'home',
      href: '#/',
      label: 'Lift',
      d: 'M2.5 12h19M6.5 6.5v11M17.5 6.5v11M9.5 8.5v7M14.5 8.5v7',
    },
    {
      name: 'history',
      href: '#/history',
      label: 'History',
      d: 'M12 7v5l3 3M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9z',
    },
    {
      name: 'stats',
      href: '#/stats',
      label: 'Stats',
      d: 'M4 20v-8M10 20V5M16 20v-6M21 20H3',
    },
    {
      name: 'settings',
      href: '#/settings',
      label: 'Settings',
      d: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1',
    },
  ] as const;
</script>

<nav aria-label="Main">
  {#each tabs as tab (tab.name)}
    <a href={tab.href} class:active={route.name === tab.name} aria-current={route.name === tab.name ? 'page' : undefined}>
      <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d={tab.d} /></svg>
      <span>{tab.label}</span>
    </a>
  {/each}
</nav>

<style>
  nav {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: 0;
    width: 100%;
    max-width: 28rem;
    z-index: 30;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    padding: 8px 10px calc(8px + env(safe-area-inset-bottom));
    background: rgb(16 20 26 / 0.88);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-top: 1px solid var(--hairline);
  }
  a {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 7px 0 5px;
    border-radius: 12px;
    color: var(--text-dim);
    transition: color 0.15s ease, transform 0.1s ease;
  }
  a:active {
    transform: scale(0.92);
  }
  a span {
    font-family: var(--font-display);
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    font-size: 0.62rem;
  }
  a.active {
    color: var(--accent);
  }
  a.active svg {
    filter: drop-shadow(0 0 6px var(--accent-glow));
  }
</style>
