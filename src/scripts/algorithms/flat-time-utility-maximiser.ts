import type { Category } from "../economy-model"
import { calculateUtility } from "../economy-model"
import type {
  AllocationAlgorithm,
  AllocationResult,
} from "./algorithm-interface"

/**
 * This algorithm ignores necessity levels and allocates budget
 * purely based on utility-to-price ratio for maximum efficiency.
 */
export class FlatTimeUtilityMaximisationAlgorithm implements AllocationAlgorithm {
  name = "Flat Time Pure Utility Maximizer"
  description =
    "Purely maximizes utility per dollar spent, ignoring necessity levels completely."

  calculate(categories: Category[], budget: number, tolerance: number = 0.001): AllocationResult {
    // Determine an initial search range for lambda.
    let lambdaLow = 0;
    // For lambdaHigh you might use the highest initial marginal utility per cost.
    let lambdaHigh = 0;
    for (let i = 0; i < categories.length; i++) {
      const ratio = categories[i].utilityFactor / categories[i].price;
      if (ratio > lambdaHigh) {
        lambdaHigh = ratio;
      }
    }
    
    let lambda = 0;
    let totalSpent = 0;
    
    // Binary search for lambda.
    while (lambdaHigh - lambdaLow > tolerance) {
      console.log('lambda')
      lambda = (lambdaHigh + lambdaLow) / 2;
      totalSpent = 0;
      // Single pass over categories to compute optimal q_i for current lambda.
      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        // computeOptimalQuantity should be derived from your utility function.
        const q = computeOptimalQuantity(cat, lambda);
        totalSpent += cat.price * q;
        // Optionally, store q in the category object if you wish.
        cat['quantity'] = q;
        cat.spent = cat.price * q;
      }
      if (totalSpent > budget) {
        // If we’re spending too much, increase lambda (reducing quantities)
        lambdaLow = lambda;
      } else {
        lambdaHigh = lambda;
      }
    }

    let totalUtility = 0
    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      totalUtility += cat.utilityFactor * cat.quantity;
    }
    let message = ""

    if (totalSpent < budget) {
      message = `Budget not fully spent. Remaining: ${budget - totalSpent}`
    }
    
    return {
      allocations: allocations.sort((a, b) => b.spent - a.spent), // Sort by amount spent
      totalUtility,
      totalSpent,
      message,
    }
  }
}



function computeOptimalQuantity(category: Category, lambda: number): number {
  const f = category.utilityFactor;
  const price = category.price;
  const N = category.necessityLevel;
  const b = category.basicNeedAmount;
  const d = category.diminishingFactor;

  // Region A: q < b
  // q_A = [ (λ·price·b^(1/N)) / (f·(N+1)) ]^N
  const qA = Math.pow((lambda * price * Math.pow(b, 1 / N)) / (f * (N + 1)), N);
  if (qA < b) {
    return qA;
  } else {
    // Region B: q >= b.
    // Let A = λ·price / f.
    const A = lambda * price / f;
    // At q = b (i.e. x = 0), the derivative is f.
    // If A >= 1, the marginal utility is already too low to justify extra quantity.
    if (A >= 1) {
      return b;
    }
    // Otherwise, solve for x in f * d^x * (1 + x·ln(d)) = λ·price.
    // Rearranged: (1 + x·ln(d)) * exp(x·ln(d)) = A.
    // Let y = x·ln(d), then (1 + y)e^y = A.
    // So y = W(e*A) - 1, and x = y / ln(d).
    const y = lambertW(Math.E * A) - 1;
    const x = y / Math.log(d);
    return b + x;
  }
}

// A simple Lambert W function approximation (for x >= -1/e, and we assume x > 0 here)
function lambertW(x: number): number {
  // Initial guess
  let w = Math.log(1 + x);
  // Use Halley's method for iteration
  for (let i = 0; i < 20; i++) {
    const eW = Math.exp(w);
    const wEw = w * eW;
    const f = wEw - x;
    const denominator = eW * (w + 1) - ((w + 2) * f) / (2 * (w + 1));
    const wNext = w - f / denominator;
    if (Math.abs(w - wNext) < 1e-8) {
      return wNext;
    }
    w = wNext;
  }
  return w;
}
