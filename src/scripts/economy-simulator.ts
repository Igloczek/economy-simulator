import { registerComponent } from "@/scripts/alpine.ts"
import { calculateOptimalSpending } from "@/scripts/economy-model"

registerComponent("app", {
  budget: 1000,
  minBudget: 0,
  maxBudget: 2000,
  step: 10,
  categories: [],
  allocations: [],
  totalUtility: 0,
  totalSpent: 0,
  optimizationMessage: "",

  // Model settings
  modelSettings: {
    equalFactors: false,
    noDiminishingReturns: false,
    flatUtility: false,
    strictNecessityPriority: true,
  },

  // Default categories for reset
  defaultCategories: [
    {
      name: "Housing",
      price: 500,
      utilityFactor: 5,
      basicNeedAmount: 1,
      diminishingFactor: 0.5,
      necessityLevel: 10, // Highest necessity - shelter
    },
    {
      name: "Food",
      price: 10,
      utilityFactor: 5,
      basicNeedAmount: 20,
      diminishingFactor: 0.8,
      necessityLevel: 9, // Very high necessity
    },
    {
      name: "Healthcare",
      price: 100,
      utilityFactor: 4,
      basicNeedAmount: 1,
      diminishingFactor: 0.7,
      necessityLevel: 8, // High necessity
    },
    {
      name: "Transportation",
      price: 50,
      utilityFactor: 3,
      basicNeedAmount: 1,
      diminishingFactor: 0.6,
      necessityLevel: 6, // Medium-high necessity
    },
    {
      name: "Entertainment",
      price: 20,
      utilityFactor: 4,
      basicNeedAmount: 2,
      diminishingFactor: 0.9,
      necessityLevel: 3, // Low necessity (luxury)
    },
  ],

  // Chart data
  chartData: {
    spending: [],
    utility: [],
  },

  init() {
    // Initialize with default categories
    this.resetToDefault()
  },

  // MACRO FUNCTIONS
  resetToDefault() {
    // Reset model settings
    this.modelSettings = {
      equalFactors: false,
      noDiminishingReturns: false,
      flatUtility: false,
      strictNecessityPriority: true,
    }

    // Clone default categories to avoid reference issues
    this.categories = JSON.parse(JSON.stringify(this.defaultCategories))

    // Reset budget
    this.budget = 1000

    this.calculateOptimalSpending()
  },

  applyEqualFactorsModel() {
    this.modelSettings.equalFactors = true

    // Set all utility factors to the same value (5)
    this.categories.forEach((category) => {
      category.utilityFactor = 5
    })

    this.calculateOptimalSpending()
  },

  applyNoDiminishingReturnsModel() {
    this.modelSettings.noDiminishingReturns = true

    // Set all diminishing factors to 0 (no diminishing returns)
    this.categories.forEach((category) => {
      category.diminishingFactor = 0
    })

    this.calculateOptimalSpending()
  },

  applyFlatUtilityModel() {
    this.modelSettings.flatUtility = true

    // Set all necessity levels to 5 (medium necessity)
    this.categories.forEach((category) => {
      category.necessityLevel = 5
    })

    this.calculateOptimalSpending()
  },

  applyHighContrast() {
    // Create high contrast between necessities
    this.categories.forEach((category) => {
      if (category.necessityLevel >= 8) {
        category.necessityLevel = 10
        category.basicNeedAmount = Math.max(1, category.basicNeedAmount)
      } else if (category.necessityLevel <= 4) {
        category.necessityLevel = 1
      } else {
        category.necessityLevel = 5
      }
    })

    this.calculateOptimalSpending()
  },

  applyLowBudgetScenario() {
    this.budget = 300 // Very limited budget
    this.calculateOptimalSpending()
  },

  applyHighBudgetScenario() {
    this.budget = 2000 // Abundant budget
    this.calculateOptimalSpending()
  },

  // Original functions
  addCategory() {
    this.categories.push({
      name: "New Category",
      price: 10,
      utilityFactor: 5,
      basicNeedAmount: 1,
      diminishingFactor: 0.7,
      necessityLevel: 5, // Medium necessity by default
    })

    this.calculateOptimalSpending()
  },

  removeCategory(index) {
    this.categories.splice(index, 1)
    this.calculateOptimalSpending()
  },

  calculateOptimalSpending() {
    // Convert string values to numbers (Alpine bindings can sometimes keep them as strings)
    const processedCategories = this.categories.map((cat) => ({
      ...cat,
      price: Number(cat.price),
      utilityFactor: Number(cat.utilityFactor),
      basicNeedAmount: Number(cat.basicNeedAmount),
      diminishingFactor: Number(cat.diminishingFactor),
      necessityLevel: Number(cat.necessityLevel),
    }))

    const result = calculateOptimalSpending(
      processedCategories,
      Number(this.budget),
    )

    this.allocations = result.allocations
    this.totalUtility = result.totalUtility
    this.totalSpent = result.totalSpent
    this.optimizationMessage = result.message || ""

    this.updateChart()
  },

  formatCurrency(amount) {
    // Convert to number first to handle string inputs from x-model
    return "$" + Number(amount).toFixed(2)
  },

  formatPercentage(part, whole) {
    return ((part / whole) * 100).toFixed(1) + "%"
  },

  getUtilityPercentage(utility) {
    return (utility / this.totalUtility) * 100
  },

  updateChart() {
    // Create data for the pie charts

    // Reset chart data
    this.chartData = {
      spending: [],
      utility: [],
    }

    // Sort allocations by spent/utility for better visualization (only for pie charts)
    const spendingSorted = [...this.allocations].sort(
      (a, b) => b.spent - a.spent,
    )
    const utilitySorted = [...this.allocations].sort(
      (a, b) => b.utility - a.utility,
    )

    // Sort the main allocations array by necessity level to keep the display stable
    // Higher necessity items will appear at the top and stay in place
    this.allocations.sort(
      (a, b) =>
        b.category.necessityLevel - a.category.necessityLevel ||
        a.category.name.localeCompare(b.category.name), // Secondary sort by name for stability
    )

    // Calculate cumulative percentages for spending pie chart
    let cumulativeSpendingPercent = 0
    this.chartData.spending = spendingSorted.map((allocation, index) => {
      const percent = (allocation.spent / this.totalSpent) * 100
      const startPercent = cumulativeSpendingPercent
      cumulativeSpendingPercent += percent

      return {
        category: allocation.category,
        percent,
        startPercent,
        endPercent: cumulativeSpendingPercent,
        color: this.getCategoryColor(index),
      }
    })

    // Calculate cumulative percentages for utility pie chart
    let cumulativeUtilityPercent = 0
    this.chartData.utility = utilitySorted.map((allocation, index) => {
      const percent = (allocation.utility / this.totalUtility) * 100
      const startPercent = cumulativeUtilityPercent
      cumulativeUtilityPercent += percent

      return {
        category: allocation.category,
        percent,
        startPercent,
        endPercent: cumulativeUtilityPercent,
        color: this.getCategoryColor(index),
      }
    })
  },

  // Helper method to get a color for a category
  getCategoryColor(index) {
    const colors = [
      "#3B82F6", // blue-500
      "#EF4444", // red-500
      "#10B981", // green-500
      "#F59E0B", // amber-500
      "#8B5CF6", // purple-500
      "#EC4899", // pink-500
      "#06B6D4", // cyan-500
      "#F97316", // orange-500
    ]

    return colors[index % colors.length]
  },

  // Utility functions for visualization
  calculateBasicNeedsSatisfaction(allocation) {
    const { quantity, category } = allocation
    return Math.min(100, (quantity / category.basicNeedAmount) * 100)
  },

  getBasicNeedsSatisfactionColor(percentage) {
    if (percentage < 50) return "bg-red-500"
    if (percentage < 100) return "bg-yellow-500"
    return "bg-green-500"
  },

  getNecessityLevelLabel(level) {
    if (level >= 9) return "Essential"
    if (level >= 7) return "Very Important"
    if (level >= 5) return "Important"
    if (level >= 3) return "Useful"
    return "Luxury"
  },

  getNecessityLevelColor(level) {
    if (level >= 9) return "text-red-600"
    if (level >= 7) return "text-orange-500"
    if (level >= 5) return "text-yellow-500"
    if (level >= 3) return "text-blue-500"
    return "text-green-500"
  },
})
