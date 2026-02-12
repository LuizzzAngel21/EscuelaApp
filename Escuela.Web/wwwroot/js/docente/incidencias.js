let listaEstudiantesGlobal = [];
let estudianteSeleccionadoId = null;

document.addEventListener("DOMContentLoaded", () => {
    cargarMisEstudiantes();
    const txtBuscar = document.getElementById("txtBuscarEstudiante");
    insertarFiltroGradoVisual();
    txtBuscar.addEventListener("input", aplicarFiltrosCombinados);
    document.getElementById("slcFiltroGrado").addEventListener("change", aplicarFiltrosCombinados);
    document.getElementById("formIncidencia").addEventListener("submit", guardarIncidencia);
});

function insertarFiltroGradoVisual() {
    const headerCard = document.querySelector(".card-header");
    const inputGroup = headerCard.querySelector(".input-group");

    if (document.getElementById("slcFiltroGrado")) return;

    const select = document.createElement("select");
    select.id = "slcFiltroGrado";
    select.className = "form-select form-select-sm border-0 bg-light fw-bold text-secondary mb-2";
    select.style.fontSize = "0.85rem";
    select.innerHTML = '<option value="">Todos los salones</option>';

    headerCard.insertBefore(select, inputGroup);

    const label = document.createElement("label");
    label.className = "small fw-bold text-muted mb-1";
    label.innerText = "FILTRAR LISTADO";
    headerCard.insertBefore(label, select);
}

async function cargarMisEstudiantes() {
    const contenedor = document.getElementById("listaEstudiantes");
    const token = localStorage.getItem("tokenEscuela");

    try {
        const response = await fetch(`${API_BASE_URL}/Mensajes/Destinatarios`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const todos = await response.json();

            listaEstudiantesGlobal = todos.filter(u => u.rol && u.rol.includes("-"));

            llenarComboGrados();

            renderizarListaEstudiantes(listaEstudiantesGlobal);
        } else {
            contenedor.innerHTML = '<div class="p-3 text-center text-danger small">Error cargando lista.</div>';
        }
    } catch (e) {
        contenedor.innerHTML = '<div class="p-3 text-center text-danger small">Error de conexión.</div>';
    }
}

function llenarComboGrados() {
    const select = document.getElementById("slcFiltroGrado");

    const gradosUnicos = [...new Set(listaEstudiantesGlobal.map(e => e.rol))].sort();

    let html = '<option value="">Todos los salones</option>';
    gradosUnicos.forEach(grado => {
        html += `<option value="${grado}">${grado}</option>`;
    });
    select.innerHTML = html;
}

function aplicarFiltrosCombinados() {
    const textoBusqueda = document.getElementById("txtBuscarEstudiante").value.toLowerCase();
    const gradoSeleccionado = document.getElementById("slcFiltroGrado").value;

    const filtrados = listaEstudiantesGlobal.filter(e => {
        const coincideNombre = e.nombreCompleto.toLowerCase().includes(textoBusqueda);
        const coincideGrado = gradoSeleccionado === "" || e.rol === gradoSeleccionado;
        return coincideNombre && coincideGrado;
    });

    renderizarListaEstudiantes(filtrados);
}

function renderizarListaEstudiantes(lista) {
    const contenedor = document.getElementById("listaEstudiantes");

    if (lista.length === 0) {
        contenedor.innerHTML = '<div class="p-4 text-center text-muted fst-italic small">No hay coincidencias.</div>';
        return;
    }

    lista.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));

    let html = "";
    lista.forEach(est => {
        const isActive = est.usuarioId === estudianteSeleccionadoId ? "active bg-primary-subtle border-primary" : "";
        const iconColor = isActive ? "text-primary" : "text-muted";

        html += `
        <button class="list-group-item list-group-item-action py-3 px-3 border-bottom user-item ${isActive}" 
            onclick="seleccionarEstudiante('${est.usuarioId}', '${est.nombreCompleto}', '${est.rol}', this)">
            <div class="d-flex align-items-center">
                <div class="avatar-circle me-3 bg-white ${iconColor} border shadow-sm fw-bold small" style="width: 35px; height: 35px; min-width: 35px;">
                    ${est.nombreCompleto.charAt(0)}
                </div>
                <div class="text-start overflow-hidden">
                    <h6 class="mb-0 text-dark fw-bold text-truncate" style="font-size: 0.85rem;">${est.nombreCompleto}</h6>
                    <small class="text-muted text-truncate d-block" style="font-size: 0.7rem;">
                        <i class="fa-solid fa-screen-users me-1"></i>${est.rol}
                    </small>
                </div>
            </div>
        </button>`;
    });
    contenedor.innerHTML = html;
}

function seleccionarEstudiante(id, nombre, seccion, elementoBtn) {
    estudianteSeleccionadoId = id;

    document.getElementById("panelVacio").classList.add("d-none");
    document.getElementById("panelHistorial").classList.remove("d-none");

    document.getElementById("lblNombreEstudiante").innerText = nombre;
    document.getElementById("lblGradoEstudiante").innerText = seccion;
    document.getElementById("lblInicial").innerText = nombre.charAt(0);

    document.querySelectorAll(".user-item").forEach(b => b.classList.remove("active", "bg-primary-subtle", "border-primary"));
    document.querySelectorAll(".user-item .avatar-circle").forEach(a => a.classList.replace("text-primary", "text-muted"));

    if (elementoBtn) {
        elementoBtn.classList.add("active", "bg-primary-subtle", "border-primary");
        elementoBtn.querySelector(".avatar-circle").classList.replace("text-muted", "text-primary");
    }

    cargarHistorial(id);
}

async function cargarHistorial(id) {
    const timeline = document.getElementById("timelineContainer");
    timeline.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary spinner-border-sm"></div></div>';

    const token = localStorage.getItem("tokenEscuela");

    try {
        const response = await fetch(`${API_BASE_URL}/Incidencias?usuarioId=${id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const incidencias = await response.json();
            renderizarTimeline(incidencias);
        } else {
            const retry = await fetch(`${API_BASE_URL}/Incidencias?estudianteId=${id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (retry.ok) {
                const incidencias = await retry.json();
                renderizarTimeline(incidencias);
            } else {
                timeline.innerHTML = '<div class="text-center text-muted py-4">No se pudo cargar el historial.</div>';
            }
        }
    } catch (e) {
        timeline.innerHTML = '<div class="text-center text-danger py-4">Error de conexión.</div>';
    }
}

function renderizarTimeline(incidencias) {
    const timeline = document.getElementById("timelineContainer");

    if (!incidencias || incidencias.length === 0) {
        timeline.innerHTML = `
            <div class="text-center py-5 opacity-50">
                <i class="fa-regular fa-face-smile fs-1 mb-2 text-success"></i>
                <p class="small text-muted fw-bold">Historial Limpio</p>
                <small>Este estudiante no tiene incidencias reportadas.</small>
            </div>`;
        return;
    }

    let html = "";
    incidencias.forEach(inc => {
        let colorClass = "primary";
        let bgClass = "bg-light";
        let icon = "fa-circle-info";

        if (inc.nivel === "Leve") {
            colorClass = "warning"; bgClass = "bg-warning-subtle"; icon = "fa-triangle-exclamation";
        } else if (inc.nivel === "Grave") {
            colorClass = "danger"; bgClass = "bg-danger-subtle"; icon = "fa-circle-exclamation";
        } else if (inc.nivel === "Muy Grave") {
            colorClass = "dark"; bgClass = "bg-secondary bg-opacity-25"; icon = "fa-skull";
        }

        html += `
        <div class="timeline-v-item pb-4">
            <div class="timeline-v-dot bg-${colorClass} border border-white shadow-sm" style="width: 16px; height: 16px; left: -28px; top: 18px;"></div>
            
            <div class="timeline-v-content border-0 shadow-sm p-0 overflow-hidden">
                <div class="d-flex border-bottom">
                    <div class="${bgClass} p-3 d-flex align-items-center justify-content-center" style="width: 50px;">
                        <i class="fa-solid ${icon} text-${colorClass} fs-5"></i>
                    </div>
                    <div class="p-3 flex-grow-1 bg-white">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                            <h6 class="fw-bold text-dark mb-0">${inc.titulo}</h6>
                            <span class="badge bg-light text-muted border">${inc.fecha.split(' ')[0]}</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="badge bg-${colorClass} bg-opacity-10 text-${colorClass} border border-${colorClass} border-opacity-25">${inc.nivel}</span>
                            <small class="text-muted fst-italic" style="font-size: 0.7rem;">Por: ${inc.nombreReportador}</small>
                        </div>
                    </div>
                </div>
                <div class="p-3 bg-white text-secondary small" style="line-height: 1.5;">
                    ${inc.descripcion}
                </div>
            </div>
        </div>`;
    });
    timeline.innerHTML = html;
}

function abrirModalReporte() {
    if (!estudianteSeleccionadoId) {
        alert("Primero selecciona un estudiante.");
        return;
    }
    document.getElementById("formIncidencia").reset();
    new bootstrap.Modal(document.getElementById('modalReporte')).show();
}

async function guardarIncidencia(e) {
    e.preventDefault();

    const dto = {
        usuarioId: estudianteSeleccionadoId,
        estudianteId: 0, 
        titulo: document.getElementById("txtTitulo").value,
        nivel: document.getElementById("slcNivel").value,
        descripcion: document.getElementById("txtDescripcion").value
    };

    const btn = e.target.querySelector("button[type='submit']");
    const textoOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
    const token = localStorage.getItem("tokenEscuela");

    try {
        const response = await fetch(`${API_BASE_URL}/Incidencias`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(dto)
        });

        if (response.ok) {
            alert("Incidencia registrada correctamente.");
            bootstrap.Modal.getInstance(document.getElementById('modalReporte')).hide();
            cargarHistorial(estudianteSeleccionadoId);
        } else {
            const txt = await response.text();
            alert("Error al guardar: " + txt);
        }
    } catch (error) {
        alert("Error de conexión.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
    }
}