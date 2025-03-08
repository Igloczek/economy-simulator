import type { Category } from "../economy-model"

// Result type for allocation algorithms
export interface AllocationResult {
  allocations: {
    category: Category
    quantity: number
    utility: number
    spent: number
  }[]
  totalUtility: number
  totalSpent: number
  message?: string
}

// Interface that all allocation algorithms must implement
export interface AllocationAlgorithm {
  name: string
  description: string
  calculate(categories: Category[], budget: number): AllocationResult
}
