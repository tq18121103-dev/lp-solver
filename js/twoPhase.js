import { simplex } from "./simplex.js";

function cloneDictionary(dict) {
    return JSON.parse(JSON.stringify(dict));
}

function pivot(dict, enteringIndex, leavingRow) {
    const old = cloneDictionary(dict);

    const enteringVar = old.variableNames[enteringIndex];
    const leavingVar = old.rows[leavingRow].basic;

    const pivotRow = old.rows[leavingRow];
    const a = pivotRow.coeffs[enteringIndex];

    const newDict = cloneDictionary(old);

    newDict.variableNames[enteringIndex] = leavingVar;

    const newPivotRow = {
        basic: enteringVar,
        rhs: -pivotRow.rhs / a,
        coeffs: []
    };

    for (let j = 0; j < pivotRow.coeffs.length; j++) {
        if (j === enteringIndex) {
            newPivotRow.coeffs[j] = 1 / a;
        } else {
            newPivotRow.coeffs[j] = -pivotRow.coeffs[j] / a;
        }
    }

    newDict.rows[leavingRow] = newPivotRow;

    for (let i = 0; i < old.rows.length; i++) {
        if (i === leavingRow) continue;

        const row = old.rows[i];
        const factor = row.coeffs[enteringIndex];

        const newRow = {
            basic: row.basic,
            rhs: row.rhs + factor * newPivotRow.rhs,
            coeffs: []
        };

        for (let j = 0; j < row.coeffs.length; j++) {
            if (j === enteringIndex) {
                newRow.coeffs[j] = factor * newPivotRow.coeffs[j];
            } else {
                newRow.coeffs[j] =
                    row.coeffs[j] + factor * newPivotRow.coeffs[j];
            }
        }

        newDict.rows[i] = newRow;
    }

    const zFactor = old.objective[enteringIndex];

    newDict.objectiveConstant =
        (old.objectiveConstant || 0) + zFactor * newPivotRow.rhs;

    for (let j = 0; j < old.objective.length; j++) {
        if (j === enteringIndex) {
            newDict.objective[j] = zFactor * newPivotRow.coeffs[j];
        } else {
            newDict.objective[j] =
                old.objective[j] + zFactor * newPivotRow.coeffs[j];
        }
    }

    return newDict;
}

function buildCostMap(originalDict) {
    const costMap = {};

    for (let j = 0; j < originalDict.variableNames.length; j++) {
        costMap[originalDict.variableNames[j]] =
            originalDict.objective[j];
    }

    for (const row of originalDict.rows) {
        costMap[row.basic] = 0;
    }

    return costMap;
}

function buildAuxiliaryDictionary(originalDict) {
    const aux = cloneDictionary(originalDict);

    aux.phase = 1;
    aux.objectiveName = "ξ";

    aux.originalObjectiveName = originalDict.objectiveName;
    aux.originalType = originalDict.originalType;
    aux.variableMap = originalDict.variableMap;
    aux.costMap = buildCostMap(originalDict);

    aux.variableNames.push("x0");

    for (const row of aux.rows) {
        row.coeffs.push(1);
    }

    aux.objectiveConstant = 0;
    aux.objective = aux.variableNames.map(name =>
        name === "x0" ? 1 : 0
    );

    return aux;
}

function findMostNegativeRhsRow(dict) {
    let minRhs = 0;
    let rowIndex = -1;

    for (let i = 0; i < dict.rows.length; i++) {
        if (dict.rows[i].rhs < minRhs) {
            minRhs = dict.rows[i].rhs;
            rowIndex = i;
        }
    }

    return rowIndex;
}


function removeBasicX0(dict) {
    const newDict = cloneDictionary(dict);
    const x0RowIndex = newDict.rows.findIndex(
        row => row.basic === "x0"
    );

    if (x0RowIndex === -1) {
        return newDict;
    }

    const row = newDict.rows[x0RowIndex];

    for (let j = 0; j < row.coeffs.length; j++) {
        const varName = newDict.variableNames[j];

        if (
            varName !== "x0" &&
            Math.abs(row.coeffs[j]) > 1e-10
        ) {
            return pivot(newDict, j, x0RowIndex);
        }
    }

    if (Math.abs(row.rhs) < 1e-10) {
        newDict.rows.splice(x0RowIndex, 1);
    }

    return newDict;
}

function removeX0Column(dict) {
    const newDict = cloneDictionary(dict);
    const x0Index = newDict.variableNames.indexOf("x0");

    if (x0Index !== -1) {
        newDict.variableNames.splice(x0Index, 1);

        for (const row of newDict.rows) {
            row.coeffs.splice(x0Index, 1);
        }

        newDict.objective.splice(x0Index, 1);
    }

    return newDict;
}

function restoreOriginalObjective(dict) {
    const restored = cloneDictionary(dict);
    const costMap = restored.costMap || {};

    restored.phase = 2;
    restored.objectiveName = restored.originalObjectiveName;

    restored.objectiveConstant = 0;
    restored.objective = restored.variableNames.map(
        name => costMap[name] || 0
    );

    for (const row of restored.rows) {
        const cBasic = costMap[row.basic] || 0;

        if (Math.abs(cBasic) < 1e-10) continue;

        restored.objectiveConstant += cBasic * row.rhs;

        for (let j = 0; j < restored.objective.length; j++) {
            restored.objective[j] += cBasic * row.coeffs[j];
        }
    }

    return restored;
}

export function twoPhaseSimplex(originalDict) {
    const phaseOneSteps = [];

    let aux = buildAuxiliaryDictionary(originalDict);

    const x0Index = aux.variableNames.indexOf("x0");
    const leavingRow = findMostNegativeRhsRow(aux);

    aux = pivot(aux, x0Index, leavingRow);

    phaseOneSteps.push({
        dictionary: cloneDictionary(aux)
    });

    const phaseOneResult = simplex(aux);

    for (const step of phaseOneResult.steps) {
        phaseOneSteps.push(step);
    }

    const phaseOneFinal = phaseOneResult.finalDictionary;

    const phaseOneObjective =
        phaseOneFinal.objectiveConstant || 0;

    if (phaseOneObjective > 1e-8) {

        return {
            infeasible: true,
            phaseOneSteps,
            phaseOneFinal
        };
    }

    let phaseOneClean = removeBasicX0(phaseOneFinal);
    let phaseTwoStart = removeX0Column(phaseOneClean);
    phaseTwoStart.costMap = aux.costMap;
    phaseTwoStart.originalObjectiveName = aux.originalObjectiveName;
    phaseTwoStart.originalType = aux.originalType;
    phaseTwoStart.variableMap = aux.variableMap;

    phaseTwoStart = restoreOriginalObjective(phaseTwoStart);

    const phaseTwoResult = simplex(phaseTwoStart);

    return {
        optimal: phaseTwoResult.optimal,
        unbounded: phaseTwoResult.unbounded,
        enteringVariable: phaseTwoResult.enteringVariable,
        phaseOneSteps,
        phaseOneFinal,
        phaseTwoStart,
        phaseTwoSteps: phaseTwoResult.steps,
        finalDictionary: phaseTwoResult.finalDictionary
    };
}
