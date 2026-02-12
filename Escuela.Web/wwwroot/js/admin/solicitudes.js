let solicitudesData = [];
let actualSolicitud = null;

document.addEventListener("DOMContentLoaded", () => {
    cargarSolicitudes();
    cargarPeriodos();
    document.getElementById("formAprobar").addEventListener("submit", procesarMatriculaFinal);
});

async function cargarSolicitudes() {
    const tbody = document.getElementById("tbodySolicitudes");
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-5"><div class="spinner-border text-primary spinner-border-sm"></div></td></tr>`;
    const token = localStorage.getItem("tokenEscuela");

    try {
        const res = await fetch(`${API_BASE_URL}/Matriculas/Pendientes`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
            solicitudesData = await res.json();
            renderTable(solicitudesData);
        }
    } catch (e) {
        console.error("Error al cargar solicitudes:", e);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-danger small">Error de conexión con el servidor.</td></tr>`;
    }
}

function renderTable(data) {
    const tbody = document.getElementById("tbodySolicitudes");
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-muted small">No hay solicitudes pendientes.</td></tr>`;
        return;
    }

    let html = "";
    data.forEach(s => {
        const pagoStatus = s.pago === "OK"
            ? `<span class="badge rounded-pill badge-pago-ok">PAGADO</span>`
            : `<span class="badge rounded-pill badge-pago-pending">PENDIENTE</span>`;

        const btnApproveDisabled = s.pago !== "OK" ? "disabled" : "";

        html += `
            <tr>
                <td class="ps-4">
                    <div class="fw-bold text-dark">${s.nombreCompleto}</div>
                    <small class="text-muted">${s.dni}</small>
                </td>
                <td><span class="text-dark fw-500">${s.nombreGrado}</span></td>
                <td class="text-center">${pagoStatus}</td>
                <td><span class="text-muted small">${s.fecha}</span></td>
                <td class="text-end pe-4">
                    <button class="btn-action-admin btn-action-view me-1" onclick="abrirExpediente(${s.id})" title="Revisar">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="btn-action-admin btn-action-observe me-1" onclick="observarSolicitud(${s.id})" title="Observar">
                        <i class="fa-solid fa-comment-slash"></i>
                    </button>
                    <button class="btn-action-admin btn-action-approve" onclick="abrirAprobar(${s.id})" ${btnApproveDisabled} title="Matricular">
                        <i class="fa-solid fa-check-double"></i>
                    </button>
                </td>
            </tr>`;
    });
    tbody.innerHTML = html;
}

function abrirExpediente(id) {
    actualSolicitud = solicitudesData.find(s => s.id === id);
    document.getElementById("expNombre").innerText = actualSolicitud.nombreCompleto;
    document.getElementById("expDni").innerText = actualSolicitud.dni;
    document.getElementById("expPago").innerText = actualSolicitud.pago;

    document.getElementById("docPreview").innerHTML = `
        <div class="text-center p-5 opacity-50">
            <i class="fa-solid fa-file-import fa-3x mb-3"></i>
            <p class="small">Seleccione un documento para revisar</p>
        </div>`;

    new bootstrap.Modal(document.getElementById("modalExpediente")).show();
}

function verDocumento(tipo) {
    const container = document.getElementById("docPreview");
    container.innerHTML = `<div class="d-flex justify-content-center align-items-center h-100"><div class="spinner-border text-primary"></div></div>`;

    let urlCompleta = "";
    if (tipo === 'dni') urlCompleta = actualSolicitud.urlFotoDni;
    else if (tipo === 'notas') urlCompleta = actualSolicitud.urlConstanciaNotas;
    else if (tipo === 'seguro') urlCompleta = actualSolicitud.urlSeguroMedico;

    if (!urlCompleta) {
        container.innerHTML = `
            <div class="d-flex flex-column justify-content-center align-items-center h-100 text-muted opacity-50">
                <i class="fa-solid fa-file-circle-xmark fa-3x mb-3"></i>
                <p>No se adjuntó documento</p>
            </div>`;
        return;
    }

    console.log("Abriendo documento:", urlCompleta);

    const esPdf = urlCompleta.toLowerCase().endsWith(".pdf");

    if (esPdf) {
        container.innerHTML = `
            <div class="w-100 h-100 animate__animated animate__fadeIn">
                <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded border-bottom">
                    <span class="small fw-bold text-primary"><i class="fa-solid fa-file-pdf me-2"></i>Documento PDF</span>
                    <a href="${urlCompleta}" target="_blank" class="btn btn-xs btn-outline-secondary py-0 px-2" style="font-size: 0.75rem;">
                        <i class="fa-solid fa-up-right-from-square me-1"></i>Abrir externo
                    </a>
                </div>
                <iframe src="${urlCompleta}" class="w-100 bg-white rounded border" style="height: 400px;"></iframe>
            </div>`;
    } else {
        container.innerHTML = `
            <div class="h-100 d-flex flex-column justify-content-center align-items-center animate__animated animate__zoomIn">
                <img src="${urlCompleta}" class="img-fluid rounded shadow-sm border" style="max-height: 400px; object-fit: contain;">
                <a href="${urlCompleta}" target="_blank" class="btn btn-sm btn-light mt-3 shadow-sm border">
                    <i class="fa-solid fa-magnifying-glass-plus me-2"></i>Ver original
                </a>
            </div>`;
    }
}

async function observarSolicitud(id) {
    const token = localStorage.getItem("tokenEscuela");
    const { value: motivo } = await Swal.fire({
        title: 'Observar Documentación',
        text: 'Escriba el motivo para notificar al padre.',
        input: 'textarea',
        inputPlaceholder: 'Ej. La foto del DNI no es legible...',
        showCancelButton: true,
        confirmButtonText: 'Notificar WhatsApp',
        confirmButtonColor: '#0b2a4a',
        cancelButtonText: 'Cancelar'
    });

    if (motivo) {
        try {
            const res = await fetch(`${API_BASE_URL}/Matriculas/Observar`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ solicitudId: id, mensajeError: motivo })
            });

            if (res.ok) {
                const data = await res.json();
                await Swal.fire({ icon: 'success', title: 'Registrado', confirmButtonColor: '#0b2a4a' });
                window.open(data.linkWhatsapp, '_blank');
                cargarSolicitudes();
            }
        } catch (e) { console.error(e); }
    }
}

async function abrirAprobar(id) {
    const solicitud = solicitudesData.find(s => s.id === id);
    document.getElementById("solicitudIdAprobar").value = id;
    document.getElementById("txtGradoAprobar").value = solicitud.nombreGrado;
    await cargarSeccionesParaAprobar(solicitud.gradoId);
    new bootstrap.Modal(document.getElementById("modalAprobar")).show();
}

async function cargarSeccionesParaAprobar(gradoId) {
    const combo = document.getElementById("cboSeccionAprobar");
    const token = localStorage.getItem("tokenEscuela");
    try {
        const res = await fetch(`${API_BASE_URL}/Secciones/Grado/${gradoId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const secciones = await res.json();
        if (secciones.length === 0) {
            combo.innerHTML = `<option value="">No hay secciones en este grado</option>`;
            return;
        }
        combo.innerHTML = secciones.map(s => `<option value="${s.id}">${s.nombre} (${s.capacidad} vacantes)</option>`).join('');
    } catch (e) { combo.innerHTML = `<option value="">Error al cargar</option>`; }
}

async function cargarPeriodos() {
    const combo = document.getElementById("cboPeriodoAprobar");
    try {
        const res = await fetch(`${API_BASE_URL}/Periodos`);
        const periodos = await res.json();
        combo.innerHTML = periodos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
        if (periodos.length > 0) combo.value = periodos[periodos.length - 1].id;
    } catch (e) { console.error(e); }
}

async function procesarMatriculaFinal(e) {
    e.preventDefault();
    const token = localStorage.getItem("tokenEscuela");

    const btnSubmit = document.querySelector("#formAprobar button[type=submit]");
    const textoOriginal = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Procesando...';

    const payload = {
        solicitudId: parseInt(document.getElementById("solicitudIdAprobar").value),
        seccionId: parseInt(document.getElementById("cboSeccionAprobar").value),
        periodoId: parseInt(document.getElementById("cboPeriodoAprobar").value)
    };

    try {
        const res = await fetch(`${API_BASE_URL}/Matriculas/Procesar`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const data = await res.json();

            bootstrap.Modal.getInstance(document.getElementById("modalAprobar")).hide();

            Swal.fire({
                icon: 'success',
                title: '¡Matrícula Exitosa!',
                text: 'El estudiante ha sido inscrito correctamente.',
                showCancelButton: true,
                confirmButtonText: '<i class="fa-solid fa-file-pdf"></i> Descargar Ficha',
                cancelButtonText: 'Cerrar',
                confirmButtonColor: '#d32f2f',
                cancelButtonColor: '#0b2a4a'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.open(`${API_BASE_URL}/Matriculas/Ficha/${data.matriculaId}`, '_blank');
                }
            });

            cargarSolicitudes();
        } else {
            const err = await res.text();
            Swal.fire("Error", err.replace(/"/g, ''), "error");
        }
    } catch (e) {
        console.error(e);
        Swal.fire("Error", "Fallo de red al procesar la matrícula.", "error");
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoOriginal;
    }
}