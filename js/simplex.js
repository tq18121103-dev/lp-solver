const EPS = 1e-10;

function cloneDictionary(dict) {
    return JSON.parse(JSON.stringify(dict));
}

function findEnteringVariable(dict) {
    let enteringIndex = -1;
    let minCoeff = -EPS;

    for (let j = 0; j < dict.objective.length; j++) {
        if (dict.objective[j] < minCoeff) {
            minCoeff = dict.objective[j];
            enteringIndex = j;
        }
    }

    return enteringIndex;
}

function findLeavingRow(dict, enteringIndex) {
    let bestRatio = Infinity;
    let leavingRow = -1;

    for (let i = 0; i < dict.rows.length; i++) {
        const coeff = dict.rows[i].coeffs[enteringIndex];

        if (coeff < -EPS) {
            const ratio = dict.rows[i].rhs / (-coeff);

            if (ratio < bestRatio - EPS) {
                bestRatio = ratio;
                leavingRow = i;
            }
        }
    }

    return leavingRow;
}

function pivot(dict, enteringIndex, leavingRow) {
    const old = cloneDictionary(dict);

    const enteringVar = old.variableNames[enteringIndex];
    const leavingVar = old.rows[leavingRow].basic;

    const pivotRow = old.rows[leavingRow];
    const a = pivotRow.coeffs[enteringIndex];

    const newDict = cloneDictionary(old);

    // đổi tên cột biến không cơ sở: entering ra khỏi nonbasic, leaving vào nonbasic
    newDict.variableNames[enteringIndex] = leavingVar;

    // dòng pivot mới
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

    // cập nhật các dòng khác
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

    // cập nhật hàm mục tiêu
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


function hasAlternateOptimal(dict) {
    for (let j = 0; j < dict.objective.length; j++) {
        if (Math.abs(dict.objective[j]) < EPS) {
            for (const row of dict.rows) {
                if (row.coeffs[j] < -EPS) {
                    return true;
                }
            }
        }
    }

    return false;
}

export function simplex(dict) {
    let current = cloneDictionary(dict);
    const steps = [];

    while (true) {
        const enteringIndex = findEnteringVariable(current);

        if (enteringIndex === -1) {
            return {
                optimal: true,
                alternateOptimal:
                    hasAlternateOptimal(current),
                finalDictionary: current,
                steps
            };
        }

        const leavingRow = findLeavingRow(current, enteringIndex);

        if (leavingRow === -1) {
            return {
                unbounded: true,
                enteringVariable: current.variableNames[enteringIndex],
                finalDictionary: current,
                steps
            };
        }  

        current = pivot(current, enteringIndex, leavingRow);

        steps.push({
            dictionary: cloneDictionary(current)
        });
    }
}
