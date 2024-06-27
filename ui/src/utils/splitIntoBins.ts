export const splitIntoBins = (n: number, maxBins: number = 5): number[] => {
  const baseSize = Math.floor(n / maxBins);
  const binsWithExtra = n % maxBins;
  const bins = Array(maxBins).fill(baseSize);
  for (let i = 0; i < binsWithExtra; i++) {
      bins[i] += 1;
  }
  return bins.filter((b: number) => b > 0);
}

export const splitIntoDomains = (n: number, maxBins: number = 5): number[] => (
  splitIntoBins(n, maxBins).reduce((acc: number[], curr: number, idx: number) => (
    idx === 0 ? [curr] : [...acc, curr + acc[idx - 1]]
  ), [] as number[])
);

export default splitIntoDomains;
