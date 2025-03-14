import type { Category } from "../economy-model"
import { calculateUtility } from "../economy-model"
import type { AllocationAlgorithm, AllocationResult } from "./algorithm-interface"

/**
 * allocates money proportionally to utility per buck
 */
export class SimpleProportionsAlgorithm implements AllocationAlgorithm {
  name = "simple proportions"
  description = "allocates money proportionally to utility per buck"

  calculate(categories: Category[], budget: number): AllocationResult {
    // Initialize allocations array and counters
    const allocations = categories.map(category => ({
      category,
      quantity: 0,
      utility: 0,
      spent: 0
    }))
    
    let remainingBudget = budget
    let totalUtility = 0

    const totalUtilityPerBuck = categories.reduce((acc, cat) => {
      if (cat.price === 0 || cat.utilityFactor === 0) {
        return acc;
      }
      return acc + (cat.utilityFactor * cat.basicNeedAmount) / cat.price
    }, 0)
    
    // TODO: Implement your allocation logic here
    // This is a placeholder implementation that buys one unit of each category
    let totalSpent = 0
    for (const allocation of allocations) {
      const { category } = allocation
      if (category.price === 0 || category.utilityFactor === 0) {
        allocation.quantity = category.basicNeedAmount;
      } else if (category.price <= remainingBudget) {
        // Purchase one unit
  
        allocation.spent = budget * ( (category.utilityFactor * category.basicNeedAmount) / (category.price) )
        totalSpent += allocation.spent
        allocation.quantity = allocation.spent / category.price
        allocation.utility = allocation.quantity * category.utilityFactor
        
        totalUtility += allocation.utility
        remainingBudget -= category.price
      }
    }

    const lackingBudget = budget - totalSpent
    
    // const totalSpent = budget - remainingBudget
    let message = "This is a scaffold - implement your algorithm logic!"

    return {
      allocations,
      totalUtility,
      totalSpent,
      message,
    }
  }
}