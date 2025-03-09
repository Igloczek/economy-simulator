import type { Category } from "../economy-model"
import { calculateUtility } from "../economy-model"
import type { AllocationAlgorithm, AllocationResult } from "./algorithm-interface"

/**
 * optimised margin utility but for checks for max budget allocation
 */
export class OptimisedMarginalUtilityBudgetFixAlgorithm implements AllocationAlgorithm {
  name = "optimised marginal utility budget fix"
  description = "optimised marginla utility but for checks for max budget allocation"

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
      } else {
        ratio = null;
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
      
      // If invalid ratio or the unsaturated optimum exceeds basicNeedAmount, use basicNeedAmount.
      if (ratio === null) {
        quantity = cat.basicNeedAmount;
      } else if (ratio === 0 || initAlloc >= cat.basicNeedAmount) {
        quantity = cat.basicNeedAmount;
      } else {
        // Allocate remaining budget among unsaturated categories.
        quantity = (ratio / totalUnsatRatio) * (remainingBudget / cat.price);
        if (quantity > cat.basicNeedAmount) {
          quantity = cat.basicNeedAmount;
        }
      }
      
      const spent = quantity * cat.price;
      const utility = cat.utilityFactor * (1 - Math.exp(-quantity));
      results[i] = { category: cat, quantity, spent, utility, utilityPerBuckOfNextQuantity: 0  };
      
      totalSpent += spent;
      totalUtility += utility;
    }
    
    // COMMENTED OUT BECAUSE IT'S DUMB, it shouldn't be just dumped into one category
    // it should be distributed among the categories based on the ratio of the total utility
    // Final step: if there's any leftover budget, assign it to one category.
    // if (totalSpent < budget) {
    //   const leftover = budget - totalSpent;
    //   // For example, pick the category with the lowest price to add extra quantity.
    //   let extraIndex = 0;
    //   let minPrice = categories[0].price;
    //   for (let i = 1; i < n; i++) {
    //     if (categories[i].price < minPrice && categories[i].price > 0) {
    //       minPrice = categories[i].price;
    //       extraIndex = i;
    //     }
    //   }
    //   const extraQuantity = categories[extraIndex].price > 0 ? leftover / categories[extraIndex].price : 0;
    //   // Increase quantity and spent for that category.
    //   results[extraIndex].quantity += extraQuantity;
    //   results[extraIndex].spent += leftover;
    //   totalSpent += leftover;
    //   // Note: extra quantity is beyond the basicNeedAmount, so utility remains unchanged.
    // }
    
    return { allocations: results, totalSpent, totalUtility };
  }
}