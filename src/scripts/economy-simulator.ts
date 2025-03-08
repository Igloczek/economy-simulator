import { registerComponent } from "@/scripts/alpine.ts"
import algorithms, { type AllocationAlgorithm } from "@/scripts/algorithms"
import { getSpaceGsMock } from "@/scripts/space-gs-importer"
import { kowalski } from './scenarios/kowalski'
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

  // Available algorithms and current selection
  algorithms: algorithms,
  selectedAlgorithmIndex: 0,

  // Model settings
  modelSettings: {
    equalFactors: false,
    noDiminishingReturns: false,
    flatUtility: false,
    strictNecessityPriority: true,
  },

  // Default categories for reset
  defaultCategories: getSpaceGsMock(),

  // Chart data
  chartData: {
    spending: [],
    utility: [],
  },

  init() {
    console.log("Initializing economy simulator")
    console.log(
      "Available algorithms:",
      this.algorithms.map((a) => a.name),
    )

    // Initialize with default categories, and explicitly reset algorithm to the first one
    this.resetToDefault(true)

    this.applyKowalskiScenario()

    console.log("Initial algorithm:", this.getCurrentAlgorithm().name)
  },

  // Get the current algorithm
  getCurrentAlgorithm() {
    return this.algorithms[this.selectedAlgorithmIndex]
  },

  // Change the current algorithm
  changeAlgorithm(index) {
    console.log("Changing algorithm to index:", index, "Type:", typeof index)

    // Make sure index is a number and valid
    const numericIndex = parseInt(index, 10)
    console.log("Parsed index:", numericIndex)

    if (
      isNaN(numericIndex) ||
      numericIndex < 0 ||
      numericIndex >= this.algorithms.length
    ) {
      console.error("Invalid algorithm index:", index)
      return
    }

    // Update the selected algorithm index
    this.selectedAlgorithmIndex = numericIndex
    console.log("Algorithm switched to:", this.algorithms[numericIndex].name)

    // Recalculate with the new algorithm
    this.calculateOptimalSpending()
  },

  // MACRO FUNCTIONS
  resetToDefault(resetAlgorithm = false) {
    console.log("Resetting to default. Reset algorithm:", resetAlgorithm)

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

    // Reset algorithm only if explicitly requested
    if (resetAlgorithm) {
      const currentAlgo = this.getCurrentAlgorithm().name
      this.selectedAlgorithmIndex = 0
      console.log(
        "Algorithm reset from",
        currentAlgo,
        "to",
        this.getCurrentAlgorithm().name,
      )
    }

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

  applyKowalskiScenario() {
    this.categories = kowalski.categories
    this.budget = kowalski.budget
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
    console.log(
      "Calculating optimal spending with algorithm index:",
      this.selectedAlgorithmIndex,
    )

    // Convert string values to numbers (Alpine bindings can sometimes keep them as strings)
    const processedCategories = this.categories.map((cat) => ({
      ...cat,
      price: Number(cat.price),
      utilityFactor: Number(cat.utilityFactor),
      basicNeedAmount: Number(cat.basicNeedAmount),
      diminishingFactor: Number(cat.diminishingFactor),
      necessityLevel: Number(cat.necessityLevel),
    }))

    // Get the current algorithm
    const algorithm = this.getCurrentAlgorithm()
    console.log("Using algorithm:", algorithm.name)

    // Run the selected algorithm
    const result = algorithm.calculate(processedCategories, Number(this.budget / 30))

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
        color: this.getCategoryColor(
          this.allocations.findIndex(
            (a) => a.category.name === allocation.category.name,
          ),
        ),
      }
    })
  },

  getCategoryColor(index) {
    // Array of colors for categories
    const colors = [
      "hsl(220, 70%, 50%)", // Blue
      "hsl(160, 70%, 40%)", // Green
      "hsl(350, 70%, 50%)", // Red
      "hsl(40, 80%, 50%)", // Orange
      "hsl(300, 70%, 50%)", // Purple
      "hsl(180, 70%, 40%)", // Teal
      "hsl(80, 60%, 45%)", // Lime
      "hsl(260, 60%, 55%)", // Violet
      "hsl(20, 80%, 50%)", // Burnt Orange
      "hsl(200, 70%, 50%)", // Light Blue
    ]

    return colors[index % colors.length]
  },

  calculateBasicNeedsSatisfaction(allocation) {
    return Math.min(
      100,
      (allocation.quantity / allocation.category.basicNeedAmount) * 100,
    )
  },

  getBasicNeedsSatisfactionColor(percentage) {
    if (percentage < 50) return "bg-red-500"
    if (percentage < 100) return "bg-yellow-500"
    return "bg-green-500"
  },

  getNecessityLevelLabel(level) {
    if (level >= 9) return "Critical"
    if (level >= 7) return "High"
    if (level >= 5) return "Medium"
    if (level >= 3) return "Low"
    return "Luxury"
  },

  getNecessityLevelColor(level) {
    if (level >= 9) return "text-red-600 font-bold"
    if (level >= 7) return "text-orange-600 font-bold"
    if (level >= 5) return "text-yellow-600"
    if (level >= 3) return "text-blue-600"
    return "text-purple-600"
  },
})
