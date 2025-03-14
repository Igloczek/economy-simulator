import type { Category } from "../economy-model"
import { calculateUtility } from "../economy-model"
import type {
  AllocationAlgorithm,
  AllocationResult,
} from "./algorithm-interface"

/**
 * Groups categories into buckets based on utility per dollar,
 * then distributes budget proportionally based on group utility potential
 */
export class BucketUtilitySmoothingAlgorithm implements AllocationAlgorithm {
  name = "Bucket Utility Smoothing"
  description =
    "Groups items into utility buckets and distributes budget for smoother allocation"

  // Number of buckets to divide categories into (can be adjusted)
  private NUM_BUCKETS = 3

  calculate(categories: Category[], budget: number): AllocationResult {
    // Initialize allocations array
    const allocations = categories.map((category) => ({
      category,
      quantity: 0,
      utility: 0,
      spent: 0,
    }))

    // Handle empty categories or zero budget
    if (categories.length === 0 || budget <= 0) {
      return {
        allocations,
        totalUtility: 0,
        totalSpent: 0,
        message: "No categories or budget provided",
      }
    }

    // Calculate utility per dollar for each category
    const categoriesWithUtilityPerDollar = categories.map((category) => {
      // Handle zero price edge case
      const utilityPerDollar =
        category.price > 0 ? category.utilityFactor / category.price : Infinity

      return {
        category,
        utilityPerDollar,
      }
    })

    // Sort by utility per dollar, highest first
    categoriesWithUtilityPerDollar.sort(
      (a, b) => b.utilityPerDollar - a.utilityPerDollar,
    )

    // Calculate number of buckets (use fewer buckets if we have few categories)
    const numBuckets = Math.min(this.NUM_BUCKETS, categories.length)

    // Create buckets with roughly equal number of items
    const buckets: { category: Category; utilityPerDollar: number }[][] = []
    const itemsPerBucket = Math.ceil(
      categoriesWithUtilityPerDollar.length / numBuckets,
    )

    for (let i = 0; i < numBuckets; i++) {
      const startIndex = i * itemsPerBucket
      const endIndex = Math.min(
        startIndex + itemsPerBucket,
        categoriesWithUtilityPerDollar.length,
      )

      if (startIndex < categoriesWithUtilityPerDollar.length) {
        buckets.push(categoriesWithUtilityPerDollar.slice(startIndex, endIndex))
      }
    }

    // Calculate potential utility for each bucket if all basic needs are met
    const bucketUtilities = buckets.map((bucket) => {
      let totalBucketUtility = 0
      let totalBucketNecessity = 0

      bucket.forEach(({ category }) => {
        // Calculate utility if all basic needs were met
        const basicNeedUtility = calculateUtility(
          category,
          category.basicNeedAmount,
        )
        totalBucketUtility += basicNeedUtility
        totalBucketNecessity += category.necessityLevel
      })

      return {
        bucket,
        totalUtility: totalBucketUtility,
        totalNecessity: totalBucketNecessity,
        // Combined score that considers both utility and necessity
        score: totalBucketUtility * totalBucketNecessity,
      }
    })

    // Calculate total score to determine proportions
    const totalScore = bucketUtilities.reduce((sum, b) => sum + b.score, 0)

    // Distribute budget proportionally based on bucket scores
    bucketUtilities.forEach((bucketData) => {
      // Skip if total score is zero (prevents division by zero)
      if (totalScore === 0) return

      // Calculate budget allocation for this bucket
      const bucketBudget = budget * (bucketData.score / totalScore)

      // Distribute bucket budget evenly across all categories in the bucket
      const categoriesInBucket = bucketData.bucket.length
      if (categoriesInBucket === 0) return

      const budgetPerCategory = bucketBudget / categoriesInBucket

      // Allocate to each category in this bucket
      bucketData.bucket.forEach(({ category }) => {
        // Find the allocation for this category
        const allocation = allocations.filter((a) => a.category === category)[0]
        if (!allocation) return

        // Calculate quantity based on budget and price
        // Handle zero price edge case
        if (category.price <= 0) {
          allocation.quantity = category.basicNeedAmount
          allocation.spent = 0
        } else {
          allocation.spent = budgetPerCategory
          allocation.quantity = budgetPerCategory / category.price
        }

        // Calculate utility for this quantity
        allocation.utility = calculateUtility(category, allocation.quantity)
      })
    })

    // Calculate totals
    const totalUtility = allocations.reduce((sum, a) => sum + a.utility, 0)
    const totalSpent = allocations.reduce((sum, a) => sum + a.spent, 0)

    // Return allocations and stats
    return {
      allocations,
      totalUtility,
      totalSpent,
      message: `Allocated using ${buckets.length} utility buckets`,
    }
  }
}
