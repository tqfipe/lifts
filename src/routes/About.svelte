<header>
  <a href="#/settings" aria-label="Back to settings">
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 5l-7 7 7 7" /></svg>
  </a>
  <h1 class="display">About</h1>
</header>

<div class="hero">
  <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="var(--accent)" stroke-width="1.7" stroke-linecap="round"><path d="M2.5 12h19M6.5 6.5v11M17.5 6.5v11M9.5 8.5v7M14.5 8.5v7" /></svg>
  <p class="wordmark display">Lifts<span class="tick">.</span></p>
  <p class="tagline">A workout log that stays out of your way — and on your phone.</p>
</div>

<section>
  <h2 class="display">Why it exists</h2>
  <p>
    Lifts replaces the notes file you scribble between sets. Grab your phone, tap the exercise,
    confirm the weight it predicted, put the phone down. That whole loop is designed for one hand
    and a resting heart rate that's still coming down.
  </p>
</section>

<section>
  <h2 class="display">Your data stays yours</h2>
  <p>
    Everything lives only in this device's browser storage. There is no account, no cloud, no
    server, and after the app loads it makes no network requests at all. The flip side: if you
    lose the device or clear the browser's site data, the history goes with it — so export a
    backup from Settings now and then.
  </p>
</section>

<section>
  <h2 class="display">What it tracks for you</h2>
  <p>
    Weights are pre-filled from your last session, personal bests are detected automatically (only
    a strict improvement counts), workouts can be saved as templates, and the Stats tab shows your
    progression per exercise. Weights are stored in kilograms and shown in whichever unit you pick
    in Settings.
  </p>
</section>

<section>
  <h2 class="display">Bringing old notes along</h2>
  <p>
    Settings → “Copy LLM conversion prompt” gives you a prompt you can paste into any AI chat
    together with your freetext workout notes. It returns JSON that the importer understands, so
    your history, PBs, and predictions carry over.
  </p>
</section>

<style>
  header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 10px 0 8px;
  }
  header a {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    color: var(--text-dim);
  }
  h1 {
    font-size: 2.1rem;
    line-height: 1;
  }
  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    text-align: center;
    padding: 26px 0 10px;
  }
  .wordmark {
    font-size: 2.4rem;
    line-height: 1;
  }
  .tick {
    color: var(--accent);
  }
  .tagline {
    color: var(--text-dim);
    font-size: 0.95rem;
    max-width: 24rem;
  }
  section {
    background: var(--surface-grad);
    border: 1px solid var(--hairline);
    border-radius: var(--radius);
    padding: 16px;
    margin-top: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  h2 {
    font-size: 0.95rem;
    letter-spacing: 0.12em;
    color: var(--accent);
  }
  p {
    font-size: 0.92rem;
    line-height: 1.55;
    color: var(--text);
  }
</style>
