import type { AllocationAlgorithm } from "./algorithm-interface"
import { PriorityNecessityAlgorithm } from "./priority-necessity-algorithm"
import { PureUtilityAlgorithm } from "./pure-utility-algorithm"
import { BalancedApproachAlgorithm } from "./balanced-approach-algorithm"
import { FlatTimeUtilityMaximisationAlgorithm } from "./flat-time-utility-maximiser"
import { MarginalUtilityAlgorithm } from "./marginal-utility-algorithm"
import { OptimisedMarginalUtilityAlgorithm } from "./marginal-utility-algorithm-optimisation"
import { OptimisedMarginalUtilityBudgetFixAlgorithm } from "./optimised-marginal-utility-budget-fix-algorithm"
import { SimpleProportionsAlgorithm } from "./simple-proportions-algorithm"
import { MarginalUtilityOptimizer } from "./gradient-descent-algorithm"
import { PairProgrammingAlgorithm } from "./pair-programming-algorithm"
import { BucketUtilitySmoothingAlgorithm } from "./bucket-utility-smoothing-algorithm"
import { BlurAlgorithm } from "./blur-algorithm"

// Create instances of all algorithms
const algorithms: AllocationAlgorithm[] = [
  new PriorityNecessityAlgorithm(),
  new PureUtilityAlgorithm(),
  new BalancedApproachAlgorithm(),
  new FlatTimeUtilityMaximisationAlgorithm(),
  new MarginalUtilityAlgorithm(),
  new OptimisedMarginalUtilityAlgorithm(),
  new OptimisedMarginalUtilityBudgetFixAlgorithm(),
  new SimpleProportionsAlgorithm(),
  new MarginalUtilityOptimizer(),
  new PairProgrammingAlgorithm(),
  new BucketUtilitySmoothingAlgorithm(),
  new BlurAlgorithm(),
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
