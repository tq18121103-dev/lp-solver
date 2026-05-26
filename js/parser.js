export function parseExpression(expression) {
    const cleanedExpression = expression.replace(/\s+/g, "");
    const terms = cleanedExpression.match(/[+-]?[^+-]+/g);

    const coefficients = {};

    for (const term of terms) {
        const match = term.match(/^([+-]?\d*\.?\d*)x(\d+)$/);

        if (!match) {
            throw new Error(`Hạng tử không hợp lệ: ${term}`);
        }

        let coefficient = match[1];
        const variableName = `x${match[2]}`;

        if (coefficient === "" || coefficient === "+") {
            coefficient = 1;
        } else if (coefficient === "-") {
            coefficient = -1;
        } else {
            coefficient = parseFloat(coefficient);
        }

        coefficients[variableName] =
            (coefficients[variableName] || 0) + coefficient;
    }

    return coefficients;
}

export function normalizeCoefficients(coeffObj, numVariables) {
    const coeffs = [];

    for (let i = 1; i <= numVariables; i++) {
        coeffs.push(coeffObj[`x${i}`] || 0);
    }

    return coeffs;
}

export function validateExpression(expression, numVariables) {
    if (!expression || expression.trim() === "") {
        return {
            valid: false,
            message: "Biểu thức không được để trống."
        };
    }

    const cleanedExpression = expression.replace(/\s+/g, "");

    if (/[\+\-]{2,}/.test(cleanedExpression)) {
        return {
            valid: false,
            message: "Biểu thức không được chứa hai dấu liên tiếp như ++, --, +-, -+."
        };
    }

    const terms = cleanedExpression.match(/[+-]?[^+-]+/g);

    if (!terms) {
        return {
            valid: false,
            message: "Biểu thức sai định dạng."
        };
    }

    for (const term of terms) {
        const match = term.match(/^([+-]?)(\d*\.?\d*)x(\d+)$/);

        if (!match) {
            return {
                valid: false,
                message: `Hạng tử "${term}" sai định dạng. Ví dụ đúng: 3x1, -2x2, x3.`
            };
        }

        const coefficientText = match[2];
        const variableIndex = parseInt(match[3]);

        if (coefficientText === ".") {
            return {
                valid: false,
                message: `Hệ số trong "${term}" sai định dạng.`
            };
        }

        if (variableIndex < 1 || variableIndex > numVariables) {
            return {
                valid: false,
                message: `Biến x${variableIndex} không hợp lệ. Số biến hiện tại là ${numVariables}.`
            };
        }
    }

    return {
        valid: true,
        message: ""
    };
}