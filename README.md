# Economy Simulator

An interactive economic model that simulates household spending decisions based on utility theory, necessity levels, and diminishing returns.

## Overview

This simulator models how households allocate their budget across different spending categories while attempting to maximize utility. It incorporates several key economic concepts:

- **Necessity Prioritization**: Essential items (like housing and food) are prioritized over luxuries
- **Basic Needs**: Each category has a minimum amount required for basic wellbeing
- **Diminishing Returns**: Additional units of a good provide progressively less utility after basic needs are met
- **Budget Constraints**: The model handles scenarios where budget is insufficient to meet all basic needs

## Key Features

### Economic Model

- **Necessity Levels (1-10)**: Categories are ranked by importance (10 = absolute necessity like shelter, 1 = pure luxury)
- **Basic Need Amounts**: Minimum quantity of each category needed for basic wellbeing
- **Utility Factors**: Base usefulness/happiness gained from one unit of a category
- **Diminishing Returns Factor (0-1)**: Controls how quickly utility drops after basic needs are met
- **Price per Unit**: Cost of one unit of the category

### Interactive Controls

- **Adjustable Budget**: Test different income levels and see how spending patterns change
- **Category Management**: Add, remove, and modify spending categories
- **Model Presets**: Quickly test different economic assumptions:
  - Equal Utility Factors
  - No Diminishing Returns
  - Equal Necessity Levels
  - High Contrast Necessities
  - Low/High Budget Scenarios

### Visualizations

- **Pie Charts**: Visual representation of spending and utility distribution
- **Detailed Tables**: Breakdown of allocation, showing quantities, spending and utility for each category
- **Basic Needs Satisfaction**: Visual indicators showing how well basic needs are being met
- **Color-coded Elements**: Categories are color-coded consistently across different visualizations

## How It Works

1. The algorithm first sorts categories by necessity level (highest first)
2. It allocates budget to satisfy basic needs of high-necessity items first
3. If any remaining budget exists, it uses a greedy approach to purchase additional units that maximize marginal utility

This approach ensures that essential needs like housing and food are always prioritized, which matches real-world household spending behavior, especially in scarce resource scenarios.

## Tech Stack

- **Astro**: Framework for building the application
- **Alpine.js**: Handles reactivity and UI interactions
- **TailwindCSS**: Styling and layout
- **TypeScript**: Type-safe implementation of the economic models

Write the Alpine.js code mostly in `<script>` tags as components, not inline. HTML is only for visualizations, not for logic. This separation keeps the codebase maintainable and follows best practices.

## Usage

The simulator allows you to:

1. Adjust the household's monthly income
2. Define spending categories with their properties
3. Visualize how the budget is optimally allocated
4. Test different economic models and assumptions
5. Explore scenarios of abundance and scarcity

This tool is valuable for education, economic modeling, and understanding household budget optimization.
