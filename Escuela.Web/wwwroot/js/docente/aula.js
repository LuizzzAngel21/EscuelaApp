let cursoIdGlobal = null;

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    cursoIdGlobal = urlParams.get('cursoId') || document.getElementById("hdnCursoId").value;

    if (!cursoIdGlobal) {
        alert("Error: No se especificó un curso.");
        window.location.href = "/Docente/Cursos";
        return;
    }

    cargarInfoCurso();
    cargarMateriales();

    document.getElementById("tab-materiales").addEventListener("click", cargarMateriales);
    document.getElementById("tab-tareas").addEventListener("click", cargarTareas);
    document.getElementById("tab-criterios").addEventListener("click", cargarCriterios);

    document.getElementById("formSubirMaterial").addEventListener("submit", subirMaterial);
    document.getElementById("formCrearTarea").addEventListener("submit", crearTarea);
    document.getElementById("formCriterio").addEventListener("submit", crearCriterio);
});

async function cargarInfoCurso() {
    const token = localStorage.getItem("tokenEscuela");
    try {
        const res = await fetch(`${API_BASE_URL}/Cursos`, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
            const cursos = await res.json();
            const curso = cursos.find(c => c.id == cursoIdGlobal);
            if (curso) {
                document.getElementById("lblNombreCurso").innerText = curso.nombre;
                document.getElementById("lblGradoCurso").innerText = curso.nombreGrado;
            }
        }
    } catch (e) { console.error("Error cargando info del curso", e); }
}

async function cargarMateriales() {
    const contenedor = document.getElementById("lista-materiales");
    contenedor.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>';
    const token = localStorage.getItem("tokenEscuela");

    try {
        const res = await fetch(`${API_BASE_URL}/Recursos/Curso/${cursoIdGlobal}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const materiales = await res.json();

        if (materiales.length === 0) {
            contenedor.innerHTML = `
                <div class="col-12 text-center text-muted py-5">
                    <i class="fa-regular fa-folder-open fa-3x mb-3 text-secondary bg-light p-3 rounded-circle"></i>
                    <p class="mb-0">No hay materiales compartidos en este curso.</p>
                </div>`;
            return;
        }

        let html = "";
        materiales.forEach(m => {
            let iconClass = "fa-file text-secondary";
            if (m.urlDescarga.includes(".pdf")) iconClass = "fa-file-pdf text-danger";
            else if (m.urlDescarga.includes(".doc")) iconClass = "fa-file-word text-primary";
            else if (m.urlDescarga.includes(".ppt")) iconClass = "fa-file-powerpoint text-warning";
            else if (m.urlDescarga.includes(".xls")) iconClass = "fa-file-excel text-success";

            html += `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 border-0 shadow-sm hover-card transition-hover">
                    <div class="card-body d-flex align-items-center p-3">
                        <div class="me-3">
                            <i class="fa-regular ${iconClass} fa-2x"></i>
                        </div>
                        <div class="flex-grow-1 overflow-hidden">
                            <h6 class="text-truncate mb-1 fw-bold text-dark" title="${m.titulo}">${m.titulo}</h6>
                            <small class="text-muted d-block" style="font-size: 0.75rem;">${m.fecha}</small>
                        </div>
                        <div class="dropdown ms-2">
                            <button class="btn btn-light btn-sm rounded-circle" data-bs-toggle="dropdown">
                                <i class="fa-solid fa-ellipsis-vertical text-muted"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end border-0 shadow">
                                <li><a class="dropdown-item small" href="${m.urlDescarga}" target="_blank"><i class="fa-solid fa-download me-2 text-primary"></i>Descargar</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><button class="dropdown-item small text-danger" onclick="eliminarMaterial(${m.id})"><i class="fa-solid fa-trash me-2"></i>Eliminar</button></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>`;
        });
        contenedor.innerHTML = html;
    } catch (e) {
        console.error(e);
        contenedor.innerHTML = '<div class="col-12 text-center text-danger py-4">Error al cargar materiales.</div>';
    }
}

async function subirMaterial(e) {
    e.preventDefault();
    const token = localStorage.getItem("tokenEscuela");

    const formData = new FormData();
    const fileInput = document.getElementById("fileMaterial");

    if (fileInput.files.length === 0) {
        alert("Seleccione un archivo.");
        return;
    }

    formData.append("titulo", document.getElementById("txtTituloMaterial").value);
    formData.append("cursoId", cursoIdGlobal);
    formData.append("archivo", fileInput.files[0]);

    const btn = e.target.querySelector("button[type=submit]");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo...';

    try {
        const res = await fetch(`${API_BASE_URL}/Recursos/Subir`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('modalSubirMaterial')).hide();
            document.getElementById("formSubirMaterial").reset();
            cargarMateriales();
            alert("Material subido correctamente.");
        } else {
            alert("Error al subir archivo.");
        }
    } catch (e) {
        alert("Error de conexión.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function eliminarMaterial(id) {
    if (!confirm("¿Está seguro de eliminar este archivo permanentemente?")) return;

    const token = localStorage.getItem("tokenEscuela");
    try {
        await fetch(`${API_BASE_URL}/Recursos/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        cargarMateriales();
    } catch (e) { alert("Error al eliminar."); }
}

async function cargarTareas() {
    const contenedor = document.getElementById("lista-tareas");
    contenedor.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    const token = localStorage.getItem("tokenEscuela");

    try {
        const res = await fetch(`${API_BASE_URL}/Tareas/Curso/${cursoIdGlobal}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const tareas = await res.json();

        if (tareas.length === 0) {
            contenedor.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fa-solid fa-clipboard-check fa-3x mb-3 text-light"></i>
                    <p>No hay tareas asignadas actualmente.</p>
                </div>`;
            return;
        }

        let html = "";
        tareas.forEach(t => {
            const estadoBadge = t.estaVencida
                ? '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger">Vencida</span>'
                : '<span class="badge bg-success bg-opacity-10 text-success border border-success">Activa</span>';

            html += `
            <div class="list-group-item p-3 border-bottom hover-bg-light">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <h6 class="mb-0 fw-bold text-dark">${t.titulo}</h6>
                            ${estadoBadge}
                        </div>
                        <p class="text-muted small mb-2 text-truncate" style="max-width: 500px;">${t.descripcion}</p>
                        <small class="text-secondary fw-bold" style="font-size: 0.75rem;">
                            <i class="fa-regular fa-calendar me-1"></i>Vence: ${t.fechaLimite.replace('T', ' ')}
                        </small>
                    </div>
                    <div class="d-flex gap-2">
                        <button onclick="verEntregas(${t.id})" class="btn btn-outline-primary btn-sm rounded-pill px-3 shadow-sm">
                            <i class="fa-solid fa-users-viewfinder me-1"></i>Entregas
                        </button>
                        <button onclick="eliminarTarea(${t.id})" class="btn btn-light text-danger btn-sm rounded-circle border shadow-sm" title="Eliminar Tarea">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>`;
        });
        contenedor.innerHTML = html;
    } catch (e) {
        console.error(e);
        contenedor.innerHTML = '<p class="text-danger text-center">Error al cargar tareas.</p>';
    }
}

async function crearTarea(e) {
    e.preventDefault();
    const token = localStorage.getItem("tokenEscuela");

    const tarea = {
        cursoId: parseInt(cursoIdGlobal),
        titulo: document.getElementById("txtTituloTarea").value,
        descripcion: document.getElementById("txtDescTarea").value,
        fechaLimite: document.getElementById("txtFechaTarea").value
    };

    try {
        const res = await fetch(`${API_BASE_URL}/Tareas`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(tarea)
        });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('modalCrearTarea')).hide();
            document.getElementById("formCrearTarea").reset();
            cargarTareas();
            alert("Tarea creada exitosamente.");
        } else { alert("Error al crear tarea."); }
    } catch (e) { alert("Error de conexión."); }
}

async function eliminarTarea(id) {
    if (!confirm("ADVERTENCIA: Se eliminará la tarea y TODAS las entregas de los alumnos. ¿Continuar?")) return;
    const token = localStorage.getItem("tokenEscuela");

    try {
        await fetch(`${API_BASE_URL}/Tareas/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
        cargarTareas();
    } catch (e) { alert("Error al eliminar."); }
}

async function verEntregas(tareaId) {
    new bootstrap.Modal(document.getElementById('modalEntregas')).show();
    const tbody = document.getElementById("tabla-entregas");
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4"><div class="spinner-border text-primary"></div></td></tr>';

    const token = localStorage.getItem("tokenEscuela");
    try {
        const res = await fetch(`${API_BASE_URL}/Entregas/Tarea/${tareaId}`, { headers: { "Authorization": `Bearer ${token}` } });
        const entregas = await res.json();

        if (entregas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4 small">Ningún alumno ha enviado esta tarea aún.</td></tr>';
            return;
        }

        let html = "";
        entregas.forEach(e => {
            const val = e.calificacion > 0 ? e.calificacion : "";

            html += `
            <tr>
                <td class="ps-4 fw-bold text-dark">${e.estudianteNombre}</td>
                <td class="small text-muted">${e.fechaEnvio.replace('T', ' ')}</td>
                <td>
                    <a href="${e.urlArchivo}" target="_blank" class="btn btn-sm btn-white border shadow-sm text-primary">
                        <i class="fa-solid fa-download me-1"></i>Ver
                    </a>
                </td>
                <td>
                    <input type="number" id="nota-${e.id}" class="form-control form-control-sm text-center fw-bold" 
                           min="0" max="20" placeholder="-" value="${val}">
                </td>
                <td>
                    <button onclick="guardarNotaEntrega(${e.id})" class="btn btn-sm btn-success shadow-sm" title="Guardar Nota">
                        <i class="fa-solid fa-check"></i>
                    </button>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar entregas.</td></tr>';
    }
}

async function guardarNotaEntrega(id) {
    const input = document.getElementById(`nota-${id}`);
    const nota = parseFloat(input.value);

    if (isNaN(nota) || nota < 0 || nota > 20) {
        alert("Nota inválida (0-20)");
        return;
    }

    const token = localStorage.getItem("tokenEscuela");
    try {
        const res = await fetch(`${API_BASE_URL}/Entregas/Calificar/${id}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ nota: nota, comentarios: "Calificado" })
        });

        if (res.ok) {
            input.classList.add("border-success", "bg-success", "bg-opacity-10");
            setTimeout(() => input.classList.remove("border-success", "bg-success", "bg-opacity-10"), 1500);
        } else {
            alert("Error al guardar nota.");
        }
    } catch (e) { alert("Error de conexión."); }
}

async function calcularPromediosTareas() {
    new bootstrap.Modal(document.getElementById('modalPromedios')).show();
    const tbody = document.getElementById("tabla-promedios");
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4"><div class="spinner-border text-success"></div><p class="mt-2 small">Calculando...</p></td></tr>';

    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Funcionalidad de reporte en mantenimiento (usa la Sábana de Notas para promedios oficiales).</td></tr>';
}

async function cargarCriterios() {
    const token = localStorage.getItem("tokenEscuela");

    for (let i = 1; i <= 4; i++) {
        const panel = document.getElementById(`panel-b${i}`);
        if (panel) panel.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary spinner-border-sm"></div></div>';
    }

    try {
        const res = await fetch(`${API_BASE_URL}/Criterios/Curso/${cursoIdGlobal}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Error API");
        const todosLosCriterios = await res.json();

        for (let i = 1; i <= 4; i++) {
            const criteriosBimestre = todosLosCriterios.filter(c => c.numeroPeriodo === i);
            renderizarTablaPeriodo(i, criteriosBimestre);
        }

    } catch (e) {
        console.error(e);
        alert("Error al cargar la configuración de evaluación.");
    }
}

function renderizarTablaPeriodo(numeroPeriodo, lista) {
    const contenedor = document.getElementById(`panel-b${numeroPeriodo}`);
    if (!contenedor) return;

    let pesoTotal = 0;
    lista.forEach(c => pesoTotal += c.peso);

    const esCorrecto = Math.abs(pesoTotal - 1.0) < 0.001;
    const colorClass = esCorrecto ? "text-success" : "text-danger";
    const badgeEstado = esCorrecto
        ? '<span class="badge bg-success bg-opacity-10 text-success border border-success px-3"><i class="fa-solid fa-check me-2"></i>Correcto (100%)</span>'
        : '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger px-3"><i class="fa-solid fa-triangle-exclamation me-2"></i>Incompleto</span>';

    let html = `
        <div class="table-responsive mb-3">
            <table class="table align-middle mb-0">
                <thead class="bg-light text-uppercase text-muted small">
                    <tr>
                        <th class="ps-3 border-0">Concepto</th>
                        <th class="text-center border-0">Peso</th>
                        <th class="text-center border-0">%</th>
                        <th class="text-end pe-3 border-0">Acción</th>
                    </tr>
                </thead>
                <tbody class="border-top-0">`;

    if (lista.length === 0) {
        html += `<tr><td colspan="4" class="text-center text-muted py-4 small bg-white">Sin criterios definidos para este bimestre.</td></tr>`;
    } else {
        lista.forEach(c => {
            html += `
            <tr class="bg-white">
                <td class="ps-3 fw-bold text-dark">${c.nombre}</td>
                <td class="text-center text-muted">${c.peso}</td>
                <td class="text-center fw-bold text-primary">${Math.round(c.peso * 100)}%</td>
                <td class="text-end pe-3">
                    <button onclick="eliminarCriterio(${c.id})" class="btn btn-sm btn-white border text-danger shadow-sm hover-shadow">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        });
    }

    html += `   </tbody>
                <tfoot style="border-top: 2px solid #e9ecef;">
                    <tr>
                        <td class="ps-3 fw-bold text-dark">TOTAL</td>
                        <td class="text-center fw-bold ${colorClass}">${pesoTotal.toFixed(2)}</td>
                        <td class="text-center fw-bold ${colorClass}">${Math.round(pesoTotal * 100)}%</td>
                        <td class="text-end pe-3">${badgeEstado}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
        ${!esCorrecto ? '<div class="alert alert-danger d-flex align-items-center py-2 px-3 small mb-0"><i class="fa-solid fa-circle-info me-2"></i><span>Para que el sistema calcule promedios correctamente, la suma de los pesos debe ser 1.0.</span></div>' : ''}
    `;

    contenedor.innerHTML = html;
}

async function crearCriterio(e) {
    e.preventDefault();
    const token = localStorage.getItem("tokenEscuela");

    const nombre = document.getElementById("txtNombreCriterio").value;
    const peso = parseFloat(document.getElementById("txtPesoCriterio").value);
    const periodo = parseInt(document.getElementById("cboPeriodoCriterio").value);

    if (!nombre || isNaN(peso) || peso <= 0 || peso > 1) {
        alert("Por favor verifica los datos. El peso debe ser entre 0.05 y 1.0.");
        return;
    }

    const payload = {
        cursoId: parseInt(cursoIdGlobal),
        nombre: nombre,
        peso: peso,
        numeroPeriodo: periodo
    };

    const btn = e.target.querySelector("button[type=submit]");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    try {
        const res = await fetch(`${API_BASE_URL}/Criterios`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            document.getElementById("txtNombreCriterio").value = "";
            document.getElementById("txtPesoCriterio").value = "";
            document.getElementById("txtNombreCriterio").focus();

            await cargarCriterios();

            const triggerEl = document.querySelector(`#tabsPeriodos button[data-bs-target="#panel-b${periodo}"]`);
            if (triggerEl) bootstrap.Tab.getOrCreateInstance(triggerEl).show();

        } else {
            const txt = await res.text();
            alert("Error: " + txt);
        }
    } catch (e) {
        alert("Error de conexión.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function eliminarCriterio(id) {
    if (!confirm("¿Está seguro de eliminar este criterio? Si ya existen notas registradas para este concepto, no se podrá borrar.")) return;

    const token = localStorage.getItem("tokenEscuela");
    try {
        const res = await fetch(`${API_BASE_URL}/Criterios/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
            cargarCriterios();
        } else {
            const txt = await res.text();
            alert("No se pudo eliminar: " + txt);
        }
    } catch (e) { alert("Error de conexión."); }
}