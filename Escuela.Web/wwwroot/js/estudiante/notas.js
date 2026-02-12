document.addEventListener("DOMContentLoaded", () => {
    generarLibreta();
});

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

function obtenerNombreDelToken() {
    const token = localStorage.getItem("tokenEscuela");
    if (!token) return "ESTUDIANTE";

    const payload = parseJwt(token);
    if (!payload) return "ESTUDIANTE";

    let rawName = payload.unique_name || payload.given_name || payload.sub || "";

    if (rawName.includes("@")) {
        rawName = rawName.split('@')[0];
        rawName = rawName.replace(/\./g, ' ').replace(/_/g, ' ');
        rawName = rawName.replace(/[0-9]/g, '');
    }

    return rawName.toUpperCase().trim();
}

async function generarLibreta() {
    const tbody = document.getElementById("cuerpoLibreta");
    const token = localStorage.getItem("tokenEscuela");

    try {
        const respCursos = await fetch(`${API_BASE_URL}/Notas/BoletaGlobal`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!respCursos.ok) throw new Error("Error al obtener cursos");
        const listaCursos = await respCursos.json();

        if (listaCursos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-muted">No hay cursos matriculados.</td></tr>`;
            return;
        }

        tbody.innerHTML = "";

        const promesasDetalle = listaCursos.map(async (cursoBase) => {
            try {
                const id = cursoBase.cursoId || cursoBase.id;
                const respDetalle = await fetch(`${API_BASE_URL}/Notas/MisNotas/${id}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const detalle = await respDetalle.json();
                return {
                    nombre: cursoBase.curso,
                    docente: cursoBase.docente,
                    periodos: detalle.periodos || []
                };
            } catch (e) {
                return { nombre: cursoBase.curso, docente: "Error", periodos: [] };
            }
        });

        const datosCompletos = await Promise.all(promesasDetalle);
        let htmlFilas = "";

        datosCompletos.forEach(curso => {
            const notasMap = {};
            let sumaPromedios = 0;
            let cantidadNotas = 0;

            curso.periodos.forEach(p => {
                if (p.promedioPeriodo > 0) {
                    notasMap[p.numeroPeriodo] = p.promedioPeriodo;
                    sumaPromedios += p.promedioPeriodo;
                    cantidadNotas++;
                }
            });

            const promedioFinal = cantidadNotas > 0 ? (sumaPromedios / cantidadNotas) : 0;
            const tieneNota = cantidadNotas > 0;

            let celdasBimestres = "";
            for (let i = 1; i <= 4; i++) {
                const nota = notasMap[i];
                let celdaHtml = `<span class="text-muted opacity-25 fw-light">--</span>`;
                if (nota !== undefined) {
                    const color = nota < 11 ? "text-danger" : "text-dark";
                    celdaHtml = `<span class="fw-bold ${color}">${nota.toFixed(0)}</span>`;
                }
                celdasBimestres += `<td class="text-center py-3">${celdaHtml}</td>`;
            }

            let badgeEstado = `<span class="badge bg-light text-muted border fw-normal">Pendiente</span>`;
            if (tieneNota) {
                if (promedioFinal >= 11) {
                    badgeEstado = `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill">Aprobado</span>`;
                } else {
                    badgeEstado = `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill">En Riesgo</span>`;
                }
            }

            htmlFilas += `
            <tr>
                <td class="ps-4 py-3">
                    <div class="fw-bold text-dark">${curso.nombre}</div>
                    <div class="small text-muted d-print-none">${curso.docente || "Sin asignar"}</div>
                </td>
                ${celdasBimestres}
                <td class="text-center py-3 bg-light border-start border-end fw-bold text-dark">
                    ${tieneNota ? promedioFinal.toFixed(2) : "--"}
                </td>
                <td class="text-end pe-4 py-3">
                    ${badgeEstado}
                </td>
            </tr>`;
        });

        tbody.innerHTML = htmlFilas;

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">No se pudo generar la libreta.</td></tr>`;
    }
}

function imprimirLibreta() {
    const nombreLimpio = obtenerNombreDelToken();

    const lblEstudiante = document.getElementById("printEstudiante");
    const lblFecha = document.getElementById("printFecha");

    if (lblEstudiante) lblEstudiante.innerText = nombreLimpio;
    if (lblFecha) lblFecha.innerText = new Date().toLocaleDateString();

    window.print();
}