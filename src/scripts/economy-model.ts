// Economy Simulator Model
// This file contains core types and utility calculation for the economy simulator

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

// Note: The calculateOptimalSpending function has been moved to separate algorithm implementations
// See the 'algorithms' directory for different implementations of spending optimization strategies
