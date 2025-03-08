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
export class PureUtilityAlgorithm implements AllocationAlgorithm {
  name = "Pure Utility Maximizer"
  description =
    "Purely maximizes utility per dollar spent, ignoring necessity levels completely."

  calculate(categories: Category[], budget: number): AllocationResult {
    let remainingBudget = budget
    const allocations = categories.map((category) => ({
      category,
      quantity: 0,
      utility: 0,
      spent: 0,
    }))
    let totalUtility = 0

    // Keep buying units until no more budget or no positive marginal utility
    while (remainingBudget > 0) {
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
            bestIndex = i
          }
        }
      }

      // If we found a category to buy more of
      if (bestIndex !== -1 && bestUtilityPerCost > 0) {
        const allocation = allocations[bestIndex]
        const category = allocation.category

        allocation.quantity += 1
        allocation.spent += category.price

        const newUtility = calculateUtility(category, allocation.quantity)
        const utilityGain = newUtility - allocation.utility

        allocation.utility = newUtility
        totalUtility += utilityGain
        remainingBudget -= category.price
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

    // Check if any basic needs were not met for high necessity items
    const unmetNeeds = allocations.filter(
      (a) =>
        a.quantity < a.category.basicNeedAmount &&
        a.category.necessityLevel > 3,
    )

    if (unmetNeeds.length > 0) {
      const needsList = unmetNeeds.map((a) => a.category.name).join(", ")
      message = `Basic needs not fully met for: ${needsList}. Note: this algorithm does not prioritize necessity.`
    }

    return {
      allocations: allocations.sort((a, b) => b.spent - a.spent), // Sort by amount spent
      totalUtility,
      totalSpent,
      message,
    }
  }
}
