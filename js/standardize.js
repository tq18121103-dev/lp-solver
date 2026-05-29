export function convertToMin(problem) {
    const p = structuredClone(problem);

    p.originalType = problem.type;

    if (problem.type === "max") {
        p.type = "min";
        p.objectiveName = "-z";
        p.objective = p.objective.map(c => -c);
    } else {
        p.type = "min";
        p.objectiveName = "z";
    }

    return p;
}

export function standardizeVariables(problem) {
    const newObjective = [];
    const newConstraints = problem.constraints.map(c => ({
        sign: c.sign,
        rhs: c.rhs,
        coeffs: []
    }));

    const variableMap = [];
    let newVarIndex = 1;

    for (let j = 0; j < problem.numVariables; j++) {
        const bound = problem.variableBounds[j];
        const c = problem.objective[j];

        if (bound === "ge0") {
            const name = `x${newVarIndex++}`;

            newObjective.push(c);

            for (let i = 0; i < problem.constraints.length; i++) {
                newConstraints[i].coeffs.push(problem.constraints[i].coeffs[j]);
            }

            variableMap.push({
                original: `x${j + 1}`,
                formula: `${name}`,
                newVars: [name],
                signs: [1]
            });
        }

        else if (bound === "le0") {
            const name = `x${newVarIndex++}`;

            newObjective.push(-c);

            for (let i = 0; i < problem.constraints.length; i++) {
                newConstraints[i].coeffs.push(-problem.constraints[i].coeffs[j]);
            }

            variableMap.push({
                original: `x${j + 1}`,
                formula: `-${name}`,
                newVars: [name],
                signs: [-1]
            });
        }

        else if (bound === "free") {
            const plus = `x${newVarIndex++}`;
            const minus = `x${newVarIndex++}`;

            newObjective.push(c);
            newObjective.push(-c);

            for (let i = 0; i < problem.constraints.length; i++) {
                const a = problem.constraints[i].coeffs[j];

                newConstraints[i].coeffs.push(a);
                newConstraints[i].coeffs.push(-a);
            }

            variableMap.push({
                original: `x${j + 1}`,
                formula: `${plus} - ${minus}`,
                newVars: [plus, minus],
                signs: [1, -1]
            });
        }
    }

    return {
        ...problem,
        objective: newObjective,
        constraints: newConstraints,
        variableMap,
        numStandardVariables: newObjective.length
    };
}

export function standardizeConstraints(problem) {
    const rows = [];
    const variableNames = [];

    for (let j = 0; j < problem.objective.length; j++) {
        variableNames.push(`x${j + 1}`);
    }

    let needPhaseOne = false;

    for (let i = 0; i < problem.constraints.length; i++) {
        const c = structuredClone(problem.constraints[i]);

        let coeffs = [...c.coeffs];
        let rhs = c.rhs;
        let sign = c.sign;

        // Đưa >= về <= bằng cách nhân -1
        if (sign === ">=") {
            coeffs = coeffs.map(v => -v);
            rhs = -rhs;
            sign = "<=";
        }

        // Dấu =
        if (sign === "=") {

            // Ax <= b
            rows.push({
                basic: `w${rows.length + 1}`,
                rhs,
                coeffs: coeffs.map(a => -a)
            });

            if (rhs < 0) {
                needPhaseOne = true;
            }

            // -Ax <= -b
            rows.push({
                basic: `w${rows.length + 1}`,
                rhs: -rhs,
                coeffs: coeffs.map(a => a)
            });

            if (-rhs < 0) {
                needPhaseOne = true;
            }
            continue;
        }
        // Sau chuẩn hoá phải là <= mới tạo được w_i
        if (sign === "<=") {
            rows.push({
                basic: `w${rows.length + 1}`,
                rhs,
                coeffs: coeffs.map(a => -a)
            });

            if (rhs < 0) {
                needPhaseOne = true;
            }
        }
    }

    return {
        objectiveName: problem.objectiveName,
        originalType: problem.originalType,
        objectiveConstant: 0,
        objective: [...problem.objective],
        variableNames,
        rows,
        variableMap: problem.variableMap,
        needPhaseOne
    };
}