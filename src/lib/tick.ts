let ctx: AudioContext | null = null;

/** Short, quiet mechanical tick for ruler snap points. Safe to call anywhere;
 * silently no-ops when audio is unavailable. Must first be called from a user
 * gesture (pointer events qualify) so the AudioContext is allowed to start. */
export function playTick(): void {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2100, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.02);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.028);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.03);
  } catch {
    // no audio — stay silent
  }
}
