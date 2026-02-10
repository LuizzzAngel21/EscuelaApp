document.addEventListener("DOMContentLoaded", () => {
    cargarHorario();
    cargarAsistenciaPorCurso();
});

/* Horario semanal */
async function cargarHorario() {
    const token = localStorage.getItem("tokenEscuela");
    const diasMap = {
        "Lunes": "col-Lunes",
        "Martes": "col-Martes",
        "Miercoles": "col-Miercoles",
        "Miércoles": "col-Miercoles",
        "Jueves": "col-Jueves",
        "Viernes": "col-Viernes"
    };

    try {
        const response = await fetch(`${API_BASE_URL}/Horarios`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const horarios = await response.json();

            Object.values(diasMap).forEach(id => {
                const col = document.getElementById(id);
                if (col) col.innerHTML = "";
            });

            if (horarios.length === 0) {
                const miercoles = document.getElementById("col-Miercoles");
                if (miercoles) miercoles.innerHTML = `<div class="text-center text-muted mt-4 small opacity-50">Sin horarios.</div>`;
                return;
            }

            horarios.forEach(h => {
                const colId = diasMap[h.dia];
                const contenedor = document.getElementById(colId);

                if (contenedor) {
                    const card = `
                        <div class="card border-0 shadow-sm mb-2 hover-card" style="background-color: #fcfcfc;">
                            <div class="card-body p-3 border-start border-4 border-primary rounded-end">
                                <h6 class="fw-bold text-dark mb-1" style="font-size: 0.85rem;">${h.curso}</h6>
                                <div class="text-muted small mb-2 d-flex align-items-center">
                                    <i class="fa-regular fa-clock me-1 text-primary"></i> ${h.horaInicio} - ${h.horaFin}
                                </div>
                                <div class="d-flex align-items-center pt-2 border-top border-light">
                                    <small class="text-secondary text-truncate">${h.docente || 'Sin asignar'}</small>
                                </div>
                            </div>
                        </div>`;
                    contenedor.innerHTML += card;
                }
            });
        }
    } catch (error) {
        console.error("Error horario:", error);
    }
}

/* Asistencias por curso */
async function cargarAsistenciaPorCurso() {
    const contenedor = document.getElementById("contenedorAsistencias");
    const token = localStorage.getItem("tokenEscuela");

    try {
        const respMat = await fetch(`${API_BASE_URL}/Matriculas/MiMatriculaActual`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!respMat.ok) {
            contenedor.innerHTML = `<div class="col-12 text-center text-muted py-4">No tienes matrícula activa.</div>`;
            return;
        }

        const matricula = await respMat.json();

        const respAsist = await fetch(`${API_BASE_URL}/Asistencias/Alumno/${matricula.id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (respAsist.ok) {
            const lista = await respAsist.json();

            if (lista.length === 0) {
                contenedor.innerHTML = `
                    <div class="col-12 text-center text-muted py-5">
                        <i class="fa-solid fa-clipboard-check display-4 mb-3 opacity-25"></i>
                        <p>Aún no hay registros.</p>
                    </div>`;
                return;
            }

            const resumen = {};

            lista.forEach(item => {
                const cursoNombre = item.curso || item.Curso || "Desconocido";
                const estado = (item.estado || item.Estado || "").toUpperCase();
                const obs = item.observacion || item.Observacion || "";
                const fecha = item.fecha || item.Fecha || "";

                if (!resumen[cursoNombre]) {
                    resumen[cursoNombre] = {
                        total: 0,
                        presentes: 0,
                        faltas: 0,
                        tardanzas: 0,
                        ultimaObservacion: "",
                        ultimaFechaObs: ""
                    };
                }

                resumen[cursoNombre].total++;

                if (estado === "ASISTIO" || estado === "PRESENTE" || estado === "1") {
                    resumen[cursoNombre].presentes++;
                } else if (estado === "TARDANZA") {
                    resumen[cursoNombre].presentes++;
                    resumen[cursoNombre].tardanzas++;
                } else {
                    resumen[cursoNombre].faltas++;
                }

                if (obs.trim() !== "") {
                    resumen[cursoNombre].ultimaObservacion = obs;
                    resumen[cursoNombre].ultimaFechaObs = fecha;
                }
            });

            let html = "";
            for (const [curso, stats] of Object.entries(resumen)) {
                const porcentaje = stats.total > 0
                    ? Math.round((stats.presentes / stats.total) * 100)
                    : 0;

                let color = "success";
                let texto = "Satisfactorio";
                let icono = "fa-check-circle";

                if (porcentaje < 70) {
                    color = "danger";
                    texto = "Crítico";
                    icono = "fa-circle-xmark";
                } else if (porcentaje < 85) {
                    color = "warning";
                    texto = "Regular";
                    icono = "fa-triangle-exclamation";
                }

                let htmlObs = "";
                if (stats.ultimaObservacion) {
                    htmlObs = `
                        <div class="mt-3 p-2 rounded bg-warning bg-opacity-10 border border-warning border-opacity-25">
                            <div class="d-flex gap-2">
                                <i class="fa-regular fa-comment-dots text-warning mt-1"></i>
                                <div>
                                    <span class="d-block text-uppercase fw-bold text-muted" style="font-size: 0.65rem;">
                                        Nota del ${stats.ultimaFechaObs}:
                                    </span>
                                    <span class="d-block fst-italic text-dark small">
                                        "${stats.ultimaObservacion}"
                                    </span>
                                </div>
                            </div>
                        </div>`;
                }

                html += `
                <div class="col-md-6 col-lg-4">
                    <div class="card border-0 shadow-sm h-100 hover-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h6 class="fw-bold text-dark mb-0 text-truncate" title="${curso}">${curso}</h6>
                                <span class="h4 fw-bold mb-0 text-${color}">${porcentaje}%</span>
                            </div>

                            <div class="progress mb-3" style="height: 6px;">
                                <div class="progress-bar bg-${color}" style="width: ${porcentaje}%"></div>
                            </div>

                            <div class="row text-center g-0 border rounded py-2 bg-light small mb-1">
                                <div class="col border-end">
                                    <span class="fw-bold d-block text-success">${stats.presentes}</span>
                                    <span class="text-muted" style="font-size:0.7rem">Asist.</span>
                                </div>
                                <div class="col border-end">
                                    <span class="fw-bold d-block text-danger">${stats.faltas}</span>
                                    <span class="text-muted" style="font-size:0.7rem">Faltas</span>
                                </div>
                                <div class="col">
                                    <span class="fw-bold d-block text-warning">${stats.tardanzas}</span>
                                    <span class="text-muted" style="font-size:0.7rem">Tard.</span>
                                </div>
                            </div>

                            ${htmlObs}
                        </div>

                        <div class="card-footer bg-white border-0 pt-0 text-center">
                            <small class="text-${color} fw-bold text-uppercase" style="font-size: 0.7rem;">
                                <i class="fa-solid ${icono} me-1"></i> ${texto}
                            </small>
                        </div>
                    </div>
                </div>`;
            }

            contenedor.innerHTML = html;
        }
    } catch (error) {
        console.error("Error procesando asistencias:", error);
        contenedor.innerHTML = `<div class="col-12 text-danger text-center">No se pudo cargar la información.</div>`;
    }
}
