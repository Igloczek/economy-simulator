import type { Category } from "../economy-model"
import { calculateUtility } from "../economy-model"
import type { AllocationAlgorithm, AllocationResult } from "./algorithm-interface"

/**
 * blur
 */
export class BlurAlgorithm implements AllocationAlgorithm {
  name = "blur"
  description = "blur"

  calculate(categories: Category[], budget: number): AllocationResult {
    // Initialize allocations array and counters
    const allocations = categories.map(category => ({
      category,
      quantity: 0,
      utility: 0,
      spent: 0
    }))

    const sortedByUtilityPerBudget = allocations.sort((a, b) => b.category.utilityFactor / b.category.price - a.category.utilityFactor / a.category.price)
    
    let remainingBudget = budget
    let totalUtility = 0
    
    // TODO: Implement your allocation logic here
    // This is a placeholder implementation that buys one unit of each category
    for (const allocation of sortedByUtilityPerBudget) {
      const { category } = allocation
      
      if (category.price <= remainingBudget) {


        const canAffordRatio = remainingBudget / (category.price * category.basicNeedAmount) <= 1 ? remainingBudget / (category.price * category.basicNeedAmount) : 1
        // Purchase one unit
        allocation.quantity = allocation.category.basicNeedAmount * canAffordRatio
        allocation.spent = category.price * allocation.category.basicNeedAmount * canAffordRatio
        allocation.utility = category.utilityFactor * allocation.category.basicNeedAmount * canAffordRatio
        
        totalUtility += allocation.utility * allocation.category.basicNeedAmount * canAffordRatio
        remainingBudget -= category.price * allocation.category.basicNeedAmount * canAffordRatio  
      }
    }
    
    const totalSpent = budget - remainingBudget
    let message = "This is a scaffold - implement your algorithm logic!"

    return {
      allocations,
      totalUtility,
      totalSpent,
      message,
    }
  }
}