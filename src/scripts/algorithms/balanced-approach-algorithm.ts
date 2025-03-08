import type { Category } from "../economy-model"
import { calculateUtility } from "../economy-model"
import type {
  AllocationAlgorithm,
  AllocationResult,
} from "./algorithm-interface"

/**
 * This algorithm takes a balanced approach by allocating a percentage of the budget
 * to meet basic needs first, then optimizing the remaining budget for maximum utility.
 */
export class BalancedApproachAlgorithm implements AllocationAlgorithm {
  name = "Balanced Approach"
  description =
    "Allocates 60% of budget to basic needs based on necessity, then optimizes remaining 40% for maximum utility."

  // Percentage of budget allocated to basic needs (0-1)
  private basicNeedsBudgetRatio = 0.6

  calculate(categories: Category[], budget: number): AllocationResult {
    // Split budget between basic needs and discretionary spending
    const basicNeedsBudget = budget * this.basicNeedsBudgetRatio
    let discretionaryBudget = budget - basicNeedsBudget

    // Initialize allocations
    const allocations = categories.map((category) => ({
      category,
      quantity: 0,
      utility: 0,
      spent: 0,
    }))

    let remainingBasicBudget = basicNeedsBudget
    let totalUtility = 0

    // Phase 1: Allocate budget for basic needs based on necessity level
    // Sort categories by necessity level
    const sortedIndices = allocations
      .map((_, index) => index)
      .sort(
        (a, b) => categories[b].necessityLevel - categories[a].necessityLevel,
      )

    // First pass - try to meet at least some basic needs for each category
    for (const index of sortedIndices) {
      const allocation = allocations[index]
      const category = allocation.category

      // Skip if price is invalid
      if (category.price <= 0) continue

      // Calculate how many units we can afford with proportional budget
      // Higher necessity items get proportionally more budget
      const necessityRatio = category.necessityLevel / 10
      const categoryBasicBudget = remainingBasicBudget * necessityRatio

      // How many units we can afford
      const affordableUnits = Math.floor(categoryBasicBudget / category.price)

      // How many units to buy (up to basic need amount)
      const unitsToBuy = Math.min(affordableUnits, category.basicNeedAmount)

      if (unitsToBuy > 0) {
        allocation.quantity = unitsToBuy
        allocation.spent = unitsToBuy * category.price
        allocation.utility = calculateUtility(category, allocation.quantity)
        totalUtility += allocation.utility

        remainingBasicBudget -= allocation.spent
      }
    }

    // Add any remaining basic budget to discretionary budget
    discretionaryBudget += remainingBasicBudget

    // Phase 2: Allocate remaining budget based on maximum utility per cost
    while (discretionaryBudget > 0) {
      let bestUtilityPerCost = 0
      let bestIndex = -1

      // Find the category with the highest marginal utility per cost
      for (let i = 0; i < allocations.length; i++) {
        const allocation = allocations[i]
        const category = allocation.category

        if (category.price <= discretionaryBudget) {
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
        discretionaryBudget -= category.price
      } else {
        // We can't spend any more money effectively
        break
      }
    }

    const totalSpent = budget - discretionaryBudget
    let message = ""

    if (totalSpent < budget) {
      message = `Budget not fully spent. Remaining: ${discretionaryBudget.toFixed(2)}`
    }

    // Check if any basic needs were not met for high necessity items
    const unmetNeeds = allocations.filter(
      (a) =>
        a.quantity < a.category.basicNeedAmount &&
        a.category.necessityLevel > 5,
    )

    if (unmetNeeds.length > 0) {
      const needsList = unmetNeeds.map((a) => a.category.name).join(", ")
      message = `Basic needs not fully met for: ${needsList}. Budget insufficient.`
    }

    return {
      allocations: allocations.sort(
        (a, b) =>
          // Sort by necessity level first
          b.category.necessityLevel - a.category.necessityLevel ||
          // Then by amount spent
          b.spent - a.spent,
      ),
      totalUtility,
      totalSpent,
      message,
    }
  }
}
