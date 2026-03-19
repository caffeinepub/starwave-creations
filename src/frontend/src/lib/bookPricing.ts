/** Format paise as INR rupees string, e.g. "\u20b9199.00" */
export function formatINR(paise: bigint | number): string {
  return `\u20b9${(Number(paise) / 100).toFixed(2)}`;
}

/** Revenue split note for a given paise amount */
export function splitNote(paise: number): string {
  const creator = (paise * 0.6) / 100;
  const platform = (paise * 0.4) / 100;
  return `Creator receives 60% = \u20b9${creator.toFixed(2)} | Platform: 40% = \u20b9${platform.toFixed(2)}`;
}

/** Unwrap Motoko optional [bigint] | [] to bigint | null */
export function unwrapOptionalBigint(
  val: [] | [bigint] | undefined | null,
): bigint | null {
  if (!val) return null;
  const arr = val as Array<bigint>;
  return arr.length > 0 ? arr[0] : null;
}
