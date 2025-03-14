import type { Category } from "../economy-model"
import { calculateUtility } from "../economy-model"
import type {
  AllocationAlgorithm,
  AllocationResult,
} from "./algorithm-interface"

/**
 * Groups categories into buckets based on utility per dollar,
 * then distributes budget with higher priority to high-utility buckets
 * but focusing on fulfilling basic needs across all buckets.
 */
export class BucketUtilitySmoothingAlgorithm implements AllocationAlgorithm {
  name = "Bucket Utility Smoothing"
  description =
    "Groups items into utility buckets and prioritizes high utility items based on basic needs"

  // Number of buckets to divide categories into (can be adjusted)
  private NUM_BUCKETS = 5

  calculate(categories: Category[], budget: number): AllocationResult {
    // Collection of log messages
    let logOutput = "======= BUCKET UTILITY SMOOTHING ALGORITHM =======\n"

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

    logOutput += `Total budget: ${budget}\n`
    logOutput += `Total categories: ${categories.length}\n\n`

    // Separate zero-price items from regular items
    const zeropriceCategories: Category[] = []
    const regularCategories: Category[] = []

    categories.forEach((category) => {
      if (category.price <= 0) {
        zeropriceCategories.push(category)
      } else {
        regularCategories.push(category)
      }
    })

    logOutput += `Zero-price categories (skipped): ${zeropriceCategories.length}\n`
    logOutput += `Regular categories: ${regularCategories.length}\n\n`

    // Handle the case where all categories have zero price
    if (regularCategories.length === 0) {
      logOutput += "\nAll categories have zero price, skipping allocation\n"
      // Print the full log
      console.log(logOutput)

      return {
        allocations, // All quantities remain at 0
        totalUtility: 0,
        totalSpent: 0,
        message: "All categories have zero price, no budget allocation needed",
      }
    }

    // Calculate utility per dollar for each regular category
    logOutput += "Category utility per dollar:\n"
    const categoriesWithUtilityPerDollar = regularCategories.map((category) => {
      // Calculate utility per dollar (we've already filtered out zero price)
      const utilityPerDollar = category.utilityFactor / category.price

      logOutput += `${category.name}: ${utilityPerDollar.toFixed(2)}\n`

      return {
        category,
        utilityPerDollar,
      }
    })

    // Sort by utility per dollar, highest first
    categoriesWithUtilityPerDollar.sort(
      (a, b) => b.utilityPerDollar - a.utilityPerDollar,
    )

    logOutput += "\nCategories sorted by utility per dollar (highest first):\n"
    categoriesWithUtilityPerDollar.forEach(({ category, utilityPerDollar }) => {
      logOutput += `${category.name}: ${utilityPerDollar.toFixed(2)}\n`
    })

    // Calculate number of buckets (use fewer buckets if we have few categories)
    const numBuckets = Math.min(this.NUM_BUCKETS, regularCategories.length)
    logOutput += `\nUsing ${numBuckets} buckets\n`

    // Create buckets with roughly equal number of items
    const buckets: { category: Category; utilityPerDollar: number }[][] = []
    const itemsPerBucket = Math.ceil(
      categoriesWithUtilityPerDollar.length / numBuckets,
    )

    logOutput += `Items per bucket: ${itemsPerBucket}\n`

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

    logOutput += "\nBuckets created:\n"
    buckets.forEach((bucket, index) => {
      logOutput += `Bucket ${index + 1}:\n`
      bucket.forEach(({ category, utilityPerDollar }) => {
        logOutput += `  ${category.name}: ${utilityPerDollar.toFixed(2)}\n`
      })
    })

    // Calculate the average utility per dollar and basic needs cost for each bucket
    const bucketData = buckets.map((bucket, index) => {
      // Calculate average utility per dollar for the bucket
      const totalUtilityPerDollar = bucket.reduce(
        (sum, item) => sum + item.utilityPerDollar,
        0,
      )
      const avgUtilityPerDollar = totalUtilityPerDollar / bucket.length

      // Calculate basic needs cost for the bucket
      let totalBasicNeedsCost = 0

      // Calculate potential utility gain from meeting basic needs
      let potentialUtilityGain = 0

      bucket.forEach(({ category }) => {
        const basicNeedAmount = category.basicNeedAmount
        const basicNeedCost = basicNeedAmount * category.price
        totalBasicNeedsCost += basicNeedCost

        // Calculate utility gained from meeting basic needs
        const basicNeedUtility = calculateUtility(category, basicNeedAmount)
        potentialUtilityGain += basicNeedUtility
      })

      logOutput += `Bucket ${index + 1}:\n`
      logOutput += `  Average utility per dollar: ${avgUtilityPerDollar.toFixed(2)}\n`
      logOutput += `  Total basic needs cost: $${totalBasicNeedsCost.toFixed(2)}\n`
      logOutput += `  Potential utility gain from meeting basic needs: ${potentialUtilityGain.toFixed(2)}\n`

      return {
        bucket,
        avgUtilityPerDollar,
        totalBasicNeedsCost,
        potentialUtilityGain,
        budgetAllocation: 0, // Will be calculated next
      }
    })

    // Calculate total basic needs cost across all buckets
    const totalBasicNeedsCost = bucketData.reduce(
      (sum, data) => sum + data.totalBasicNeedsCost,
      0,
    )

    logOutput += `\nTotal cost to fulfill all basic needs: $${totalBasicNeedsCost.toFixed(2)}\n`

    // Check if we have enough budget to fulfill all basic needs
    if (budget >= totalBasicNeedsCost) {
      // We have enough budget to fulfill all basic needs
      logOutput += `Budget is sufficient to fulfill all basic needs ($${budget.toFixed(2)} >= $${totalBasicNeedsCost.toFixed(2)})\n`

      // Allocate exactly what's needed to each bucket for basic needs, nothing more
      bucketData.forEach((data) => {
        data.budgetAllocation = data.totalBasicNeedsCost
      })

      // Calculate the remaining budget after fulfilling all basic needs
      let remainingBudget = budget - totalBasicNeedsCost
      logOutput += `Remaining budget after fulfilling all basic needs: $${remainingBudget.toFixed(2)} (left unspent)\n`
    } else {
      // Not enough budget to fulfill all basic needs, allocate efficiently
      logOutput += `Budget is insufficient for all basic needs ($${budget.toFixed(2)} < $${totalBasicNeedsCost.toFixed(2)})\n`
      logOutput +=
        "Allocating using utility per dollar efficiency across all categories\n"

      // Create a flat list of all categories with their utility factors across all buckets
      const allCategoriesWithDetails = []

      // Collect all categories with their details
      bucketData.forEach((data, bucketIndex) => {
        data.bucket.forEach(({ category, utilityPerDollar }) => {
          const basicNeedAmount = category.basicNeedAmount
          const basicNeedCost = basicNeedAmount * category.price
          const basicNeedUtility = calculateUtility(category, basicNeedAmount)

          allCategoriesWithDetails.push({
            category,
            bucketIndex,
            utilityPerDollar,
            basicNeedAmount,
            basicNeedCost,
            basicNeedUtility,
            // Calculate efficiency of spending on basic needs
            basicNeedEfficiency: basicNeedUtility / basicNeedCost,
            // How much we'll allocate (to be filled in)
            allocatedBudget: 0,
          })
        })
      })

      // Sort all categories by basic need efficiency (utility per dollar spent on basic needs)
      allCategoriesWithDetails.sort(
        (a, b) => b.basicNeedEfficiency - a.basicNeedEfficiency,
      )

      // Log the sorted list of all categories by efficiency
      logOutput +=
        "\nCategories ranked by basic need efficiency (utility per $ spent on basic needs):\n"
      allCategoriesWithDetails.forEach((item) => {
        logOutput +=
          `  Bucket ${item.bucketIndex + 1} - ${item.category.name}: ` +
          `Efficiency: ${item.basicNeedEfficiency.toFixed(2)}, ` +
          `Basic need cost: $${item.basicNeedCost.toFixed(2)}\n`
      })

      // Allocate budget to highest efficiency items first, up to their basic needs amount
      let remainingBudget = budget

      allCategoriesWithDetails.forEach((item) => {
        // Allocate either what's needed for basic needs or what's left, whichever is less
        const allocation = Math.min(item.basicNeedCost, remainingBudget)
        item.allocatedBudget = allocation
        remainingBudget -= allocation

        // Track allocation in the bucket data for later use
        if (!bucketData[item.bucketIndex].categoryAllocations) {
          bucketData[item.bucketIndex].categoryAllocations = []
        }
        bucketData[item.bucketIndex].categoryAllocations.push({
          category: item.category,
          allocation: item.allocatedBudget,
        })

        // Sum allocations per bucket
        bucketData[item.bucketIndex].budgetAllocation =
          (bucketData[item.bucketIndex].budgetAllocation || 0) +
          item.allocatedBudget
      })

      // Log the allocations by bucket
      logOutput += "\nAllocations by bucket based on efficiency:\n"
      bucketData.forEach((data, index) => {
        // Calculate what percentage of basic needs are covered
        const basicNeedsCoverage =
          (data.budgetAllocation / data.totalBasicNeedsCost) * 100

        logOutput +=
          `  Bucket ${index + 1} allocation: $${data.budgetAllocation.toFixed(2)} ` +
          `(${basicNeedsCoverage.toFixed(1)}% of basic needs)\n`
      })
    }

    // Allocate budget within each bucket
    let totalUnspentBudget = 0

    bucketData.forEach((data, bucketIndex) => {
      const bucketBudget = data.budgetAllocation
      logOutput += `\nAllocating within Bucket ${bucketIndex + 1} ($${bucketBudget.toFixed(2)}):\n`

      // Special handling for insufficient budget case
      if (bucketBudget < data.totalBasicNeedsCost && data.categoryAllocations) {
        // In insufficient budget case, use the pre-calculated allocations
        logOutput += `  Total needed for basic needs: $${data.totalBasicNeedsCost.toFixed(2)}\n`
        logOutput += `  Fulfillment ratio: ${((bucketBudget / data.totalBasicNeedsCost) * 100).toFixed(2)}%\n`

        // Apply the pre-calculated allocations
        data.categoryAllocations.forEach((item) => {
          const allocation = allocations.find(
            (a) => a.category === item.category,
          )
          if (allocation) {
            allocation.spent = item.allocation
            allocation.quantity = item.allocation / item.category.price
            allocation.utility = calculateUtility(
              item.category,
              allocation.quantity,
            )

            // Log allocation details
            const basicNeedPercentage = (
              (allocation.quantity / item.category.basicNeedAmount) *
              100
            ).toFixed(1)

            logOutput +=
              `    ${item.category.name}: $${allocation.spent.toFixed(2)}, ` +
              `Quantity: ${allocation.quantity.toFixed(2)} (${basicNeedPercentage}% of basic need), ` +
              `Utility: ${allocation.utility.toFixed(2)}\n`
          }
        })

        // Since we directly applied allocations, there's no remaining budget
        // but we'll check for any rounding errors
        let spent = data.categoryAllocations.reduce(
          (sum, item) => sum + item.allocation,
          0,
        )
        let remainingBucketBudget = bucketBudget - spent

        if (remainingBucketBudget > 0.01) {
          logOutput += `  Remaining unspent budget in bucket: $${remainingBucketBudget.toFixed(2)}\n`
          totalUnspentBudget += remainingBucketBudget
        }
      } else {
        // Original allocation logic for when we have enough budget
        // The bucket is already sorted by utility per dollar (highest first) from our initial creation
        // No need to sort again
        const sortedBucket = data.bucket

        // First pass: Calculate how much budget we need to fulfill basic needs
        let totalNeededForBasicNeeds = 0
        const basicNeedsBudgets = sortedBucket.map(({ category }) => {
          const neededBudget = category.basicNeedAmount * category.price
          totalNeededForBasicNeeds += neededBudget
          return {
            category,
            neededBudget,
            allocatedBudget: 0,
          }
        })

        // Determine if we can fulfill all basic needs in this bucket
        const fulfillmentRatio =
          bucketBudget >= totalNeededForBasicNeeds
            ? 1.0
            : bucketBudget / totalNeededForBasicNeeds

        logOutput += `  Total needed for basic needs: $${totalNeededForBasicNeeds.toFixed(2)}\n`
        logOutput += `  Fulfillment ratio: ${(fulfillmentRatio * 100).toFixed(2)}%\n`

        let remainingBucketBudget = bucketBudget

        // Allocate based on priority (utility per dollar)
        for (const item of basicNeedsBudgets) {
          // If we have enough budget, fulfill basic needs
          // Otherwise, allocate what we can based on priority
          if (fulfillmentRatio === 1.0) {
            // We can fulfill all basic needs, allocate exactly what's needed
            item.allocatedBudget = Math.min(
              item.neededBudget,
              remainingBucketBudget,
            )
          } else {
            // Not enough budget to fulfill all basic needs
            // Prioritize based on utility per dollar within the bucket
            // Higher utility/$ items get a higher proportion of what they need

            // Get the position within the bucket (normalized 0-1)
            // Use array indexing as a fallback for browsers without findIndex
            let itemIndex = -1
            for (let i = 0; i < sortedBucket.length; i++) {
              if (sortedBucket[i].category === item.category) {
                itemIndex = i
                break
              }
            }
            const positionInBucket = itemIndex / (sortedBucket.length - 1 || 1)

            // Higher items get more, with smoothing
            const priorityFactor = 1 - positionInBucket * 0.5 // 0.5 is a smaller smoothing factor within bucket

            // Allocate budget based on priority
            item.allocatedBudget = Math.min(
              item.neededBudget * priorityFactor * (1 / fulfillmentRatio),
              remainingBucketBudget,
            )
          }

          // Update allocation
          const allocation = allocations.filter(
            (a) => a.category === item.category,
          )[0]
          if (allocation) {
            allocation.spent = item.allocatedBudget
            allocation.quantity = item.allocatedBudget / item.category.price
            allocation.utility = calculateUtility(
              item.category,
              allocation.quantity,
            )

            // Log allocation details
            const basicNeedPercentage = (
              (allocation.quantity / item.category.basicNeedAmount) *
              100
            ).toFixed(1)

            logOutput +=
              `    ${item.category.name}: $${allocation.spent.toFixed(2)}, ` +
              `Quantity: ${allocation.quantity.toFixed(2)} (${basicNeedPercentage}% of basic need), ` +
              `Utility: ${allocation.utility.toFixed(2)}\n`

            // Update remaining budget
            remainingBucketBudget -= item.allocatedBudget
          }
        }

        // Log remaining unspent budget
        if (remainingBucketBudget > 0.01) {
          logOutput += `  Remaining unspent budget in bucket: $${remainingBucketBudget.toFixed(2)}\n`
          totalUnspentBudget += remainingBucketBudget
        }
      }
    })

    // Calculate totals (only from regular categories, skipping zero-price ones)
    const regularAllocations = allocations.filter((allocation) => {
      // Check if category is in the zero-price list
      for (const zpCat of zeropriceCategories) {
        if (allocation.category === zpCat) {
          return false
        }
      }
      return true
    })

    const totalUtility = regularAllocations.reduce(
      (sum, a) => sum + a.utility,
      0,
    )
    const totalSpent = regularAllocations.reduce((sum, a) => sum + a.spent, 0)

    logOutput += "\nFinal results (zero-price categories excluded):\n"
    logOutput += `Total spent: ${totalSpent.toFixed(2)}\n`
    logOutput += `Total unspent: ${totalUnspentBudget.toFixed(2)}\n`
    logOutput += `Total utility: ${totalUtility.toFixed(2)}\n`
    logOutput += "=================================================\n"

    // Print the entire log at once
    console.log(logOutput)

    // Return allocations and stats
    return {
      allocations,
      totalUtility,
      totalSpent,
      message: `Allocated using ${buckets.length} utility buckets, prioritizing basic needs`,
    }
  }
}
