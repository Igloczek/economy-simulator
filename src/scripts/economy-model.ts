// Economy Simulator Model
// This file contains the core logic for the economy simulator

// Define the category type
export interface Category {
  name: string
  price: number
  utilityFactor: number
  // Basic need amount - the quantity required to satisfy basic needs
  basicNeedAmount: number
  // Diminishing returns factor - how quickly utility drops after basic needs are met (0-1)
  diminishingFactor: number
  // Necessity level (1-10) - how essential this category is for survival
  // 10 = Absolute necessity (shelter, basic food)
  // 1 = Pure luxury
  necessityLevel: number
}

// Calculate the utility for a specific quantity of a category
export function calculateUtility(category: Category, quantity: number): number {
  // For zero quantity of high-necessity items, return extremely negative utility
  // This ensures basic necessities are always prioritized
  if (quantity === 0 && category.necessityLevel > 5) {
    return -1000 * category.necessityLevel // Strong negative utility for unmet high necessities
  }

  // For quantities below basic needs, use a function that grows rapidly at first
  // This represents the critical nature of essential goods' first units
  if (quantity < category.basicNeedAmount) {
    // Calculate what percentage of basic need is met
    const needSatisfactionRatio = quantity / category.basicNeedAmount

    // Apply necessity level to make essential items more important
    // For high necessity items, utility grows more rapidly as first units are acquired
    // This creates a steep utility curve for essential items
    return (
      category.utilityFactor *
      category.necessityLevel *
      Math.pow(needSatisfactionRatio, 1 / category.necessityLevel) *
      quantity
    )
  }

  // Base utility from meeting the basic needs - full value
  const baseUtility =
    category.utilityFactor * category.necessityLevel * category.basicNeedAmount

  // Additional utility from excess quantity (with diminishing returns)
  const excessQuantity = quantity - category.basicNeedAmount
  const diminishedUtility =
    excessQuantity *
    category.utilityFactor *
    Math.pow(category.diminishingFactor, excessQuantity)

  return baseUtility + diminishedUtility
}

// Calculate optimal spending to maximize utility within budget
export function calculateOptimalSpending(
  categories: Category[],
  budget: number,
): {
  allocations: {
    category: Category
    quantity: number
    utility: number
    spent: number
  }[]
  totalUtility: number
  totalSpent: number
  message?: string
} {
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
      a.quantity < a.category.basicNeedAmount && a.category.necessityLevel > 3,
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
