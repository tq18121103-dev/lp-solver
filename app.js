import {
    parseExpression,
    normalizeCoefficients,
    validateExpression
} from "./js/parser.js";

import {
    convertToMin,
    standardizeVariables,
    standardizeConstraints
} from "./js/standardize.js";

import {
    dictionaryToString,
    extractSolution
} from "./js/dictionary.js";

import { simplex } from "./js/simplex.js";
import { twoPhaseSimplex } from "./js/twoPhase.js";

const generateBtn = document.getElementById("generateBtn");
const solveBtn = document.getElementById("solveBtn");
const generateBoundsBtn = document.getElementById("generateBoundsBtn");

generateBtn.addEventListener("click", generateConstraintInputs);
solveBtn.addEventListener("click", readProblemFromForm);
generateBoundsBtn.addEventListener("click", generateVariableBounds);

function showOutput(text) {
    document.getElementById("output").textContent = text;
}

function renderOptimalConclusion(finalDictionary) {
    const finalResult = extractSolution(finalDictionary);

    let text = "\n\nKết luận\n";
    text += "-------------------------\n";
    text += "Nghiệm tối ưu:\n";

    for (const [name, value] of Object.entries(finalResult.solution)) {
        text += `${name} = ${value}\n`;
    }

    text += "\nGiá trị tối ưu:\n";
    text += `z* = ${finalResult.objectiveValue}\n`;

    return text;
}

function generateConstraintInputs() {
    const n = parseInt(
        document.getElementById("numConstraints").value
    );

    const container =
        document.getElementById("constraintsContainer");

    container.innerHTML = "";

    for (let i = 0; i < n; i++) {
        container.innerHTML += `
            <div class="constraint">
                <h3>Ràng buộc ${i + 1}</h3>

                <input
                    type="text"
                    id="constraint${i}"
                    placeholder="Ví dụ: 2x1 + 3x2"
                >

                <select id="operator${i}">
                    <option value="<="><=</option>
                    <option value=">=">>=</option>
                    <option value="=">=</option>
                </select>

                <input
                    type="number"
                    id="rhs${i}"
                    placeholder="vế phải"
                >
            </div>
        `;
    }
}

function generateVariableBounds() {
    const n = parseInt(
        document.getElementById("numVariables").value
    );

    const container =
        document.getElementById("boundsContainer");

    container.innerHTML = "";

    for (let i = 0; i < n; i++) {
        container.innerHTML += `
            <div class="bound">
                <label>Biến x${i + 1}</label>

                <select id="bound${i}">
                    <option value="ge0">x${i + 1} >= 0</option>
                    <option value="le0">x${i + 1} <= 0</option>
                    <option value="free">x${i + 1} tự do</option>
                </select>
            </div>
        `;
    }
}

function readProblemFromForm() {
    const type = document.getElementById("objectiveType").value;

    const numVariables = parseInt(
        document.getElementById("numVariables").value
    );

    const numConstraints = parseInt(
        document.getElementById("numConstraints").value
    );

    const objectiveInput =
        document.getElementById("objectiveFunction").value;

    const objectiveCheck =
        validateExpression(objectiveInput, numVariables);

    if (!objectiveCheck.valid) {
        showOutput(
            "Lỗi nhập liệu:\n" +
            "Hàm mục tiêu sai định dạng.\n" +
            objectiveCheck.message +
            "\n\nVui lòng nhập dạng: 3x1 + 2x2 - x3"
        );
        return;
    }

    const objectiveObj = parseExpression(objectiveInput);

    const objective = normalizeCoefficients(
        objectiveObj,
        numVariables
    );

    const constraints = [];

    for (let i = 0; i < numConstraints; i++) {
        const expr = document.getElementById(`constraint${i}`).value;
        const sign = document.getElementById(`operator${i}`).value;
        const rhs = parseFloat(document.getElementById(`rhs${i}`).value);

        const constraintCheck =
            validateExpression(expr, numVariables);

        if (!constraintCheck.valid) {
            showOutput(
                "Lỗi nhập liệu:\n" +
                `Ràng buộc ${i + 1} sai định dạng.\n` +
                constraintCheck.message +
                "\n\nVui lòng nhập dạng: 2x1 - 3x2 + x3"
            );
            return;
        }

        const coeffObj = parseExpression(expr);

        const coeffs = normalizeCoefficients(
            coeffObj,
            numVariables
        );

        constraints.push({
            coeffs,
            sign,
            rhs
        });
    }

    const variableBounds = [];

    for (let i = 0; i < numVariables; i++) {
        const boundInput = document.getElementById(`bound${i}`);

        variableBounds.push(
            boundInput ? boundInput.value : "ge0"
        );
    }

    const problem = {
        type,
        numVariables,
        numConstraints,
        objective,
        constraints,
        variableBounds
    };

    const minProblem = convertToMin(problem);
    const variableStandardized = standardizeVariables(minProblem);
    const dictionaryData = standardizeConstraints(variableStandardized);

    if (dictionaryData.needPhaseOne) {
        solveByTwoPhase(dictionaryData);
        return;
    }

    solveBySimplex(dictionaryData);
}

function solveBySimplex(dictionaryData) {
    const result = simplex(dictionaryData);

    let text = dictionaryToString(
        dictionaryData,
        "Từ vựng ban đầu"
    );

    for (let i = 0; i < result.steps.length; i++) {
        text += "\n\n";
        text += dictionaryToString(
            result.steps[i].dictionary,
            `Từ vựng bước ${i + 1}`
        );
    }

    if (result.unbounded) {
        text += "\n\nKết luận\n";
        text += "-------------------------\n";
        text += `Biến ${result.enteringVariable} có thể tăng vô hạn.\n`;

        if (dictionaryData.originalType === "max") {
            text += "Bài toán không giới nội trên.\n";
        } else {
            text += "Bài toán không giới nội dưới.\n";
        }

        showOutput(text);
        return;
    }

    if (result.optimal) {
        text += renderOptimalConclusion(result.finalDictionary);
    }

    showOutput(text);
}

function solveByTwoPhase(dictionaryData) {
    const twoPhaseResult = twoPhaseSimplex(dictionaryData);

    let text = dictionaryToString(
        dictionaryData,
        "Từ vựng ban đầu chưa chấp nhận được"
    );

    text += "\n\nPha 1: Bài toán bổ trợ\n";

    for (let i = 0; i < twoPhaseResult.phaseOneSteps.length; i++) {
        text += "\n";
        text += dictionaryToString(
            twoPhaseResult.phaseOneSteps[i].dictionary,
            `Từ vựng pha 1 - bước ${i + 1}`
        );
    }

    if (twoPhaseResult.infeasible) {
        text += "\n\nKết luận\n";
        text += "-------------------------\n";
        text += "Giá trị tối ưu của bài toán bổ trợ lớn hơn 0.\n";
        text += "Suy ra bài toán gốc không có nghiệm chấp nhận được.\n";
        text += "Bài toán vô nghiệm.\n";


        showOutput(text);
        return;
    }

    text += "\n\nPha 2: Khôi phục hàm mục tiêu gốc\n";
    text += dictionaryToString(
        twoPhaseResult.phaseTwoStart,
        "Từ vựng bắt đầu pha 2"
    );

    for (let i = 0; i < twoPhaseResult.phaseTwoSteps.length; i++) {
        text += "\n";
        text += dictionaryToString(
            twoPhaseResult.phaseTwoSteps[i].dictionary,
            `Từ vựng pha 2 - bước ${i + 1}`
        );
    }

    if (twoPhaseResult.unbounded) {
        text += "\n\nKết luận\n";
        text += "-------------------------\n";
        text += "Bài toán không giới nội trên.\n";

        showOutput(text);
        return;
    }

    text += renderOptimalConclusion(twoPhaseResult.finalDictionary);

    showOutput(text);
}