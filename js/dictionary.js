function isZero(x) {
    return Math.abs(x) < 1e-10;
}

function formatNumber(x) {
    if (Number.isInteger(x)) return String(x);
    return String(Number(x.toFixed(6)));
}

function formatTerm(coeff, variable, isFirst) {
    if (isZero(coeff)) return "";

    const absCoeff = Math.abs(coeff);
    const coeffText = absCoeff === 1
        ? variable
        : `${formatNumber(absCoeff)}${variable}`;

    if (isFirst) {
        return coeff < 0 ? `-${coeffText}` : coeffText;
    }

    return coeff < 0
        ? ` - ${coeffText}`
        : ` + ${coeffText}`;
}

export function dictionaryToString(dictionary, title = "") {
    let output = "";

    if (title) {
        output += `${title}\n`;
        output += "-------------------------\n";
    }

    const lhsWidth = Math.max(
        dictionary.objectiveName.length,
        ...dictionary.rows.map(row => row.basic.length)
    );

    const rhsWidth = 8;
    const colWidth = 12;

    function buildLine(lhs, constant, coeffs) {
        let line = `${lhs.padEnd(lhsWidth, " ")} = `;

        if (isZero(constant)) {
            line += " ".repeat(rhsWidth);
        } else {
            line += padCell(formatNumber(constant), rhsWidth);
        }

        for (let j = 0; j < dictionary.variableNames.length; j++) {
            const term = formatSignedCoeff(
                coeffs[j],
                dictionary.variableNames[j]
            );

            line += padCell(term, colWidth);
        }

        return line.trimEnd();
    }

    output += buildLine(
        dictionary.objectiveName,
        dictionary.objectiveConstant || 0,
        dictionary.objective
    );

    output += "\n\n";

    for (const row of dictionary.rows) {
        output += buildLine(
            row.basic,
            row.rhs,
            row.coeffs
        );

        output += "\n";
    }

    return output;
}


function formatSignedCoeff(coeff, variable) {
    if (isZero(coeff)) return "";

    const absCoeff = Math.abs(coeff);

    let coeffText = "";
    if (absCoeff === 1) {
        coeffText = variable;
    } else {
        coeffText = `${formatNumber(absCoeff)}${variable}`;
    }

    return coeff < 0
        ? `- ${coeffText}`
        : `+ ${coeffText}`;
}

function padCell(text, width) {
    return text.padStart(width, " ");
}


export function extractSolution(dictionary) {
    const standardSolution = {};

    // Biến phi cơ sở = 0
    for (const name of dictionary.variableNames) {
        standardSolution[name] = 0;
    }

    // Biến cơ sở = RHS
    for (const row of dictionary.rows) {
        standardSolution[row.basic] = row.rhs;
    }

    const originalSolution = {};

    if (dictionary.variableMap) {
        for (const item of dictionary.variableMap) {
            let value = 0;

            for (let i = 0; i < item.newVars.length; i++) {
                const varName = item.newVars[i];
                const sign = item.signs[i];

                value += sign * (standardSolution[varName] || 0);
            }

            originalSolution[item.original] = value;
        }
    } else {
        for (const name of dictionary.variableNames) {
            if (name.startsWith("x")) {
                originalSolution[name] = standardSolution[name] || 0;
            }
        }
    }


    let objectiveValue = 0;

    if (dictionary.originalObjective) {

    for (
        let i = 0;
        i < dictionary.originalObjective.length;
        i++
    ) {

        const variableName = `x${i + 1}`;

        objectiveValue +=

            dictionary.originalObjective[i] *

            (originalSolution[variableName] || 0);
    }
    }

    if (dictionary.originalType === "max") {

        objectiveValue = -objectiveValue;
    }

    return {
        standardSolution,
        solution: originalSolution,
        objectiveValue
    };
}
