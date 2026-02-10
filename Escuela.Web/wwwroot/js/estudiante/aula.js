document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const cursoId = params.get("cursoId");
    const nombreCurso = params.get("nombreCurso");
    const nombreDocente = params.get("docente");

    if (!cursoId) {
        window.location.href = "/Estudiante/Cursos";
        return;
    }

    if (nombreCurso) document.getElementById("lblNombreCurso").innerText = decodeURIComponent(nombreCurso);
    if (nombreDocente) document.getElementById("lblNombreDocente").innerText = decodeURIComponent(nombreDocente);

    cargarTareas(cursoId);
    cargarMateriales(cursoId);
    cargarNotas(cursoId);
});

/* Tareas */
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
                        <i class="fa-solid fa-clipboard-check display-1 text-light mb-3"></i>
                        <p class="text-muted">No hay tareas pendientes.</p>
                    </div>`;
                return;
            }

            let html = "";
            tareas.forEach(t => {
                const esVencida = t.estaVencida;
                const badgeColor = esVencida ? "bg-danger" : "bg-success";
                const badgeTexto = esVencida ? "Vencida" : "Disponible";

                html += `
                <div class="col-md-6">
                    <div class="card h-100 border-0 shadow-sm tarea-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between mb-2">
                                <span class="badge ${badgeColor} bg-opacity-10 text-${esVencida ? 'danger' : 'success'} border border-${esVencida ? 'danger' : 'success'} border-opacity-25">
                                    ${badgeTexto}
                                </span>
                                <small class="text-muted"><i class="fa-regular fa-clock me-1"></i> ${t.fechaLimite}</small>
                            </div>
                            <h5 class="fw-bold text-dark">${t.titulo}</h5>
                            <p class="text-muted small mb-3 text-truncate">${t.descripcion}</p>
                            
                            <div class="mt-3">
                                <button id="btn-accion-tarea-${t.id}" 
                                        class="btn btn-primary btn-sm w-100 rounded-pill" 
                                        onclick="abrirModalEntrega(${t.id}, '${t.titulo}')">
                                    <span class="spinner-border spinner-border-sm d-none" role="status"></span>
                                    <i class="fa-solid fa-upload me-2 icon-btn"></i>
                                    <span class="texto-btn">Subir Tarea</span>
                                </button>

                                <div id="zona-link-historial-${t.id}" class="text-center mt-2" style="display: none;">
                                    <a href="javascript:void(0)" onclick="toggleHistorial(${t.id})" class="text-decoration-none small text-muted">
                                        <i class="fa-solid fa-clock-rotate-left me-1"></i> Ver mis entregas anteriores
                                    </a>
                                </div>

                                <div id="contenedor-historial-${t.id}" class="mt-2 border rounded p-2 bg-light small" style="display: none;"></div>
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
        container.innerHTML = `<p class="text-danger text-center">Error cargando tareas.</p>`;
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
                btn.classList.add("btn-outline-primary");
                if (textoBtn) textoBtn.innerText = "Subir de nuevo";
                if (iconoBtn) iconoBtn.className = "fa-solid fa-rotate-right me-2 icon-btn";

                if (zonaLink) {
                    zonaLink.style.display = "block";
                    zonaLink.dataset.entregas = JSON.stringify(entregas);
                }
            }
        }
    } catch (error) {
        console.error("Error verificando estado:", error);
    }
}

function toggleHistorial(tareaId) {
    const contenedor = document.getElementById(`contenedor-historial-${tareaId}`);
    const zonaLink = document.getElementById(`zona-link-historial-${tareaId}`);

    if (contenedor.style.display === "block") {
        contenedor.style.display = "none";
        return;
    }

    contenedor.style.display = "block";
    const entregas = JSON.parse(zonaLink.dataset.entregas || "[]");

    const ultimaEntrega = entregas[0];
    const tieneNota = ultimaEntrega.Calificacion != null || ultimaEntrega.calificacion != null;
    const nota = ultimaEntrega.Calificacion || ultimaEntrega.calificacion;
    const comentario = ultimaEntrega.Comentarios || ultimaEntrega.comentarios;

    let htmlEstado = tieneNota
        ? `
            <div class="alert alert-success py-2 px-3 mb-2 small">
                <div class="fw-bold"><i class="fa-solid fa-check-circle me-2"></i>Calificación: ${nota}</div>
                ${comentario ? `<div class="mt-1 fst-italic border-top border-success pt-1"><i class="fa-solid fa-comment-dots me-1"></i>"${comentario}"</div>` : ''}
            </div>`
        : `
            <div class="alert alert-secondary py-2 px-3 mb-2 small">
                <i class="fa-solid fa-hourglass-half me-2"></i>Estado: <strong>Esperando revisión</strong>
                <div class="text-muted fst-italic mt-1" style="font-size: 0.85em;">(Se calificará tu envío más reciente)</div>
            </div>`;

    let htmlLista = `<ul class="list-group list-group-flush border-top">`;
    entregas.forEach((entrega, index) => {
        const fecha = entrega.FechaEnvio || entrega.fechaEnvio;
        const url = entrega.UrlArchivo || entrega.urlArchivo;
        const etiqueta = index === 0
            ? '<span class="badge bg-primary bg-opacity-10 text-primary ms-2">Más reciente</span>'
            : '<span class="text-muted small ms-2">(Histórico)</span>';

        htmlLista += `
            <li class="list-group-item d-flex justify-content-between align-items-center bg-transparent px-0 py-2">
                <div class="small">
                    <i class="fa-regular fa-calendar me-1 text-muted"></i> ${fecha}
                    ${etiqueta}
                </div>
                <a href="${url}" target="_blank" class="btn btn-sm btn-light border">
                    <i class="fa-solid fa-download text-primary"></i>
                </a>
            </li>`;
    });
    htmlLista += `</ul>`;

    contenedor.innerHTML = htmlEstado + htmlLista;
}

/* Modulo de Entregas */
function abrirModalEntrega(tareaId, titulo) {
    document.getElementById("formEntrega").reset();
    document.getElementById("mensajeError").style.display = "none";
    document.getElementById("progresoEntrega").style.display = "none";
    document.getElementById("hdnTareaId").value = tareaId;
    document.getElementById("lblTituloTarea").innerText = titulo;

    const myModal = new bootstrap.Modal(document.getElementById('modalEntrega'));
    myModal.show();
}

async function enviarTarea() {
    const tareaId = document.getElementById("hdnTareaId").value;
    const fileInput = document.getElementById("fileEntrega");
    const barra = document.getElementById("progresoEntrega");
    const errorDiv = document.getElementById("mensajeError");
    const token = localStorage.getItem("tokenEscuela");

    if (fileInput.files.length === 0) return mostrarError("Debes seleccionar un archivo.");
    const archivo = fileInput.files[0];
    if (archivo.size > 5 * 1024 * 1024) return mostrarError("El archivo es muy pesado (Máx 5MB).");

    const formData = new FormData();
    formData.append("TareaId", tareaId);
    formData.append("Archivo", archivo);

    barra.style.display = "flex";
    errorDiv.style.display = "none";

    try {
        const response = await fetch(`${API_BASE_URL}/Entregas/Subir`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            alert("¡Tarea entregada correctamente! 🎉");
            bootstrap.Modal.getInstance(document.getElementById('modalEntrega')).hide();
            verificarEstadoEntrega(tareaId);
        } else {
            mostrarError(await response.text());
        }
    } catch {
        mostrarError("Error de conexión. Intenta de nuevo.");
    } finally {
        barra.style.display = "none";
    }
}

function mostrarError(mensaje) {
    const errorDiv = document.getElementById("mensajeError");
    errorDiv.innerText = mensaje;
    errorDiv.style.display = "block";
}

/* Modulo de Materiales */
async function cargarMateriales(cursoId) {
    const container = document.getElementById("listaMateriales");
    const token = localStorage.getItem("tokenEscuela");

    try {
        const response = await fetch(`${API_BASE_URL}/Recursos/Curso/${cursoId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const recursos = await response.json();

            if (recursos.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fa-regular fa-folder-open display-4 text-light mb-3"></i>
                        <p class="text-muted">El docente aún no ha subido materiales.</p>
                    </div>`;
                return;
            }

            let html = "";
            recursos.forEach(r => {
                html += `
                <div class="list-group-item px-4 py-3 border-0 border-bottom d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0 fw-bold">${r.titulo || r.Titulo}</h6>
                        <small class="text-muted">${r.fecha || r.Fecha}</small>
                    </div>
                    <a href="${r.urlDescarga || r.UrlDescarga}" target="_blank" class="btn btn-outline-primary btn-sm">
                        Descargar
                    </a>
                </div>`;
            });
            container.innerHTML = html;
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="text-danger text-center">Error cargando materiales.</p>`;
    }
}

/*Modulo de Notas */
async function cargarNotas(cursoId) {
    const container = document.getElementById("contenedorNotas");
    const token = localStorage.getItem("tokenEscuela");

    try {
        const respMatricula = await fetch(`${API_BASE_URL}/Matriculas/MiMatriculaActual`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!respMatricula.ok) {
            container.innerHTML = `<p class="text-danger text-center">No tienes matrícula activa.</p>`;
            return;
        }

        const dataMatricula = await respMatricula.json();
        const respNotas = await fetch(`${API_BASE_URL}/Notas/Promedio?matriculaId=${dataMatricula.id}&cursoId=${cursoId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (respNotas.ok) {
            const data = await respNotas.json();

            if (data.estado === "SIN CONFIGURAR") {
                container.innerHTML = `<p class="text-muted text-center">Sin criterios configurados.</p>`;
                return;
            }

            let filas = "";
            data.detalles.forEach(d => {
                filas += `
                <tr>
                    <td>${d.evaluacion}</td>
                    <td class="text-center">${(d.peso * 100).toFixed(0)}%</td>
                    <td class="text-center">${d.notaObtenida.toFixed(2)}</td>
                </tr>`;
            });

            container.innerHTML = `
                <h1 class="text-center">${data.promedioFinal.toFixed(2)}</h1>
                <table class="table">
                    <tbody>${filas}</tbody>
                </table>`;
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="text-danger text-center">Error al cargar notas.</p>`;
    }
}
