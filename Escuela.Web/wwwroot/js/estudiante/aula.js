let cursoIdGlobal = null;

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    cursoIdGlobal = params.get("cursoId");
    const nombreCurso = params.get("nombreCurso");
    const nombreDocente = params.get("docente");

    if (!cursoIdGlobal) {
        window.location.href = "/Estudiante/Cursos";
        return;
    }

    if (nombreCurso) document.getElementById("lblNombreCurso").innerText = decodeURIComponent(nombreCurso);
    if (nombreDocente) document.getElementById("lblNombreDocente").innerText = decodeURIComponent(nombreDocente);

    cargarTareas(cursoIdGlobal);
    cargarMateriales(cursoIdGlobal);

    const tabNotas = document.getElementById("notas-tab");
    if (tabNotas) {
        tabNotas.addEventListener("click", () => {
            cargarNotas(cursoIdGlobal);
        });
    }
});

async function cargarTareas(cursoId) {
    const container = document.getElementById("listaTareas");
    const token = localStorage.getItem("tokenEscuela");

    try {
        const response = await fetch(`${API_BASE_URL}/Tareas/Curso/${cursoId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const tareas = await response.json();

            if (tareas.length === 0) {
                container.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="fa-solid fa-clipboard-check display-4 text-secondary opacity-25 mb-3"></i>
                        <p class="text-muted fw-medium">Todo al día. No hay tareas pendientes.</p>
                    </div>`;
                return;
            }

            let html = "";
            tareas.forEach(t => {
                const esVencida = t.estaVencida;
                const badgeClass = esVencida
                    ? "bg-danger bg-opacity-10 text-danger"
                    : "bg-success bg-opacity-10 text-success";
                const badgeText = esVencida ? "Cerrada" : "Abierta";
                const tituloSafe = t.titulo.replace(/'/g, "\\'");

                html += `
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 border-0 shadow-sm curso-card">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between mb-3 align-items-center">
                                <span class="badge ${badgeClass} rounded-pill px-3">${badgeText}</span>
                                <small class="text-muted fw-bold" style="font-size: 0.75rem;">
                                    ${t.fechaLimite.replace('T', ' ')}
                                </small>
                            </div>
                            <h6 class="fw-bold text-dark mb-2">${t.titulo}</h6>
                            <p class="text-muted small mb-4 text-truncate-3" style="min-height: 40px;">
                                ${t.descripcion || "Sin descripción adicional."}
                            </p>
                            
                            <div class="mt-auto">
                                <button id="btn-accion-tarea-${t.id}" 
                                        class="btn btn-primary btn-sm w-100 rounded-pill py-2 shadow-none" 
                                        onclick="abrirModalEntrega(${t.id}, '${tituloSafe}')">
                                    <i class="fa-solid fa-cloud-arrow-up me-2 icon-btn"></i>
                                    <span class="texto-btn">Subir Tarea</span>
                                </button>

                                <div id="zona-link-historial-${t.id}" class="text-center mt-3" style="display: none;">
                                    <a href="javascript:void(0)" onclick="toggleHistorial(${t.id})" class="text-decoration-none small text-muted fw-bold">
                                        <i class="fa-solid fa-clock-rotate-left me-1"></i> Ver historial
                                    </a>
                                </div>
                                <div id="contenedor-historial-${t.id}" class="mt-3 border rounded-3 p-3 bg-light small" style="display: none;"></div>
                            </div>
                        </div>
                    </div>
                </div>`;
            });
            container.innerHTML = html;
            tareas.forEach(t => verificarEstadoEntrega(t.id));
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="text-danger text-center">No se pudieron cargar las tareas.</p>`;
    }
}

async function verificarEstadoEntrega(tareaId) {
    const btn = document.querySelector(`#btn-accion-tarea-${tareaId}`);
    if (!btn) return;
    const textoBtn = btn.querySelector(".texto-btn");
    const iconoBtn = btn.querySelector(".icon-btn");
    const zonaLink = document.getElementById(`zona-link-historial-${tareaId}`);

    try {
        const token = localStorage.getItem("tokenEscuela");
        const response = await fetch(`${API_BASE_URL}/Entregas/MisEntregas/${tareaId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
            const entregas = await response.json();
            if (entregas && entregas.length > 0) {
                btn.classList.remove("btn-primary");

                btn.style.backgroundColor = "transparent";
                btn.style.color = "var(--color-primary)";
                btn.style.border = "1px solid var(--color-primary)";

                if (textoBtn) textoBtn.innerText = "Reenviar";
                if (iconoBtn) iconoBtn.className = "fa-solid fa-rotate-right me-2 icon-btn";
                if (zonaLink) {
                    zonaLink.style.display = "block";
                    zonaLink.dataset.entregas = JSON.stringify(entregas);
                }
            }
        }
    } catch (error) { console.error(error); }
}

function toggleHistorial(tareaId) {
    const contenedor = document.getElementById(`contenedor-historial-${tareaId}`);
    const zonaLink = document.getElementById(`zona-link-historial-${tareaId}`);
    if (contenedor.style.display === "block") { contenedor.style.display = "none"; return; }
    contenedor.style.display = "block";

    const entregas = JSON.parse(zonaLink.dataset.entregas || "[]");
    const ultima = entregas[0];
    const nota = ultima.Calificacion || ultima.calificacion;
    const comentario = ultima.Comentarios || ultima.comentarios;
    const tieneNota = (nota !== null && nota !== undefined);

    let html = tieneNota
        ? `<div class="alert alert-success py-2 px-3 mb-2 small border-0 bg-success bg-opacity-10 text-success">
             <div class="fw-bold"><i class="fa-solid fa-check-circle me-2"></i>Calificación: ${nota}</div>
             ${comentario ? `<div class="mt-1 pt-1 border-top border-success border-opacity-25 fst-italic">"${comentario}"</div>` : ''}
           </div>`
        : `<div class="alert alert-secondary py-2 px-3 mb-2 small border-0 bg-secondary bg-opacity-10 text-secondary">
             <i class="fa-solid fa-hourglass-half me-2"></i><strong>En revisión</strong>
           </div>`;

    html += `<ul class="list-group list-group-flush border-top">`;
    entregas.forEach((e, i) => {
        const fecha = e.FechaEnvio || e.fechaEnvio;
        const url = e.UrlArchivo || e.urlArchivo;
        html += `<li class="list-group-item d-flex justify-content-between align-items-center bg-transparent px-0 py-2">
                    <div class="small"><i class="fa-regular fa-calendar me-1 text-muted"></i> ${fecha.replace('T', ' ')}</div>
                    <a href="${url}" target="_blank" class="text-primary"><i class="fa-solid fa-download"></i></a>
                 </li>`;
    });
    html += `</ul>`;
    contenedor.innerHTML = html;
}

function abrirModalEntrega(tareaId, titulo) {
    document.getElementById("formEntrega").reset();
    document.getElementById("mensajeError").style.display = "none";
    document.getElementById("progresoEntrega").style.display = "none";
    document.getElementById("hdnTareaId").value = tareaId;
    document.getElementById("lblTituloTarea").innerText = titulo;
    new bootstrap.Modal(document.getElementById('modalEntrega')).show();
}

async function enviarTarea() {
    const fileInput = document.getElementById("fileEntrega");
    if (fileInput.files.length === 0) return mostrarError("Seleccione un archivo.");

    document.getElementById("progresoEntrega").style.display = "flex";
    document.getElementById("mensajeError").style.display = "none";
    const btn = document.querySelector("#modalEntrega .btn-primary");
    const txtOrig = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = "Subiendo...";

    const formData = new FormData();
    formData.append("TareaId", document.getElementById("hdnTareaId").value);
    formData.append("Archivo", fileInput.files[0]);

    try {
        const token = localStorage.getItem("tokenEscuela");
        const res = await fetch(`${API_BASE_URL}/Entregas/Subir`, {
            method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formData
        });
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('modalEntrega')).hide();
            cargarTareas(cursoIdGlobal);
            alert("Tarea enviada correctamente.");
        } else {
            mostrarError(await res.text() || "Error al subir.");
        }
    } catch { mostrarError("Error de conexión."); }
    finally {
        document.getElementById("progresoEntrega").style.display = "none";
        btn.disabled = false; btn.innerHTML = txtOrig;
    }
}

function mostrarError(msg) {
    const div = document.getElementById("mensajeError");
    div.innerText = msg; div.style.display = "block";
}

async function cargarMateriales(cursoId) {
    const container = document.getElementById("listaMateriales");
    const token = localStorage.getItem("tokenEscuela");
    try {
        const response = await fetch(`${API_BASE_URL}/Recursos/Curso/${cursoId}`, { headers: { "Authorization": `Bearer ${token}` } });
        if (response.ok) {
            const recursos = await response.json();
            if (recursos.length === 0) {
                container.innerHTML = `<div class="text-center py-5"><i class="fa-regular fa-folder-open display-4 text-secondary opacity-25 mb-3"></i><p class="text-muted small">Carpeta vacía.</p></div>`;
                return;
            }
            let html = "";
            recursos.forEach(r => {
                let icon = "fa-file text-secondary";
                const url = (r.urlDescarga || r.UrlDescarga).toLowerCase();
                if (url.includes(".pdf")) icon = "fa-file-pdf text-danger";
                else if (url.includes(".doc")) icon = "fa-file-word text-primary";
                else if (url.includes(".ppt")) icon = "fa-file-powerpoint text-warning";
                else if (url.includes(".xls")) icon = "fa-file-excel text-success";

                html += `<div class="list-group-item px-4 py-3 border-0 border-bottom d-flex align-items-center hover-bg-light transition-hover">
                            <div class="me-3 fs-4"><i class="fa-regular ${icon}"></i></div>
                            <div class="flex-grow-1">
                                <h6 class="mb-0 fw-bold text-dark">${r.titulo || r.Titulo}</h6>
                                <small class="text-muted">${r.fecha || r.Fecha}</small>
                            </div>
                            <a href="${r.urlDescarga || r.UrlDescarga}" target="_blank" class="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold"><i class="fa-solid fa-download me-1"></i> Descargar</a>
                         </div>`;
            });
            container.innerHTML = html;
        }
    } catch { container.innerHTML = `<p class="text-danger text-center p-3">Error.</p>`; }
}

async function cargarNotas(cursoId) {
    const loading = document.getElementById("loadingNotas");
    const contenido = document.getElementById("contenidoBoleta");
    const container = document.getElementById("contenedorBoleta");
    const emptyState = document.getElementById("emptyStateNotas");

    loading.style.display = "block"; contenido.style.display = "none";
    const token = localStorage.getItem("tokenEscuela");

    try {
        const respNotas = await fetch(`${API_BASE_URL}/Notas/MisNotas/${cursoId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (respNotas.ok) {
            const data = await respNotas.json();

            if (!data.periodos || data.periodos.length === 0) {
                loading.style.display = "none"; contenido.style.display = "block";
                emptyState.classList.remove("d-none");
                return;
            }

            let htmlBimestres = "";
            let puntosPonderadosTotal = 0;
            let pesoTotalEvaluado = 0;
            let tieneAlgunaNota = false;

            data.periodos.forEach(periodo => {

                let filasHtml = "";
                let puntosBimestre = 0;
                let pesoBimestreEvaluado = 0;

                let bimestreHtml = `
                <div class="bimestre-section">
                    <div class="bimestre-title">
                        <span>${periodo.nombrePeriodo.toUpperCase()}</span>
                    </div>
                    <div class="grade-list">`;

                if (periodo.notas && periodo.notas.length > 0) {
                    periodo.notas.forEach(n => {
                        const tieneNota = n.valor !== null;
                        const val = tieneNota ? n.valor : 0;
                        const peso = n.peso;

                        if (tieneNota) {
                            tieneAlgunaNota = true;
                            puntosPonderadosTotal += (val * peso);
                            pesoTotalEvaluado += peso;

                            puntosBimestre += (val * peso);
                            pesoBimestreEvaluado += peso;
                        }

                        const scoreClass = !tieneNota ? "score-empty" : (val < 11 ? "score-bad" : "score-good");
                        const displayScore = tieneNota ? val.toFixed(1) : "-";

                        filasHtml += `
                        <div class="grade-item">
                            <div class="item-name">${n.evaluacion}</div>
                            <div class="d-flex align-items-center">
                                <span class="item-meta">${Math.round(peso * 100)}%</span>
                                <span class="item-score ${scoreClass}">${displayScore}</span>
                            </div>
                        </div>`;
                    });
                } else {
                    filasHtml = `<div class="text-muted small py-2 fst-italic">Sin evaluaciones programadas.</div>`;
                }

                let promBimestreDisplay = "-";
                if (pesoBimestreEvaluado > 0) {
                    const promBim = puntosBimestre / pesoBimestreEvaluado;
                    const colorProm = promBim < 11 ? "text-danger" : "text-dark";
                    promBimestreDisplay = `<span class="${colorProm}">${promBim.toFixed(1)}</span>`;
                }

                bimestreHtml += filasHtml + `
                    </div>
                    <div class="bimestre-footer">
                        <span>Promedio Parcial:</span>
                        <span class="bimestre-average">${promBimestreDisplay}</span>
                    </div>
                </div>`;

                htmlBimestres += bimestreHtml;
            });

            let promedioActual = 0;
            if (pesoTotalEvaluado > 0) {
                promedioActual = puntosPonderadosTotal / pesoTotalEvaluado;
            }

            const pesoTotalCursoTeorico = 4.0;
            const progresoPorcentaje = Math.min(100, Math.round((pesoTotalEvaluado / pesoTotalCursoTeorico) * 100));

            const displayPromedio = tieneAlgunaNota ? promedioActual.toFixed(1) : "-";

            let statusClass = "status-success";
            let statusText = "Aprobado";
            if (promedioActual < 11) { statusClass = "status-danger"; statusText = "En Riesgo"; }
            else if (promedioActual < 13) { statusClass = "status-warning"; statusText = "Regular"; }

            if (!tieneAlgunaNota) { statusClass = "bg-light text-muted border"; statusText = "Sin Notas"; }

            const summaryHtml = `
            <div class="boleta-wrapper">
                <div class="grade-summary-header">
                    <div>
                        <div class="grade-label">Promedio Ponderado Actual</div>
                        <div class="d-flex align-items-center">
                            <span class="grade-value ${promedioActual < 11 && tieneAlgunaNota ? 'text-danger' : 'text-dark'}">${displayPromedio}</span>
                            <span class="grade-status-badge ${statusClass}">${statusText}</span>
                        </div>
                        <div class="course-progress-container">
                            <div class="d-flex justify-content-between progress-label">
                                <span>Avance del curso</span>
                                <span>${progresoPorcentaje}% Evaluado</span>
                            </div>
                            <div class="mini-progress">
                                <div class="mini-progress-bar" style="width: ${progresoPorcentaje}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="text-end text-muted small" style="max-width: 150px; line-height: 1.2;">
                        <i class="fa-solid fa-circle-info me-1"></i>
                        Nota calculada sobre las evaluaciones registradas hasta hoy.
                    </div>
                </div>
                
                ${htmlBimestres}
            </div>`;

            if (!tieneAlgunaNota) {
                loading.style.display = "none"; contenido.style.display = "block";
                emptyState.classList.remove("d-none");
            } else {
                container.innerHTML = summaryHtml;
                loading.style.display = "none"; contenido.style.display = "block";
                emptyState.classList.add("d-none");
            }
        }
    } catch (e) {
        console.error(e);
        loading.innerHTML = `<p class="text-danger mt-3">Error al cargar notas.</p>`;
    }
}