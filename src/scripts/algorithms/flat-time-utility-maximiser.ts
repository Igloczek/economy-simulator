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
    // Guard against invalid input
    if (categories.length === 0 || budget <= 0) {
      return {
        allocations: [],
        totalUtility: 0,
        totalSpent: 0,
        message: "No categories or zero budget"
      };
    }

    // Filter out categories with zero or negative price
    const validCategories = categories.filter(cat => cat.price > 0);
    if (validCategories.length === 0) {
      return {
        allocations: categories.map(cat => ({
          category: cat,
          quantity: 0,
          utility: 0,
          spent: 0
        })),
        totalUtility: 0,
        totalSpent: 0,
        message: "No valid categories found with positive prices"
      };
    }

    // Step 1: Calculate the marginal utility per dollar for each category at different quantities
    // We'll sample at various levels to build a priority queue
    const purchaseOptions: Array<{
      index: number;
      category: Category;
      quantity: number;
      marginalUtility: number;
      price: number;
      utilityPerDollar: number;
      totalUtility: number;
      totalCost: number;
    }> = [];

    // Generate purchase options for each category
    for (let i = 0; i < validCategories.length; i++) {
      const cat = validCategories[i];
      const originalIndex = categories.indexOf(cat);
      const basicNeedAmount = cat.basicNeedAmount || 1;
      
      // Add options at different percentage levels of basic need
      // More granular levels with a strong focus around 100% of basic need
      const levels = [0.25, 0.5, 0.75, 0.85, 0.95, 1.0];
      
      for (const level of levels) {
        const quantity = basicNeedAmount * level;
        // Find the previous level in the array for calculating the increment
        const prevLevelIndex = levels.indexOf(level) - 1;
        const prevLevel = prevLevelIndex >= 0 ? levels[prevLevelIndex] : 0;
        const prevQuantity = basicNeedAmount * prevLevel;
        
        // Calculate marginal utility of this increment
        const totalUtilityAtQuantity = calculateMarginalUtility(cat, quantity);
        const totalUtilityAtPrevQuantity = calculateMarginalUtility(cat, prevQuantity);
        
        const marginalUtility = totalUtilityAtQuantity - totalUtilityAtPrevQuantity;
        const incrementCost = cat.price * (quantity - prevQuantity);
        
        if (incrementCost <= 0) continue;
        
        const utilityPerDollar = marginalUtility / incrementCost;
        
        purchaseOptions.push({
          index: originalIndex,
          category: cat,
          quantity: quantity - prevQuantity, // This is the increment
          marginalUtility,
          price: cat.price,
          utilityPerDollar,
          totalUtility: marginalUtility,
          totalCost: incrementCost
        });
      }
    }
    
    // Sort purchase options by utility per dollar (highest first)
    purchaseOptions.sort((a, b) => b.utilityPerDollar - a.utilityPerDollar);
    
    // Step 2: Allocate budget greedily using the sorted purchase options
    let quantities: number[] = new Array(categories.length).fill(0);
    let spentAmounts: number[] = new Array(categories.length).fill(0);
    let totalSpent = 0;
    
    for (const option of purchaseOptions) {
      if (totalSpent + option.totalCost <= budget) {
        // We can afford this option entirely
        quantities[option.index] += option.quantity;
        spentAmounts[option.index] += option.totalCost;
        totalSpent += option.totalCost;
      } else {
        // We can only afford part of this option
        const remainingBudget = budget - totalSpent;
        const fractionAffordable = remainingBudget / option.totalCost;
        
        quantities[option.index] += option.quantity * fractionAffordable;
        spentAmounts[option.index] += remainingBudget;
        totalSpent = budget;
        break;
      }
    }
    
    // Handle free items (price = 0)
    for (let i = 0; i < categories.length; i++) {
      if (categories[i].price <= 0 && categories[i].basicNeedAmount) {
        quantities[i] = categories[i].basicNeedAmount;
        spentAmounts[i] = 0;
      }
    }
    
    // Create allocations array for the return value
    const allocations = categories.map((cat, i) => ({
      category: cat,
      quantity: quantities[i],
      utility: cat.utilityFactor * quantities[i],
      spent: spentAmounts[i]
    }));

    // Calculate total utility more precisely
    let totalUtility = 0;
    for (let i = 0; i < categories.length; i++) {
      if (quantities[i] > 0) {
        totalUtility += calculateMarginalUtility(categories[i], quantities[i]);
      }
    }
    
    // Add warnings or messages
    let message = "";
    if (totalSpent < budget * 0.99) {
      const remaining = budget - totalSpent;
      const percentRemaining = (remaining / budget) * 100;
      message = `Budget not fully spent. Remaining: ${remaining.toFixed(2)} (${percentRemaining.toFixed(2)}%)`;
    }
    
    return {
      allocations: allocations.sort((a, b) => b.spent - a.spent), // Sort by amount spent
      totalUtility,
      totalSpent,
      message,
    }
  }
}

/**
 * Calculate the total utility for a given category and quantity,
 * taking into account diminishing returns.
 */
function calculateMarginalUtility(category: Category, quantity: number): number {
  const f = category.utilityFactor;
  const b = category.basicNeedAmount || 1;
  const d = category.diminishingFactor || 0.5;
  
  if (quantity <= 0) return 0;
  
  // For quantity up to basic need, utility is linear
  if (quantity <= b) {
    return f * quantity;
  }
  
  // For quantity beyond basic need, apply MUCH more aggressive diminishing returns
  // Base utility for the basic need amount
  const baseUtility = f * b;
  
  // Calculate excess quantity as a ratio of basic need
  const excessRatio = (quantity - b) / b;
  
  // Apply a much steeper diminishing factor
  // Using the diminishing factor raised to a higher power for faster decay
  // The higher the exponent, the more severe the diminishing returns
  const diminishingPower = 3; // Cubic diminishing returns
  const diminishingFactor = Math.pow(d, excessRatio * diminishingPower);
  
  // Further penalize excess with a hyperbolic function
  const excessPenalty = 1 / (1 + excessRatio);
  
  // Combine the penalties for a steeper drop-off
  return baseUtility + (f * (quantity - b) * diminishingFactor * excessPenalty);
}

// These utility functions are still used by other algorithms
function computeOptimalQuantity(category: Category, lambda: number): number {
  const f = category.utilityFactor;
  const price = category.price;
  const N = category.necessityLevel || 1; // Ensure N is not zero
  const b = category.basicNeedAmount || 0; // Default to 0 if not set
  const d = Math.max(0.01, category.diminishingFactor || 0.9); // Ensure d is positive but not 1
  
  // Guard against division by zero
  if (f <= 0 || price <= 0) return 0;
  
  try {
    // Region A: q < b
    // q_A = [ (λ·price·b^(1/N)) / (f·(N+1)) ]^N
    let qA = 0;
    if (b > 0) {
      const base = (lambda * price * Math.pow(b, 1/N)) / (f * (N+1));
      qA = base > 0 ? Math.pow(base, N) : 0;
    } else {
      qA = 0;
    }
    
    if (qA < b) {
      return Math.max(0, qA);
    } else {
      // Region B: q >= b.
      // Let A = λ·price / f.
      const A = lambda * price / f;
      // At q = b (i.e. x = 0), the derivative is f.
      // If A >= 1, the marginal utility is already too low to justify extra quantity.
      if (A >= 1) {
        return b;
      }
      
      try {
        // Otherwise, solve for x in f * d^x * (1 + x·ln(d)) = λ·price.
        // Rearranged: (1 + x·ln(d)) * exp(x·ln(d)) = A.
        // Let y = x·ln(d), then (1 + y)e^y = A.
        // So y = W(e*A) - 1, and x = y / ln(d).
        const y = lambertW(Math.E * A) - 1;
        const lnD = Math.log(d);
        
        // Guard against division by zero in log(d)
        if (Math.abs(lnD) < 1e-10) {
          return b;
        }
        
        const x = y / lnD;
        return Math.max(0, b + x);
      } catch (e) {
        // If lambertW fails, return a safe fallback
        return b;
      }
    }
  } catch (e) {
    // If any calculation fails, return 0
    return 0;
  }
}

// A simple Lambert W function approximation (for x >= -1/e, and we assume x > 0 here)
function lambertW(x: number): number {
  // Guard rails for input
  if (x < -0.36787944117144233) { // -1/e
    return -1; // Default fallback for invalid input
  }
  if (x === 0) return 0;
  
  // Initial guess
  let w = Math.log(1 + Math.max(0, x));
  
  // Use Halley's method for iteration with a maximum iteration count
  const MAX_ITERATIONS = 20;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    try {
      const eW = Math.exp(w);
      const wEw = w * eW;
      const f = wEw - x;
      
      // Check if we're already close enough
      if (Math.abs(f) < 1e-10) {
        return w;
      }
      
      const denominator = eW * (w + 1) - ((w + 2) * f) / (2 * (w + 1));
      
      // Guard against division by zero
      if (Math.abs(denominator) < 1e-10) {
        return w;
      }
      
      const wNext = w - f / denominator;
      
      if (Math.abs(w - wNext) < 1e-8) {
        return wNext;
      }
      w = wNext;
    } catch (e) {
      // If any calculation fails, return the current approximation
      return w;
    }
  }
  
  // If we didn't converge, return the best approximation we have
  return w;
}
