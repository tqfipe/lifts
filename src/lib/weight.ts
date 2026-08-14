import type { WeightUnit } from './types';

export function parseWeight(input: string): number | null {
  const s = input.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function formatWeight(n: number): string {
  return String(n).replace('.', ',');
}

const KG_PER_LB = 0.45359237;

/** Canonical kg → display unit, rounded for display (1 decimal in lb). */
export function toDisplay(kg: number, unit: WeightUnit): number {
  if (unit === 'kg') return kg;
  return Math.round((kg / KG_PER_LB) * 10) / 10;
}

/** Display-unit input → canonical kg (millgram-rounded so lb values round-trip). */
export function fromDisplay(value: number, unit: WeightUnit): number {
  if (unit === 'kg') return value;
  return Math.round(value * KG_PER_LB * 1000) / 1000;
}
