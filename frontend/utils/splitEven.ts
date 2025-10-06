export function splitEven(total: number, n: number, roundTo = 1000) {
  if (n <= 0) return { per: 0, remainders: [] as number[] };
  // làm tròn xuống đến bội số roundTo
  const base = Math.floor(total / n / roundTo) * roundTo;
  let used = base * n;
  let remain = total - used;

  const remainders = new Array(n).fill(0);
  // dồn phần dư từng 1.000 vào những người đầu tiên
  const step = roundTo;
  let i = 0;
  while (remain >= step) {
    remainders[i % n] += step;
    remain -= step;
    i++;
    if (i > n * 1000) break; // safety
  }
  return { per: base, remainders };
}
