import type { Category } from "../economy-model"
import { calculateUtility } from "../economy-model"
import type { AllocationAlgorithm, AllocationResult } from "./algorithm-interface"

/**
 * ignores necessity and max qty
 */
export class OptimisedMarginalUtilityAlgorithm implements AllocationAlgorithm {
  name = "optimised marginal utility"
  description = "ignores necessity, focuses on maximising utility per buck"

  calculate(categories: Category[], budget: number): AllocationResult {
    const n = categories.length;
    let totalRatio = 0;
    
    // First pass: Compute total ratio.
    for (let i = 0; i < n; i++) {
      const cat = categories[i];
      // If basicNeedAmount is zero or the ratio is not finite, treat ratio as 0.
      let ratio = 0;
      if (cat.basicNeedAmount !== 0 && Number.isFinite(cat.utilityFactor / cat.price)) {
        ratio = cat.utilityFactor / cat.price;
      }
      totalRatio += ratio;
    }
    
    let saturatedSpent = 0;
    let totalUnsatRatio = 0;
    
    // Second pass: Determine total spending on saturated categories and total ratio for unsaturated ones.
    for (let i = 0; i < n; i++) {
      const cat = categories[i];
      let ratio = 0;
      if (cat.basicNeedAmount !== 0 && Number.isFinite(cat.utilityFactor / cat.price)) {
        ratio = cat.utilityFactor / cat.price;
      }
      // Compute initial (unsaturated) allocation:
      const initAlloc = ratio ? (ratio / totalRatio) * (budget / cat.price) : 0;
      if (initAlloc >= cat.basicNeedAmount) {
        saturatedSpent += cat.price * cat.basicNeedAmount;
      } else {
        totalUnsatRatio += ratio;
      }
    }
    
    const remainingBudget = budget - saturatedSpent;
    
    // Third pass: Calculate final allocation per category and build results.
    const results = new Array(n);
    let totalSpent = 0;
    let totalUtility = 0;
    
    for (let i = 0; i < n; i++) {
      const cat = categories[i];
      let ratio = 0;
      if (cat.basicNeedAmount !== 0 && Number.isFinite(cat.utilityFactor / cat.price)) {
        ratio = cat.utilityFactor / cat.price;
      }
      // Recompute the initial allocation:
      const initAlloc = ratio ? (ratio / totalRatio) * (budget / cat.price) : 0;
      let quantity = 0;
      
      // For categories with an invalid ratio, or if the unsaturated optimum exceeds the basic need,
      // assign the full basicNeedAmount.
      if (ratio === 0 || initAlloc >= cat.basicNeedAmount) {
        quantity = cat.basicNeedAmount;
      } else {
        // Reallocate remaining budget proportionally among unsaturated categories.
        quantity = (ratio / totalUnsatRatio) * (remainingBudget / cat.price);
        if (quantity > cat.basicNeedAmount) {
          quantity = cat.basicNeedAmount;
        }
      }
      
      const spent = quantity * cat.price;
      const utility = cat.utilityFactor * (1 - Math.exp(-quantity));
      
      results[i] = { category: cat, quantity, spent, utility };
      totalSpent += spent;
      totalUtility += utility;
    }
    
    return { allocations: results, totalSpent, totalUtility };
  
  }
}