import type { Category } from "../economy-model"
import { calculateUtility } from "../economy-model"
import type { AllocationAlgorithm, AllocationResult } from "./algorithm-interface"

/**
 * ignores necessity and max qty
 */
export class MarginalUtilityAlgorithm implements AllocationAlgorithm {
  name = "marginal utility"
  description = "ignores necessity, focuses on maximising utility per buck"

  calculate(categories: Category[], budget: number): AllocationResult {
    // Step 1. Compute the “bang per buck” ratios.
    const ratios = categories.map(cat => {
      if (cat.basicNeedAmount === 0 || !Number.isFinite(cat.utilityFactor / cat.price)) {
        return null
      }
      return cat.utilityFactor / cat.price;
    });
    // Step 2. Identify saturated categories S:
    // For a first approximation, assume an unsaturated allocation would be
    // proportional to ratios. Then check if the computed allocation exceeds basicNeedAmount.
    const totalRatio = ratios.reduce((a, b) => {
      if (b === null) {
        return a
      }
      return a + b
    }, 0);
    // Compute initial allocation (ignoring saturation)
    const initAllocations = categories.map((cat, i) => {
      if (ratios[i] === null) {
        return 0
      }
      return (ratios[i] / totalRatio) * budget / cat.price;
    });
    
    // Identify S as those whose initial allocation exceeds basicNeedAmount.
    const saturated: boolean[] = initAllocations.map((q, i) => q >= categories[i].basicNeedAmount);
    const saturatedSpent = categories.reduce((sum, cat, i) => {
      return sum + (saturated[i] ? cat.price * cat.basicNeedAmount : 0);
    }, 0);
    
    // Reallocate remaining budget among unsaturated ones.
    const remainingBudget = budget - saturatedSpent;
    const unsaturatedIndices = categories
      .map((_, i) => i)
      .filter(i => !saturated[i]);
    const totalUnsatRatio = unsaturatedIndices.reduce((sum, i) => sum + ratios[i], 0);
    
    const allocations = categories.map((cat, i) => {
      if (ratios[i] === null) {
        return { category: cat, quantity: cat.basicNeedAmount, spent: cat.price * cat.basicNeedAmount, utility: cat.utilityFactor * cat.basicNeedAmount }
      }
      let quantity = saturated[i] ? cat.basicNeedAmount : (ratios[i] / totalUnsatRatio) * (remainingBudget / cat.price);
      // If numerical issues cause a slight overshoot, cap it:
      quantity = Math.min(quantity, cat.basicNeedAmount);
      const spent = quantity * cat.price;
      // For a utility function like U = u * (1 - exp(-k q)) (with, say, k=1), utility is:
      const utility = cat.utilityFactor * (1 - Math.exp(-quantity));
      return { category: cat, quantity, spent, utility };
    });
    
    const totalSpent = allocations.reduce((sum, a) => sum + a.spent, 0);
    const totalUtility = allocations.reduce((sum, a) => sum + a.utility, 0);
    
    return { allocations, totalSpent, totalUtility };
  }
}