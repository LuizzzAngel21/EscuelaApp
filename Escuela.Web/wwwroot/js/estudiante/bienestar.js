function obtenerPayload() {
    const tokenLocal = localStorage.getItem("tokenEscuela");
    if (!tokenLocal) return null;
    try {
        const base64Url = tokenLocal.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    } catch (e) {
        console.error("Error al decodificar token", e);
        return null;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const payload = obtenerPayload();
    const tokenLocal = localStorage.getItem("tokenEscuela");

    if (!payload || !tokenLocal) {
        window.location.href = "/Login";
        return;
    }

    cargarCitas();
    cargarEspecialistas();

    const btnTabExpediente = document.getElementById('expediente-tab');
    if (btnTabExpediente) {
        btnTabExpediente.addEventListener('click', () => {
            const estudianteId = localStorage.getItem("estudianteId") || payload.estudianteId || 101;
            cargarExpedientes(estudianteId);
        });
    }

    const formCita = document.getElementById("formCita");
    if (formCita) {
        formCita.addEventListener("submit", async (e) => {
            e.preventDefault();
            await enviarSolicitudCita(e.target);
        });
    }
});

// --- FUNCIONES DE CARGA ---

async function cargarCitas() {
    const container = document.getElementById("listaCitas");
    const tokenLocal = localStorage.getItem("tokenEscuela");
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE_URL}/Citas`, {
            headers: { "Authorization": `Bearer ${tokenLocal}` }
        });

        if (response.ok) {
            const citas = await response.json();
            if (citas.length === 0) {
                container.innerHTML = '<div class="col-12 text-center py-4 text-muted">No hay citas agendadas.</div>';
                return;
            }

            container.innerHTML = citas.map(c => {
                const color = c.estado === "Confirmada" ? "success" : c.estado === "Pendiente" ? "warning" : "danger";
                return `
                <div class="col-md-6 mb-3">
                    <div class="card border-0 shadow-sm border-start border-4 border-${color} h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between mb-2">
                                <span class="badge bg-${color}">${c.estado}</span>
                                <small class="text-muted">${c.fecha} - ${c.hora}</small>
                            </div>
                            <h6 class="fw-bold mb-0">${c.nombreOrganizador}</h6>
                            <small class="text-muted">${c.cargo}</small>
                            <p class="small bg-light p-2 my-2 rounded">"${c.motivo}"</p>
                            <div class="small">
                                <i class="fa-solid ${c.modalidad === 'Virtual' ? 'fa-video text-primary' : 'fa-location-dot text-danger'} me-1"></i>
                                ${c.linkODireccion}
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }
    } catch (e) { console.error("Error al cargar citas:", e); }
}

async function cargarEspecialistas() {
    const select = document.getElementById("slcDestinatario");
    const tokenLocal = localStorage.getItem("tokenEscuela");
    if (!select) return;

    try {
        const response = await fetch(`${API_BASE_URL}/Citas/Especialistas`, {
            headers: { "Authorization": `Bearer ${tokenLocal}` }
        });

        if (response.ok) {
            const especialistas = await response.json();
            let html = '<option value="">-- Selecciona un Psicólogo --</option>';
            especialistas.forEach(p => {
                html += `<option value="${p.usuarioId}">${p.nombreCompleto}</option>`;
            });
            select.innerHTML = html;
        }
    } catch (e) { console.error("Error especialistas:", e); }
}

async function cargarExpedientes(estudianteId) {
    const container = document.getElementById("contenedorExpedientes");
    const tokenLocal = localStorage.getItem("tokenEscuela");
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE_URL}/Expedientes/Estudiante/${estudianteId}`, {
            headers: { "Authorization": `Bearer ${tokenLocal}` }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.length === 0) {
                container.innerHTML = `<p class="text-center p-5 text-muted">No hay registros para el ID ${estudianteId}</p>`;
                return;
            }

            container.innerHTML = data.map(ex => `
                <div class="col-md-10 mb-4">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between mb-3">
                                <h5 class="fw-bold text-primary mb-0">${ex.titulo}</h5>
                                <span class="badge bg-light text-dark border">${ex.fecha}</span>
                            </div>
                            <p class="text-secondary small mb-3">${ex.descripcion}</p>
                            <div class="p-3 border-start border-4 border-success" style="background-color: #f0fdf4;">
                                <h6 class="fw-bold text-success small mb-2">RECOMENDACIONES:</h6>
                                <p class="mb-0 text-dark small">${ex.recomendaciones}</p>
                            </div>
                            <div class="mt-3 text-end">
                                <small class="text-muted">Especialista: <strong>${ex.nombrePsicologo}</strong></small>
                            </div>
                        </div>
                    </div>
                </div>`).join('');
        }
    } catch (e) { console.error("Error expediente:", e); }
}

async function enviarSolicitudCita(form) {
    const tokenLocal = localStorage.getItem("tokenEscuela");
    const dto = {
        destinatarioId: document.getElementById("slcDestinatario").value,
        motivo: document.getElementById("txtMotivo").value,
        fechaHora: `${document.getElementById("txtFecha").value}T${document.getElementById("txtHora").value}:00`,
        esVirtual: document.getElementById("chkVirtual").checked
    };

    try {
        const response = await fetch(`${API_BASE_URL}/Citas`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${tokenLocal}`
            },
            body: JSON.stringify(dto)
        });

        const res = await response.json();
        if (response.ok) {
            alert(res.mensaje);
            form.reset();
            cargarCitas();
        } else {
            alert("Error: " + (res.message || res));
        }
    } catch (e) { alert("Error de conexión"); }
}