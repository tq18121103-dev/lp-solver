import { drawGraph } from "./js/graph.js";

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

document
    .getElementById("objectiveFunction")
    .addEventListener("input", function() {

        if (this.value.trim() !== "") {

            clearSingleError(this);

            showOutput("");
        }
    });

function showOutput(text) {
    document.getElementById("output").textContent = text;
}

function clearErrorStyles() {

    const allInputs =
        document.querySelectorAll("input, select");

    allInputs.forEach(element => {

        element.style.border =
            "1px solid #d1d5db";
    });
}

function markError(element) {

    element.style.border =
        "2px solid #ef4444";
}

function clearSingleError(element) {

    element.style.border =
        "1px solid #d1d5db";
}

function renderOptimalConclusion(finalDictionary) {

    const finalResult =
        extractSolution(finalDictionary);

    let text = "\n\nKết luận\n";

    text += "-------------------------\n";

    text += "Nghiệm tối ưu:\n";

    for (const [name, value]
        of Object.entries(finalResult.solution)) {

        text += `${name} = ${value}\n`;
    }

    text += "\nGiá trị tối ưu:\n";
    const finalZ =

        finalDictionary.originalType === "max"

            ? -finalResult.objectiveValue

            : finalResult.objectiveValue;

    text += `z* = ${finalZ}\n`;
    text += `\nHay:\n`;
    text += `z = ${Math.abs(finalZ)}\n`;

    
    if (finalDictionary.alternateOptimal) {

        text +=
            "\nBài toán có vô số nghiệm tối ưu.\n";

        text +=
            "\nHọ nghiệm tối ưu:\n";

        for (const row of finalDictionary.rows) {

            text +=
                `${row.basic} = `;

            text +=
                `${row.rhs.toFixed(6)}`;

            for (
                let j = 0;
                j < row.coeffs.length;
                j++
            ) {

                const coeff =
                    row.coeffs[j];

                if (
                    Math.abs(coeff) < 1e-10
                ) {
                    continue;
                }

                const variable =
                    finalDictionary.variableNames[j];

                if (coeff > 0) {

                    text +=
                        ` + ${coeff.toFixed(6)}${variable}`;
                }

                else {

                    text +=
                        ` - ${Math.abs(coeff).toFixed(6)}${variable}`;
                }
            }

            text += "\n";
        }
    }

    return text;
}

function generateConstraintInputs() {

    clearErrorStyles();

    const numVariablesInput =
        document.getElementById("numVariables");

    const numConstraintsInput =
        document.getElementById("numConstraints");

    const numVariables =
        parseInt(numVariablesInput.value);

    const numConstraints =
        parseInt(numConstraintsInput.value);

    // VALIDATE SỐ BIẾN
    if (isNaN(numVariables) || numVariables <= 0) {

        markError(numVariablesInput);

        showOutput(
            "Lỗi nhập liệu:\n" +
            "Số biến phải lớn hơn 0."
        );

        return;
    }

    // VALIDATE SỐ RÀNG BUỘC
    if (isNaN(numConstraints) || numConstraints <= 0) {

        markError(numConstraintsInput);

        showOutput(
            "Lỗi nhập liệu:\n" +
            "Số ràng buộc phải lớn hơn 0."
        );

        return;
    }

    // VALIDATE HÀM MỤC TIÊU
    const objectiveInput =
        document.getElementById("objectiveFunction");

    if (objectiveInput.value.trim() === "") {

        markError(objectiveInput);

        showOutput(
            "Lỗi nhập liệu:\n" +
            "Vui lòng nhập hàm mục tiêu."
        );

        return;
    }

    const objectiveCheck =
        validateExpression(
            objectiveInput.value,
            numVariables
        );

    if (!objectiveCheck.valid) {

        markError(objectiveInput);

        showOutput(
            "Lỗi nhập liệu:\n" +
            "Hàm mục tiêu sai định dạng.\n" +
            objectiveCheck.message
        );

        return;
    }

    const container =
        document.getElementById("constraintsContainer");

    container.innerHTML = "";

    showOutput("");

    for (let i = 0; i < numConstraints; i++) {

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

        setTimeout(() => {

            const constraintInput =
                document.getElementById(`constraint${i}`);

            const rhsInput =
                document.getElementById(`rhs${i}`);

            constraintInput.addEventListener(
                "input",
                () => {

                    if (
                        constraintInput.value.trim() !== ""
                    ) {

                        clearSingleError(
                            constraintInput
                        );

                        showOutput("");
                    }
                }
            );

            rhsInput.addEventListener(
                "input",
                () => {

                    if (
                        rhsInput.value.trim() !== ""
                    ) {

                        clearSingleError(
                            rhsInput
                        );

                        showOutput("");
                    }
                }
            );

        }, 0);
    }
}

function generateVariableBounds() {

    clearErrorStyles();

    const numVariablesInput =
        document.getElementById("numVariables");

    const numVariables =
        parseInt(numVariablesInput.value);

    if (isNaN(numVariables) || numVariables <= 0) {

        markError(numVariablesInput);

        showOutput(
            "Lỗi nhập liệu:\n" +
            "Số biến phải lớn hơn 0."
        );

        return;
    }

    const container =
        document.getElementById("boundsContainer");

    container.innerHTML = "";

    showOutput("");

    for (let i = 0; i < numVariables; i++) {

        container.innerHTML += `
            <div class="bound">

                <label>Biến x${i + 1}</label>

                <select id="bound${i}">
                    <option value="ge0">
                        x${i + 1} >= 0
                    </option>

                    <option value="le0">
                        x${i + 1} <= 0
                    </option>

                    <option value="free">
                        x${i + 1} tự do
                    </option>
                </select>

            </div>
        `;
    }
}

function readProblemFromForm() {

    clearErrorStyles();

    const type =
        document.getElementById("objectiveType").value;

    const numVariables =
        parseInt(
            document.getElementById("numVariables").value
        );

    const numConstraints =
        parseInt(
            document.getElementById("numConstraints").value
        );

    if (isNaN(numVariables) || numVariables <= 0) {

        markError(
            document.getElementById("numVariables")
        );

        showOutput(
            "Lỗi nhập liệu:\n" +
            "Số biến phải lớn hơn 0."
        );

        return;
    }

    if (isNaN(numConstraints) || numConstraints <= 0) {

        markError(
            document.getElementById("numConstraints")
        );

        showOutput(
            "Lỗi nhập liệu:\n" +
            "Số ràng buộc phải lớn hơn 0."
        );

        return;
    }

    const objectiveInput =
        document.getElementById("objectiveFunction").value;

    if (objectiveInput.trim() === "") {

        markError(
            document.getElementById("objectiveFunction")
        );

        showOutput(
            "Lỗi nhập liệu:\n" +
            "Vui lòng nhập hàm mục tiêu."
        );

        return;
    }

    const objectiveCheck =
        validateExpression(
            objectiveInput,
            numVariables
        );

    if (!objectiveCheck.valid) {

        markError(
            document.getElementById("objectiveFunction")
        );

        showOutput(
            "Lỗi nhập liệu:\n" +
            "Hàm mục tiêu sai định dạng.\n" +
            objectiveCheck.message +
            "\n\nVui lòng nhập dạng: 3x1 + 2x2 - x3"
        );

        return;
    }

    const objectiveObj =
        parseExpression(objectiveInput);

    const objective =
        normalizeCoefficients(
            objectiveObj,
            numVariables
        );

    if (
        document.getElementById("constraintsContainer")
            .children.length === 0
    ) {

        showOutput(
            "Lỗi nhập liệu:\n" +
            "Vui lòng tạo form ràng buộc."
        );

        return;
    }

    const constraints = [];

    for (let i = 0; i < numConstraints; i++) {

        const expr =
            document.getElementById(`constraint${i}`).value;

        const sign =
            document.getElementById(`operator${i}`).value;

        const rhs =
            parseFloat(
                document.getElementById(`rhs${i}`).value
            );

        if (expr.trim() === "") {

            markError(
                document.getElementById(`constraint${i}`)
            );

            showOutput(
                "Lỗi nhập liệu:\n" +
                `Ràng buộc ${i + 1} chưa nhập biểu thức.`
            );

            return;
        }

        if (isNaN(rhs)) {

            markError(
                document.getElementById(`rhs${i}`)
            );

            showOutput(
                "Lỗi nhập liệu:\n" +
                `Ràng buộc ${i + 1} chưa nhập vế phải.`
            );

            return;
        }

        const constraintCheck =
            validateExpression(
                expr,
                numVariables
            );

        if (!constraintCheck.valid) {

            markError(
                document.getElementById(`constraint${i}`)
            );

            showOutput(
                "Lỗi nhập liệu:\n" +
                `Ràng buộc ${i + 1} sai định dạng.\n` +
                constraintCheck.message +
                "\n\nVui lòng nhập dạng: 2x1 - 3x2 + x3"
            );

            return;
        }

        const coeffObj =
            parseExpression(expr);

        const coeffs =
            normalizeCoefficients(
                coeffObj,
                numVariables
            );

        constraints.push({
            coeffs,
            sign,
            rhs
        });
    }

    if (
        document.getElementById("boundsContainer")
            .children.length === 0
    ) {

        showOutput(
            "Lỗi nhập liệu:\n" +
            "Vui lòng tạo ràng buộc biến."
        );

        return;
    }

    const variableBounds = [];

    for (let i = 0; i < numVariables; i++) {

        const boundInput =
            document.getElementById(`bound${i}`);

        variableBounds.push(
            boundInput
                ? boundInput.value
                : "ge0"
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

    const minProblem =
        convertToMin(problem);

    const variableStandardized =
        standardizeVariables(minProblem);

    const dictionaryData =
        standardizeConstraints(
            variableStandardized
        );

    if (dictionaryData.needPhaseOne) {

        solveByTwoPhase(
            dictionaryData,
            problem
        );

        return;
    }

    solveBySimplex(
        dictionaryData,
        problem
    );
}

function solveBySimplex(dictionaryData, problem) {

    const result =
        simplex(dictionaryData);

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

    // KHÔNG GIỚI NỘI
    if (result.unbounded) {

        drawGraph(problem, null);

        text += "\n\nKết luận\n";

        text += "-------------------------\n";

        text +=
            `Biến ${result.enteringVariable} có thể tăng vô hạn.\n`;

        if (dictionaryData.originalType === "max") {

            text +=
                "Bài toán không giới nội trên.\n";
        }

        else {

            text +=
                "Bài toán không giới nội dưới.\n";
        }

        showOutput(text);

        return;
    }

    // TỐI ƯU
    if (result.optimal) {

        const finalResult =
            extractSolution(
                result.finalDictionary
            );

        drawGraph(problem, finalResult);
        
        result.finalDictionary.alternateOptimal =
            result.alternateOptimal;

        text += renderOptimalConclusion(
            result.finalDictionary
        );
    }

    showOutput(text);
}

function solveByTwoPhase(dictionaryData, problem) {

    const result =
        twoPhaseSimplex(dictionaryData);

    let text = dictionaryToString(
        dictionaryData,
        "Từ vựng ban đầu chưa chấp nhận được"
    );

    // =========================
    // PHASE 1
    // =========================

    text += "\n\nPha 1: Bài toán bổ trợ\n";

    for (let i = 0; i < result.phaseOneSteps.length; i++) {

        text += "\n";

        text += dictionaryToString(
            result.phaseOneSteps[i].dictionary,
            `Từ vựng pha 1 - bước ${i + 1}`
        );
    }

    // =========================
    // INFEASIBLE
    // =========================

    if (result.infeasible) {

        drawGraph(problem, null);

        text += "\n\nKết luận\n";

        text += "-------------------------\n";

        text +=
            "Giá trị tối ưu của bài toán bổ trợ lớn hơn 0.\n";

        text +=
            "Suy ra bài toán gốc không có nghiệm chấp nhận được.\n";

        text +=
            "Bài toán vô nghiệm.\n";

        showOutput(text);

        return;
    }

    // =========================
    // PHASE 2
    // =========================

    text += "\n\nPha 2: Khôi phục hàm mục tiêu gốc\n";

    text += dictionaryToString(
        result.phaseTwoStart,
        "Từ vựng bắt đầu pha 2"
    );

    for (let i = 0; i < result.phaseTwoSteps.length; i++) {

        text += "\n";

        text += dictionaryToString(
            result.phaseTwoSteps[i].dictionary,
            `Từ vựng pha 2 - bước ${i + 1}`
        );
    }

    // =========================
    // UNBOUNDED
    // =========================

    if (result.unbounded) {

        drawGraph(problem, null);

        text += "\n\nKết luận\n";

        text += "-------------------------\n";

        text +=
            "Bài toán không giới nội trên.\n";

        showOutput(text);

        return;
    }

    // =========================
    // OPTIMAL
    // =========================

    const finalResult =
        extractSolution(
            result.finalDictionary
        );

    drawGraph(problem, finalResult);
   
    result.finalDictionary.alternateOptimal =
        result.alternateOptimal;

    text += renderOptimalConclusion(
        result.finalDictionary
    );

    showOutput(text);
}

document.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {

        event.preventDefault();

        readProblemFromForm();
    }

});
