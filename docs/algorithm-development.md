# Algorithm Development Guide

This guide explains how to create and implement new economic algorithms for the Economy Simulator.

## Creating a New Algorithm

### Using the Scaffolding Tool

The easiest way to create a new algorithm is to use our scaffolding tool:

```bash
npm run create-algorithm
```

This interactive CLI tool will:

1. Prompt you for a name and description
2. Generate a new algorithm file in the correct location
3. Register the algorithm in the registry
4. Provide a template implementation to get you started

Example session:

```
🧠 Economy Simulator - Algorithm Scaffolding Tool 🧠

Algorithm name (e.g. "Budget Allocation Priority"): Weighted Priority
Short description (1-2 sentences): Allocates budget based on a weighted system that balances necessity and utility.

✅ Success! Created algorithm in weighted-priority-algorithm.ts
✅ Updated algorithm registry in index.ts

Next steps:
1. Open the file: weighted-priority-algorithm.ts
2. Implement your allocation logic in the calculate method
3. Run the app to test your algorithm in the UI
```

### Manual Creation

If you prefer to create an algorithm manually:

1. Create a TypeScript file in `src/scripts/algorithms/` (use kebab-case for filenames)
2. Implement the `AllocationAlgorithm` interface
3. Register your algorithm in `src/scripts/algorithms/index.ts`

## Implementing the Algorithm

All algorithms must implement the `AllocationAlgorithm` interface:

```typescript
export interface AllocationAlgorithm {
  name: string
  description: string
  calculate(categories: Category[], budget: number): AllocationResult
}
```

The `calculate` method is where you'll implement your economic model. It receives:

- An array of spending categories with properties like price, necessity level, etc.
- A budget amount to allocate

It should return an `AllocationResult` object with:

- An array of allocations (quantities for each category)
- The total utility achieved
- The total amount spent
- An optional message (e.g., for warnings or explanations)

## Best Practices

1. **Descriptive Names**: Choose names that clearly describe the algorithm's approach
2. **Clear Description**: Write concise descriptions that explain your algorithm's unique approach
3. **Comments**: Add detailed comments to explain key steps in your logic
4. **Edge Cases**: Handle edge cases like zero prices or insufficient budget
5. **Meaningful Sorting**: Consider sorting the output allocations in a meaningful way (e.g., by necessity)

## Testing Your Algorithm

After creating your algorithm:

1. Run the development server: `npm run dev`
2. Open your browser to the local server (usually http://localhost:4321)
3. In the UI, select your algorithm from the dropdown in the "Allocation Algorithm" section
4. Test with different budgets and category configurations
5. Consider adding automated tests for your algorithm

## Example Algorithm Implementation

Here's a simplified example of an algorithm implementation:

```typescript
export class ExampleAlgorithm implements AllocationAlgorithm {
  name = "Example Algorithm"
  description = "A sample algorithm demonstrating the implementation pattern."

  calculate(categories: Category[], budget: number): AllocationResult {
    // Sort categories by necessity level
    const sortedCategories = [...categories].sort(
      (a, b) => b.necessityLevel - a.necessityLevel,
    )

    // Initialize allocations
    const allocations = sortedCategories.map((category) => ({
      category,
      quantity: 0,
      utility: 0,
      spent: 0,
    }))

    let remainingBudget = budget
    let totalUtility = 0

    // Allocation logic here...
    // ...

    return {
      allocations,
      totalUtility,
      totalSpent: budget - remainingBudget,
      message: "Example algorithm completed successfully.",
    }
  }
}
```

## Deleting the Test Algorithm

After reviewing this guide, you can remove the test algorithm created during setup:

```bash
rm src/scripts/algorithms/random-test-algorithm.ts
```

Then edit `src/scripts/algorithms/index.ts` to remove the import and instance.
