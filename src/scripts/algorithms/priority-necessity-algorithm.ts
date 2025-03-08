import type { Category } from "../economy-model"
import { calculateUtility } from "../economy-model"
import type {
  AllocationAlgorithm,
  AllocationResult,
} from "./algorithm-interface"

/**
 * This algorithm prioritizes meeting basic needs for higher necessity items first,
 * then uses a greedy approach to maximize marginal utility with the remaining budget.
 */
export class PriorityNecessityAlgorithm implements AllocationAlgorithm {
  name = "Priority Necessity"
  description =
    "Prioritizes meeting basic needs for high-necessity items first, then maximizes marginal utility with remaining budget."

  calculate(categories: Category[], budget: number): AllocationResult {
    // Sort categories strictly by necessity level first, then by utility-to-price ratio
    const sortedCategories = [...categories].sort((a, b) => {
      // First sort by necessity level (higher necessity first)
      if (b.necessityLevel !== a.necessityLevel) {
        return b.necessityLevel - a.necessityLevel
      }
      // Then by utility-to-price ratio
      return b.utilityFactor / b.price - a.utilityFactor / a.price
    })

    let remainingBudget = budget
    const allocations = []
    let totalUtility = 0

    // First pass: Try to meet basic needs for highest necessity categories first
    // We'll go category by category in strict priority order
    for (const category of sortedCategories) {
      if (category.price <= 0) continue

      // Initialize allocation for this category
      const allocation = {
        category,
        quantity: 0,
        utility: 0,
        spent: 0,
      }

      allocations.push(allocation)

      // Try to meet as much of the basic needs as possible for this category
      // before moving to the next one
      while (
        allocation.quantity < category.basicNeedAmount &&
        remainingBudget >= category.price
      ) {
        // Buy one more unit
        allocation.quantity += 1
        allocation.spent += category.price
        remainingBudget -= category.price
      }

      // Calculate the utility for this allocation
      allocation.utility = calculateUtility(category, allocation.quantity)
      totalUtility += allocation.utility
    }

    // Second pass: Now that we've met as many high-priority basic needs as possible,
    // use the greedy approach to allocate any remaining budget for additional utility
    while (remainingBudget > 0) {
      let bestCategory = null
      let bestUtilityPerCost = 0
      let bestIndex = -1

      // Find the category with the highest marginal utility per cost
      for (let i = 0; i < allocations.length; i++) {
        const allocation = allocations[i]
        const category = allocation.category

        if (category.price <= remainingBudget) {
          // Calculate the marginal utility of buying one more unit
          const currentUtility = calculateUtility(category, allocation.quantity)
          const newUtility = calculateUtility(category, allocation.quantity + 1)
          const marginalUtility = newUtility - currentUtility
          const utilityPerCost = marginalUtility / category.price

          if (utilityPerCost > bestUtilityPerCost) {
            bestUtilityPerCost = utilityPerCost
            bestCategory = category
            bestIndex = i
          }
        }
      }

      // If we found a category to buy more of
      if (bestCategory && bestUtilityPerCost > 0) {
        const allocation = allocations[bestIndex]
        allocation.quantity += 1
        allocation.spent += bestCategory.price
        const newUtility = calculateUtility(bestCategory, allocation.quantity)
        const utilityGain = newUtility - allocation.utility
        allocation.utility = newUtility
        totalUtility += utilityGain
        remainingBudget -= bestCategory.price
      } else {
        // We can't spend any more money effectively
        break
      }
    }

    const totalSpent = budget - remainingBudget
    let message = ""

    if (totalSpent < budget) {
      message = `Budget not fully spent. Remaining: ${remainingBudget.toFixed(2)}`
    }

    // Check if any basic needs were not met
    const unmetNeeds = allocations.filter(
      (a) =>
        a.quantity < a.category.basicNeedAmount &&
        a.category.necessityLevel > 3,
    )

    if (unmetNeeds.length > 0) {
      const needsList = unmetNeeds.map((a) => a.category.name).join(", ")
      message = `Basic needs not fully met for: ${needsList}. Budget insufficient.`
    }

    return {
      allocations,
      totalUtility,
      totalSpent,
      message,
    }
  }
}
