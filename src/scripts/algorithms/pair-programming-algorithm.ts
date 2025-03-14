import type { Category } from "../economy-model"
import { calculateUtility } from "../economy-model"
import type { AllocationAlgorithm, AllocationResult } from "./algorithm-interface"

/**
 * pair programming
 */
export class PairProgrammingAlgorithm implements AllocationAlgorithm {
  name = "pair programming"
  description = "pair programming"

  calculate(categories: Category[], budget: number): AllocationResult {
    // Initialize allocations array and counters
    const allocations = categories.map(category => ({
      category,
      quantity: 0,
      utility: 0,
      spent: 0
    }))

    const sortedByUtilityPerBudget = allocations
      .sort((a, b) => b.category.utilityFactor / b.category.price - a.category.utilityFactor / a.category.price)

    
    let remainingBudget = budget
    let totalUtility = 0
    // TODO: Implement your allocation logic here
    // This is a placeholder implementation that buys one unit of each category
    for (const allocation of sortedByUtilityPerBudget) {
      const { category } = allocation
      
      if (category.price <= remainingBudget) {
        // Purchase one unit
        allocation.quantity = 1
        allocation.spent = category.price
        allocation.utility = calculateUtility(category, allocation.quantity)
        
        totalUtility += allocation.utility
        remainingBudget -= category.price
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


function utilityFunction(category: Category, quantity: number) {
  return 
}