function findIntersection(c1, c2) {

    const a1 = c1.coeffs[0];
    const b1 = c1.coeffs[1];
    const c1rhs = c1.rhs;

    const a2 = c2.coeffs[0];
    const b2 = c2.coeffs[1];
    const c2rhs = c2.rhs;

    const determinant =
        a1 * b2 - a2 * b1;

    if (Math.abs(determinant) < 1e-10) {
        return null;
    }

    const x =
        (c1rhs * b2 - c2rhs * b1)
        / determinant;

    const y =
        (a1 * c2rhs - a2 * c1rhs)
        / determinant;

    return { x, y };
}

export function drawGraph(problem, solution) {

    const graphDiv =
        document.getElementById("graph");

    graphDiv.innerHTML = "";

    if (problem.numVariables !== 2) {

        graphDiv.innerHTML = `
            <div style="
                padding:20px;
                font-size:18px;
                color:#ef4444;
                font-weight:bold;
            ">
                Chỉ hỗ trợ visualization cho bài toán 2 biến.
            </div>
        `;

        return;
    }

    const constraints =
        problem.constraints;

    const traces = [];

    const intersectionPoints = [];

    const xValues = [];

    for (let x = 0; x <= 20; x += 0.1) {
        xValues.push(x);
    }

    // VẼ ĐƯỜNG RÀNG BUỘC
    constraints.forEach((constraint, index) => {

        const a = constraint.coeffs[0];
        const b = constraint.coeffs[1];
        const c = constraint.rhs;

        const yValues = xValues.map(x => {

            if (Math.abs(b) < 1e-10) {
                return null;
            }

            return (c - a * x) / b;
        });

        traces.push({

            x: xValues,

            y: yValues,

            mode: "lines",

            name:
                `Constraint ${index + 1}`,

            line: {
                width: 3
            }
        });
    });

    // TÍNH GIAO ĐIỂM
    for (let i = 0; i < constraints.length; i++) {

        for (let j = i + 1; j < constraints.length; j++) {

            const point =
                findIntersection(
                    constraints[i],
                    constraints[j]
                );

            if (!point) continue;

            if (
                isFinite(point.x) &&
                isFinite(point.y)
            ) {

                intersectionPoints.push(point);
            }
        }
    }

    // HIỆN GIAO ĐIỂM
    if (intersectionPoints.length > 0) {

        traces.push({

            x: intersectionPoints.map(
                p => p.x
            ),

            y: intersectionPoints.map(
                p => p.y
            ),

            mode:
                "markers+text",

            name:
                "Giao điểm",

            text:
                intersectionPoints.map(
                    (p, index) =>
                        `P${index + 1}`
                ),

            textposition:
                "top center",

            marker: {

                size: 10,

                color: "#111827"
            }
        });
    }

    // ĐIỂM TỐI ƯU
    if (
        solution &&
        solution.solution
    ) {

        const x1 =
            solution.solution.x1 || 0;

        const x2 =
            solution.solution.x2 || 0;

        traces.push({

            x: [x1],

            y: [x2],

            mode:
                "markers+text",

            name:
                "Optimal Point",

            text:
                ["Optimal"],

            textposition:
                "bottom right",

            marker: {

                size: 14,

                color: "#ef4444"
            }
        });
    }

    // AUTO SCALE
    const allX = [];
    const allY = [];

    intersectionPoints.forEach(p => {

        allX.push(p.x);
        allY.push(p.y);
    });

    if (
        solution &&
        solution.solution
    ) {

        allX.push(
            solution.solution.x1 || 0
        );

        allY.push(
            solution.solution.x2 || 0
        );
    }

    const maxX =
        Math.max(...allX, 10);

    const maxY =
        Math.max(...allY, 10);
    function isFeasible(point) {

        for (const constraint of constraints) {

            const lhs =
                constraint.coeffs[0] * point.x +
                constraint.coeffs[1] * point.y;

            if (
                constraint.sign === "<=" &&
                lhs > constraint.rhs + 1e-8
            ) {
                return false;
            }

            if (
                constraint.sign === ">=" &&
                lhs < constraint.rhs - 1e-8
            ) {
                return false;
            }

            if (
                constraint.sign === "=" &&
                Math.abs(lhs - constraint.rhs) > 1e-8
            ) {
                return false;
            }
        }

        return point.x >= 0 && point.y >= 0;
    }
// =========================
// TÔ MIỀN NGHIỆM
// =========================

    const feasiblePoints = [];
    
    const origin = { x: 0, y: 0 };

    if (isFeasible(origin)) {

        feasiblePoints.push(origin);
    }

    constraints.forEach(c => {

        const a = c.coeffs[0];
        const b = c.coeffs[1];
        const rhs = c.rhs;

    // giao Ox
        if (Math.abs(a) > 1e-10) {
            const point = {
                x: rhs / a,

                y:0
            };

            if(
                isFinite(point.x) && 
                isFinite(point.y) &&
                isFeasible(point)

            ){

                feasiblePoints.push(point);

            }
        }

    // giao Oy
        if (Math.abs(b) > 1e-10) {

            const point = { 

                x: 0, 

                y: rhs / b 

            };

            if (

                isFinite(point.x) &&
                isFinite(point.y) &&
                isFeasible(point)

            ){

                feasiblePoints.push(point);

            }
        }
    });

    // LỌC GIAO ĐIỂM FEASIBLE
    for (const point of intersectionPoints) {

        if (isFeasible(point)) {

            feasiblePoints.push(point);
        }
    }

    // SẮP XẾP THÀNH POLYGON

    const uniquePoints = [];

    for (const p of feasiblePoints) {

        const exists = uniquePoints.some(q =>

            Math.abs(p.x - q.x) < 1e-6 &&
            Math.abs(p.y - q.y) < 1e-6
        );

        if (!exists) {

            uniquePoints.push(p);
        }
    }

    feasiblePoints.length = 0;

    feasiblePoints.push(...uniquePoints);

    if (feasiblePoints.length >= 3) {

        const centerX =
            feasiblePoints.reduce((s, p) => s + p.x, 0)
            / feasiblePoints.length;

        const centerY =
            feasiblePoints.reduce((s, p) => s + p.y, 0)
            / feasiblePoints.length;

        feasiblePoints.sort((a, b) => {

            const angleA =
                Math.atan2(
                    a.y - centerY,
                    a.x - centerX
                );

            const angleB =
                Math.atan2(
                    b.y - centerY,
                    b.x - centerX
                );

            return angleA - angleB;
        });

        traces.push({

            x: feasiblePoints.map(p => p.x),

            y: feasiblePoints.map(p => p.y),

            fill: "toself",

            mode: "lines",

            name: "Miền nghiệm",

            opacity: 0.25,

            line: {
                width: 0
            }
        });
    }


// =========================
// VẼ ĐƯỜNG HÀM MỤC TIÊU
// =========================

    if (
        solution &&
        solution.solution
    ) {

        const c1 =
            problem.objective[0];

        const c2 =
            problem.objective[1];

        const z =
            Math.abs(solution.objectiveValue);

        const zYValues =
            xValues.map(x => {

                if (
                    Math.abs(c2) < 1e-10
                ) {
                    return null;
                }

                return (z - c1 * x) / c2;
            });

        traces.push({

            x: xValues,

            y: zYValues,

            mode: "lines",

            name: "Đường z",

            line: {

                dash: "dash",

                width: 3
            }
        });
    }


    const layout = {

        title: {

            text:
                "Biểu đồ miền nghiệm",

            font: {
                size: 28
            }
        },

        paper_bgcolor:
            "#ffffff",

        plot_bgcolor:
            "#ffffff",

        xaxis: {

            title: "x1",

            range:
                [-1, maxX + 5],

            zeroline: true,

            gridcolor:
                "#e5e7eb"
        },

        yaxis: {

            title: "x2",

            range:
                [-1, maxY + 5],

            zeroline: true,

            gridcolor:
                "#e5e7eb"
        },

        legend: {
            orientation: "v"
        },

        margin: {
            l: 70,
            r: 30,
            t: 80,
            b: 70
        }
    };

    Plotly.newPlot(
        "graph",
        traces,
        layout,
        {
            responsive: true
        }
    );
}