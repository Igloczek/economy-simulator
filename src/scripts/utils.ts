export function utilityFunction(quantity: number, utilityFactor: number, basicNeedAmount: number) {
  return basicNeedAmount * utilityFactor * (1 - Math.exp(-quantity / basicNeedAmount));
}