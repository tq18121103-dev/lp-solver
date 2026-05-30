# Linear Programming Solver

A web-based application for solving Linear Programming (LP) problems using:

* Simplex Method
* Two-Phase Simplex Method
* Graphical Visualization for 2-variable problems

The project is implemented using pure HTML, CSS, and JavaScript.

---

## Features

* Solve maximization and minimization LP problems
* Standard Simplex algorithm
* Two-Phase Simplex algorithm
* Graphical visualization for 2-variable LP problems
* Step-by-step dictionary output
* Dynamic constraint generation
* Variable bound configuration
* Support for:

  * `<=`
  * `>=`
  * `=`
    constraints
* Support for:

  * Nonnegative variables
  * Nonpositive variables
  * Free variables

---

## Problem Detection

The solver can detect:

* Optimal solution
* Multiple optimal solutions
* Unbounded problems
* Infeasible problems

---

## Technologies Used

* HTML5
* CSS3
* JavaScript (ES6 Modules)
* Plotly.js (for graph visualization)

---

## Project Structure

```text
lp-solver/
│
├── index.html
├── style.css
├── README.md
├── app.js
│
└── js/
    ├── dictionary.js
    ├── graph.js
    ├── parser.js
    ├── simplex.js
    ├── standardize.js
    └── twoPhase.js
```

---

## How to Run

### Option 1 — VSCode Live Server

1. Install VSCode
2. Install the Live Server extension
3. Open the project folder
4. Right click `index.html`
5. Select:

```text
Open with Live Server
```

---

### Option 2 — Direct Browser Open

Simply open:

```text
index.html
```

in a web browser.

---

## Input Format

### Objective Function

Example:

```text
3x1 + 2x2 - x3
```

---

### Constraints

Examples:

```text
2x1 + x2 <= 8
-x1 + 3x2 >= 4
x1 - x2 = 5
```

---

## Supported Variable Bounds

Examples:

```text
x1 >= 0
x2 <= 0
x3 free
```

---

## Supported Problem Types

### Standard Simplex

Applicable when:

* Initial feasible basis exists
* All constraints are already feasible

---

### Two-Phase Simplex

Automatically used when:

* Initial feasible solution does not exist
* Constraints contain negative RHS values
* Equality constraints require Phase 1

---

## Example Problems

### Simplex Example

```text
Max z = 3x1 + 2x2

Subject to:
x1 + x2 <= 8
2x1 + x2 <= 10

x1, x2 >= 0
```

---

### Two-Phase Example

```text
Max z = x1 + 3x2

Subject to:
-x1 - x2 <= -3
-x1 + x2 <= -1
-x1 + 2x2 <= 2

x1, x2 >= 0
```

---

## Current Capabilities

* LP problem standardization
* Variable transformation
* Dictionary transformation
* Pivot operations
* Ratio test
* Optimality checking
* Multiple optimal solution detection
* Unboundedness detection
* Infeasibility detection
* Two-phase auxiliary problem solving
* Restoration of original objective function
* Graphical feasible-region visualization

---

## Future Improvements

* Bland’s Rule
* Degeneracy handling
* Sensitivity analysis
* Export results to PDF
* Dark mode UI
* Improved graph interaction

---

## Authors

Developed as a Linear Programming course project.
