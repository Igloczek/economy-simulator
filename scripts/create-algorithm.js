#!/usr/bin/env node

/**
 * Algorithm Scaffolding Script
 * This script helps to create a new algorithm implementation file
 * and registers it in the algorithm registry.
 */

import fs from "fs"
import path from "path"
import readline from "readline"
import { fileURLToPath } from "url"

// Get the directory name
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// The directory where algorithms are stored
const ALGORITHMS_DIR = path.join(__dirname, "../src/scripts/algorithms")
const INDEX_FILE = path.join(ALGORITHMS_DIR, "index.ts")

// Template for a new algorithm file
const getAlgorithmTemplate = (
  className,
  name,
  description,
) => `import type { Category } from "../economy-model"
import { calculateUtility } from "../economy-model"
import type { AllocationAlgorithm, AllocationResult } from "./algorithm-interface"

/**
 * ${description}
 */
export class ${className} implements AllocationAlgorithm {
  name = "${name}"
  description = "${description}"

  calculate(categories: Category[], budget: number): AllocationResult {
    // Initialize allocations array and counters
    const allocations = categories.map(category => ({
      category,
      quantity: 0,
      utility: 0,
      spent: 0
    }))
    
    let remainingBudget = budget
    let totalUtility = 0
    
    // TODO: Implement your allocation logic here
    // This is a placeholder implementation that buys one unit of each category
    for (const allocation of allocations) {
      const { category } = allocation
      
      if (category.price <= remainingBudget) {
        // Purchase one unit
        allocation.quantity = 1
        allocation.spent = category.price
        allocation.utility = calculateUtility(category, allocation.quantity)
        
        totalUtility += allocation.utility
        remainingBudget -= category.price
      }
    }
    
    const totalSpent = budget - remainingBudget
    let message = "This is a scaffold - implement your algorithm logic!"

    return {
      allocations,
      totalUtility,
      totalSpent,
      message,
    }
  }
}`

// Function to convert a name to a class name (PascalCase)
function toClassName(name) {
  return (
    name
      .split(/[-_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("") + "Algorithm"
  )
}

// Function to convert a name to a file name (kebab-case)
function toFileName(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-") + "-algorithm.ts"
  )
}

// Function to update the index.ts file to import and register the new algorithm
function updateIndexFile(className, fileName) {
  const fileNameWithoutExtension = fileName.replace(".ts", "")

  // Read the current index file
  const indexContent = fs.readFileSync(INDEX_FILE, "utf8")

  // Add import statement after the last import
  let newContent = indexContent.replace(
    /(import.*from.*\n)(?!import)/,
    `$1import { ${className} } from "./${fileNameWithoutExtension}"\n`,
  )

  // Add algorithm to the array with proper formatting
  newContent = newContent.replace(
    /(const algorithms: AllocationAlgorithm\[] = \[[\s\S]*?)(\n\])/,
    `$1  new ${className}(),\n$2`,
  )

  // Write the updated content back
  fs.writeFileSync(INDEX_FILE, newContent)
}

// Main function
async function createAlgorithm() {
  // Check for help flag
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log("🧠 Economy Simulator - Algorithm Scaffolding Tool 🧠\n")
    console.log("Usage: npm run create-algorithm\n")
    console.log(
      "This tool helps you create a new algorithm for the Economy Simulator.",
    )
    console.log(
      "It will prompt you for a name and description, then generate the necessary files.\n",
    )
    console.log("For more information, see docs/algorithm-development.md")
    process.exit(0)
  }

  console.log("🧠 Economy Simulator - Algorithm Scaffolding Tool 🧠\n")

  // Make sure the algorithms directory exists
  if (!fs.existsSync(ALGORITHMS_DIR)) {
    console.error(`Error: Algorithms directory not found at ${ALGORITHMS_DIR}`)
    process.exit(1)
  }

  // Prompt for algorithm details
  rl.question(
    'Algorithm name (e.g. "Budget Allocation Priority"): ',
    (name) => {
      if (!name.trim()) {
        console.error("Error: Algorithm name cannot be empty")
        rl.close()
        process.exit(1)
      }

      const className = toClassName(name)
      const fileName = toFileName(name)
      const filePath = path.join(ALGORITHMS_DIR, fileName)

      // Check if file already exists
      if (fs.existsSync(filePath)) {
        console.error(`Error: A file with the name ${fileName} already exists`)
        rl.close()
        process.exit(1)
      }

      rl.question("Short description (1-2 sentences): ", (description) => {
        if (!description.trim()) {
          console.error("Error: Description cannot be empty")
          rl.close()
          process.exit(1)
        }

        // Create the algorithm file
        const fileContent = getAlgorithmTemplate(className, name, description)
        fs.writeFileSync(filePath, fileContent)

        // Update the index file
        updateIndexFile(className, fileName)

        console.log(`\n✅ Success! Created algorithm in ${fileName}`)
        console.log(`✅ Updated algorithm registry in index.ts`)
        console.log("\nNext steps:")
        console.log(`1. Open the file: ${fileName}`)
        console.log(
          "2. Implement your allocation logic in the calculate method",
        )
        console.log("3. Run the app to test your algorithm in the UI")

        rl.close()
      })
    },
  )
}

// Run the script
createAlgorithm()
