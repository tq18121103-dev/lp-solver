# Linear Programming Solver

A web-based application for solving Linear Programming (LP) problems using:

- Simplex Method
- Two-Phase Simplex Method

The project is implemented with pure HTML, CSS, and JavaScript.

---

## Features

- Solve maximization and minimization LP problems
- Standard Simplex algorithm
- Two-Phase Simplex algorithm
- Detect:
  - Optimal solution
  - Unbounded problems
  - Infeasible problems
- Dynamic constraint generation
- Variable bound configuration
- Input validation and error handling
- Step-by-step dictionary/tableau output

---

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6 Modules)

---

## Project Structure

```text
lp-solver/
│
├── index.html
├── style.css
├── README.md
│
└── js/
    ├── app.js
    ├── parser.js
    ├── standardize.js
    ├── simplex.js
    ├── twoPhase.js
    ├── dictionary.js
    ├── renderer.js
    └── utils.js
```

---

## How to Run

### Option 1 — VSCode Live Server

1. Install VSCode
2. Install the **Live Server** extension
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

## Supported Problem Types

### Standard Simplex

Applicable when:

- All constraints can be converted into standard form
- Initial feasible basis exists

---

### Two-Phase Simplex

Automatically used when:

- Initial feasible solution does not exist
- Constraints contain negative RHS values requiring Phase 1

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

- Standardization of LP problems
- Dictionary transformation
- Pivot operations
- Ratio test
- Optimality checking
- Unboundedness detection
- Two-phase auxiliary problem solving
- Restoration of original objective function

---

## Future Improvements

- Multiple optimal solution detection
- Degeneracy handling
- Bland’s Rule
- Graphical method visualization
- Dark mode UI
- Export results to PDF

---

## Authors

Developed as a Linear Programming course project.
