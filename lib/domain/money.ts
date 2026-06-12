/**
 * Integer money math. All amounts are cents; all shares are basis points
 * (10000 = 100%). Rounding is half away from zero so a chargeback (negative
 * amount) splits as the exact mirror of the payment it reverses.
 */

export function roundHalfAwayFromZero(n: number): number {
  return Math.sign(n) * Math.round(Math.abs(n));
}

/** The bps share of an amount in cents, rounded half away from zero. */
export function applyBps(amountCents: number, bps: number): number {
  return roundHalfAwayFromZero((amountCents * bps) / 10000);
}
