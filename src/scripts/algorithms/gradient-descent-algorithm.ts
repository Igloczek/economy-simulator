import type { Category } from "../economy-model"
import type { AllocationAlgorithm, AllocationResult } from "./algorithm-interface"

/**
 * gradient descent
 */
export class MarginalUtilityOptimizer implements AllocationAlgorithm {
  name = "marginal-utility-optimizer"
  description = "direct solver using equal marginal utility per dollar principle"

  // Single iteration is fine if we allocate properly
  private readonly MAX_ITERATIONS = 1;
  // Remove BASE_STEP_SIZE as we'll allocate all at once
  private readonly EPSILON = Number.EPSILON;
  // Acceptable budget remaining (floating point errors)
  private readonly BUDGET_TOLERANCE = 0.00000001;

  calculate(categories: Category[], budget: number): AllocationResult {
    // Initialize allocations array
    const allocations = categories.map(category => ({
      category,
      quantity: 0,
      utility: 0,
      spent: 0
    }));
    
    // Handle free items and filter out invalid categories
    const usefulAllocations = allocations.filter(allocation => {
      const { category } = allocation;
      
      // Handle free items with positive utility
      if (category.price === 0 && category.utilityFactor > 0 && category.basicNeedAmount > 0) {
        allocation.quantity = category.basicNeedAmount;
        allocation.spent = 0;
        return false; // Don't include in useful allocations
      }
      
      // Filter out items that can't provide utility
      return category.price > 0 && category.utilityFactor > 0 && category.basicNeedAmount > 0;
    });

    if (usefulAllocations.length === 0 || budget <= 0) {
      return this.finalizeResult(allocations, budget, budget, 0);
    }

    // Calculate equal marginal utility per dollar point
    let totalSpent = 0;
    const targetMarginalUtilityPerDollar = this.findOptimalMarginalUtility(usefulAllocations, budget);
    console.log("targetMarginalUtilityPerDollar", targetMarginalUtilityPerDollar)
    // Allocate based on the target marginal utility
    for (const allocation of usefulAllocations) {
      const { category } = allocation;
      
      const quantity = this.solveForQuantity(category, targetMarginalUtilityPerDollar);
      const spent = quantity * category.price;
      
      allocation.quantity = quantity;
      allocation.spent = spent;
      allocation.utility = this.calculateTotalUtility(category, quantity);
      allocation.utilityPerDollar = allocation.utility / spent;
      totalSpent += spent;
    }

    return this.finalizeResult(allocations, budget, budget - totalSpent, 1);
  }

  private findOptimalMarginalUtility(allocations: any[], budget: number): number {
    // Binary search to find the marginal utility per dollar that exactly spends the budget
    let low = 0;
    let high = Math.max(...allocations.map(a => a.category.utilityFactor / a.category.price)) * 2;
    
    while (high - low > this.BUDGET_TOLERANCE) {
      const mid = (low + high) / 2;
      let totalCost = 0;
      
      for (const allocation of allocations) {
        if (allocation.category.price === 0) {
          continue 
        }
        const quantity = this.solveForQuantity(allocation.category, mid);
        totalCost += quantity * allocation.category.price;
      }
      
      if (Math.abs(totalCost - budget) < this.BUDGET_TOLERANCE) {
        return mid;
      }
      
      if (totalCost > budget) {
        low = mid;
      } else {
        high = mid;
      }
    }
    
    return (low + high) / 2;
  }

  private calculateMaxTotalUtility(category: Category): number {
    return (category.utilityFactor * category.basicNeedAmount) / 2
  }

  private solveForQuantity(category: Category, targetMarginalUtilityPerDollar: number): number {
    // Solve for q where marginalUtility(q)/price = target
    // For linear utility with slope m and intercept b:
    // (b + mq)/price = target
    // q = (target * price - b)/m
    
    // const slope = -category.utilityFactor / category.basicNeedAmount;
    // const intercept = category.utilityFactor;
    
    // return Math.min(
    //   Math.max(
    //     0,
    //     (targetMarginalUtilityPerDollar * category.price - intercept) / slope
    //   ),
    //   category.basicNeedAmount
    // );


    const qty = (2 * category.price * targetMarginalUtilityPerDollar) / category.utilityFactor

    if (qty > category.basicNeedAmount) {
      return category.basicNeedAmount
    }

    return qty
  }
  

  private calculateTotalUtility(category: Category, quantity: number): number {
    // For quantities outside valid range, return 0
    // When quantity crosses basic need amount, total utility does not grow anymore
    if (quantity > category.basicNeedAmount) {
      return this.calculateMaxTotalUtility(category)
    }

    return (category.utilityFactor * quantity) /2
  }
  
  /**
   * Helper method to finalize the result
   */
  private finalizeResult(allocations: any[], budget: number, remainingBudget: number, iterations: number): AllocationResult {
    const totalSpent = budget - remainingBudget;
    const totalUtility = allocations.reduce((sum, allocation) => sum + allocation.utility, 0);
    

    // Final debug log
    console.log("Final allocations:", allocations.map(a => ({
      category: a.category.name,
      quantity: a.quantity,
      spent: a.spent,
      utility: a.utility,
      maxQuantity: a.category.basicNeedAmount,
      utilityPerDollar: a.utilityPerDollar
    })));
    
    const message = `Maximized utility after ${iterations} iterations. Spent ${totalSpent.toFixed(2)} of ${budget} budget.`;
    console.log(message);

    return {
      allocations,
      totalUtility,
      totalSpent,
      message,
    }
  }
}