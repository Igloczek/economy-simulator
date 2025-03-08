import type { AllocationAlgorithm } from "./algorithm-interface"
import { PriorityNecessityAlgorithm } from "./priority-necessity-algorithm"
import { PureUtilityAlgorithm } from "./pure-utility-algorithm"
import { BalancedApproachAlgorithm } from "./balanced-approach-algorithm"

// Create instances of all algorithms
const algorithms: AllocationAlgorithm[] = [
  new PriorityNecessityAlgorithm(),
  new PureUtilityAlgorithm(),
  new BalancedApproachAlgorithm(),
]

// Export the algorithm registry
export default algorithms

// Export algorithm interface for consumers
export type { AllocationAlgorithm }
export { type AllocationResult } from "./algorithm-interface"

/**
 * How to add a new algorithm:
 *
 * 1. Create a new file in the algorithms directory (e.g., my-new-algorithm.ts)
 * 2. Implement the AllocationAlgorithm interface
 * 3. Import the new algorithm class here
 * 4. Add an instance of it to the algorithms array
 *
 * The algorithm will be automatically available in the UI.
 */
