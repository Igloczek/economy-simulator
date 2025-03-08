# Economic Allocation Algorithms

This directory contains the different algorithms available for allocating household budgets in the Economy Simulator.

## Algorithm Interface

All algorithms must implement the `AllocationAlgorithm` interface defined in `algorithm-interface.ts`:

```typescript
export interface AllocationAlgorithm {
  name: string
  description: string
  calculate(categories: Category[], budget: number): AllocationResult
}
```

## Available Algorithms

1. **Priority Necessity Algorithm**: Prioritizes meeting basic needs for high-necessity items first, then maximizes marginal utility with remaining budget.
2. **Pure Utility Algorithm**: Ignores necessity levels and allocates purely based on utility-to-price ratio.
3. **Balanced Approach Algorithm**: Allocates a percentage of the budget to meet basic needs based on necessity, then optimizes the rest for maximum utility.

## Creating a New Algorithm

### Automatic Scaffolding (Recommended)

The easiest way to create a new algorithm is to use the scaffolding script:

```bash
npm run create-algorithm
```

This interactive tool will:

1. Prompt you for the algorithm name and description
2. Generate the algorithm file with a basic template
3. Register the algorithm in the index.ts file

### Manual Creation

If you prefer to create an algorithm manually:

1. Create a new file in this directory (use kebab-case naming, e.g., `my-new-algorithm.ts`)
2. Implement the `AllocationAlgorithm` interface
3. Export your class
4. Register the algorithm in `index.ts`

## Best Practices

1. **Descriptive Names**: Choose a name that clearly describes your algorithm's approach
2. **Clear Description**: Write a concise description explaining how your algorithm works
3. **Handle Edge Cases**: Account for edge cases like zero prices or insufficient budget
4. **Comments**: Add comments explaining the key steps in your algorithm
5. **Allocation Sorting**: Consider sorting the resulting allocations in a meaningful way

## Utility Functions

The economy model provides a `calculateUtility` function for determining the utility of a specific quantity of a category, handling necessity levels and diminishing returns.

```typescript
import { calculateUtility } from "../economy-model"

// Example usage
const utility = calculateUtility(category, quantity)
```
