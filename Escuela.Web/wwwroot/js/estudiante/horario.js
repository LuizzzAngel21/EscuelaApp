let cacheAsistencias = {};

document.addEventListener("DOMContentLoaded", () => {
    cargarHorarioNormalizado();
    cargarAsistenciaCompleta();
});

async function cargarHorarioNormalizado() {
    const tbody = document.getElementById("tablaHorarioBody");
    const token = localStorage.getItem("tokenEscuela");

    try {
        const response = await fetch(`${API_BASE_URL}/Horarios`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            let horarios = await response.json();

            if (horarios.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-muted fst-italic">No hay horarios registrados.</td></tr>`;
                return;
            }

            const horasUnicas = [...new Set(horarios.map(h => h.horaInicio))].sort((a, b) => {
                return parseInt(a.replace(":", "")) - parseInt(b.replace(":", ""));
            });

            const diasMap = { "Lunes": 1, "Martes": 2, "Miercoles": 3, "Miércoles": 3, "Jueves": 4, "Viernes": 5 };
            let htmlFilas = "";

            horasUnicas.forEach(hora => {
                let celdas = ["", "", "", "", "", ""];
                const clasesHora = horarios.filter(h => h.horaInicio === hora);

                clasesHora.forEach(clase => {
                    const idx = diasMap[clase.dia];
                    if (idx) {
                        celdas[idx] = `
                            <div class="clase-card">
                                <div class="clase-nombre">${clase.curso}</div>
                                <span class="clase-info text-primary mb-1" style="font-weight:600;">${clase.horaInicio} - ${clase.horaFin}</span>
                                <span class="clase-info"><i class="fa-solid fa-user-tie me-1"></i>${clase.docente || 'Docente'}</span>
                            </div>`;
                    }
                });

                htmlFilas += `<tr>
                                <td class="col-hora">${hora}</td>
                                <td>${celdas[1]}</td><td>${celdas[2]}</td><td>${celdas[3]}</td><td>${celdas[4]}</td><td>${celdas[5]}</td>
                              </tr>`;
            });
            tbody.innerHTML = htmlFilas;
        }
    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Error al cargar horario.</td></tr>`;
    }
}

async function cargarAsistenciaCompleta() {
    const contenedor = document.getElementById("contenedorAsistencias");
    const token = localStorage.getItem("tokenEscuela");

    try {
        const respMat = await fetch(`${API_BASE_URL}/Matriculas/MiMatriculaActual`, { headers: { "Authorization": `Bearer ${token}` } });
        if (!respMat.ok) { contenedor.innerHTML = `<div class="col-12 text-center text-muted py-5">Sin matrícula activa.</div>`; return; }
        const matricula = await respMat.json();

        const respHorario = await fetch(`${API_BASE_URL}/Horarios`, { headers: { "Authorization": `Bearer ${token}` } });
        let aprovechamientoHorario = [];
        let cursosNombres = [];
        if (respHorario.ok) {
            const dataHorario = await respHorario.json();
            cursosNombres = [...new Set(dataHorario.map(h => h.curso))].sort();
        }

        const respAsist = await fetch(`${API_BASE_URL}/Asistencias/Alumno/${matricula.id}`, { headers: { "Authorization": `Bearer ${token}` } });
        let listaAsistencias = [];
        if (respAsist.ok) listaAsistencias = await respAsist.json();

        cacheAsistencias = {};

        cursosNombres.forEach(nombre => {
            cacheAsistencias[nombre] = { presentes: 0, tardanzas: 0, faltas: 0, total: 0, historial: [] };
        });

        listaAsistencias.forEach(item => {
            const curso = item.curso || item.Curso || "Otros";
            const estado = (item.estado || item.Estado || "").toUpperCase();
            const fecha = item.fecha || item.Fecha;
            const obs = item.observacion || item.Observacion;

            if (!cacheAsistencias[curso]) cacheAsistencias[curso] = { presentes: 0, tardanzas: 0, faltas: 0, total: 0, historial: [] };

            cacheAsistencias[curso].total++;
            cacheAsistencias[curso].historial.push({ fecha, estado, obs });

            if (["ASISTIO", "PRESENTE", "0"].includes(estado)) cacheAsistencias[curso].presentes++;
            else if (["TARDANZA", "1"].includes(estado)) { cacheAsistencias[curso].presentes++; cacheAsistencias[curso].tardanzas++; }
            else if (["FALTA", "FALTO", "2"].includes(estado)) cacheAsistencias[curso].faltas++;
        });

        const cursosFinales = Object.keys(cacheAsistencias);
        if (cursosFinales.length === 0) {
            contenedor.innerHTML = `<div class="col-12 text-center py-5"><p class="text-muted">No se encontraron cursos.</p></div>`;
            return;
        }

        let html = "";
        cursosFinales.forEach(nombre => {
            const data = cacheAsistencias[nombre];

            let riskClass = "risk-low";
            let statusHtml = `<span class="text-success"><i class="dot dot-green me-2"></i>Estado Regular</span>`;

            if (data.faltas >= 7) {
                riskClass = "risk-high";
                statusHtml = `<span class="text-danger"><i class="dot dot-red me-2"></i>Riesgo Académico</span>`;
            } else if (data.faltas >= 4) {
                riskClass = "risk-med";
                statusHtml = `<span class="text-warning" style="color:#d97706 !important;"><i class="dot dot-yellow me-2"></i>Acumulación de Faltas</span>`;
            }

            const nombreSafe = nombre.replace(/'/g, "\\'");

            html += `
            <div class="col-md-6 col-lg-4 col-xl-3">
                <div class="asistencia-card-clean ${riskClass}" onclick="abrirDetalleCurso('${nombreSafe}')">
                    <div class="d-flex justify-content-between align-items-start mb-4">
                        <h6 class="fw-bold text-dark mb-0 text-truncate" style="max-width: 85%;" title="${nombre}">${nombre}</h6>
                        <i class="fa-solid fa-chevron-right text-muted small opacity-50"></i>
                    </div>

                    <div class="kpi-grid">
                        <div class="kpi-item">
                            <span class="kpi-value" style="color: #10b981;">${data.presentes}</span>
                            <span class="kpi-label">Asistencias</span>
                        </div>
                        <div class="kpi-item">
                            <span class="kpi-value" style="color: #f59e0b;">${data.tardanzas}</span>
                            <span class="kpi-label">Tardanzas</span>
                        </div>
                        <div class="kpi-item">
                            <span class="kpi-value" style="color: #ef4444;">${data.faltas}</span>
                            <span class="kpi-label">Faltas</span>
                        </div>
                    </div>

                    <div class="status-indicator">
                        ${statusHtml}
                    </div>
                </div>
            </div>`;
        });

        contenedor.innerHTML = html;

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = `<div class="col-12 text-center text-danger">Error de conexión.</div>`;
    }
}

function abrirDetalleCurso(nombreCurso) {
    const data = cacheAsistencias[nombreCurso];
    if (!data) return;

    document.getElementById("lblModalCurso").innerText = nombreCurso;
    const timeline = document.getElementById("timelineContenido");

    const historialOrdenado = data.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    if (historialOrdenado.length === 0) {
        timeline.innerHTML = `<div class="text-center text-muted py-4"><i>No hay historial registrado.</i></div>`;
    } else {
        let htmlTime = `<div class="modal-timeline-container">`;

        historialOrdenado.forEach(h => {
            let markerClass = "marker-present";
            let statusText = "Asistencia";
            let statusColor = "text-dark";

            if (["FALTA", "FALTO", "2"].includes(h.estado)) {
                markerClass = "marker-absent"; statusText = "Inasistencia"; statusColor = "text-danger";
            } else if (["TARDANZA", "1"].includes(h.estado)) {
                markerClass = "marker-late"; statusText = "Tardanza"; statusColor = "text-warning";
            } else if (["JUSTIFICADO", "3"].includes(h.estado)) {
                markerClass = "marker-justified"; statusText = "Justificado"; statusColor = "text-primary";
            }

            const obsHtml = h.obs ? `<div class="event-obs"><i class="fa-regular fa-comment-dots me-1"></i>${h.obs}</div>` : "";

            htmlTime += `
            <div class="timeline-event">
                <div class="timeline-marker ${markerClass}"></div>
                <div class="event-date">${h.fecha.split('T')[0]}</div>
                <div class="event-status fw-bold ${statusColor}">${statusText}</div>
                ${obsHtml}
            </div>`;
        });

        htmlTime += `</div>`;
        timeline.innerHTML = htmlTime;
    }

    new bootstrap.Modal(document.getElementById('modalDetalleAsistencia')).show();
}