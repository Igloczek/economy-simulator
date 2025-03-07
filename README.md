# Economy simulator

The goal of this project is to test and visualize the spendings of a household.

The household has a fixed income and can spend it on different categories.

Each category has a different price and a different utility factor - acording to the utility theory.

Utility divided by price is representing how much preasure the household have to get product.

We need to create a function that will calculate the optimal spendings for the household, trying to maximize the utility, and keep the buget.

As a challenge, we need to cover scenarios where we don't have enough buget to cover our needs, so we need to find the optimal compromise.

# Visualization

We need to visualize the spendings and the utility in a graph.

We need to see how the utility changes when we change the spendings.

Create a set of categories with different utility factors and prices.

Then run the simulation and visualize the results, visualizing how the budget is spent and how the utility is maximized.

## Tech stack

- Astro
- Alpine.js
- TailwindCSS
- TypeScript

Write the Alpine.js stuff mostly in `<script>` as components, not inline. HTML is only for visualizations, not for logic.
