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
        btnTabExpediente.addEventListener('click', async () => {
            const tokenLocal = localStorage.getItem("tokenEscuela");

            try {
                const res = await fetch(`${API_BASE_URL}/Matriculas/MiMatriculaActual`, {
                    headers: { "Authorization": `Bearer ${tokenLocal}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    const realEstudianteId = data.estudianteId || data.id;
                    cargarExpedientes(realEstudianteId);
                } else {
                    console.error("No se pudo obtener el ID numérico del estudiante");
                }
            } catch (e) {
                console.error("Error de conexión al buscar ID", e);
            }
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
                container.innerHTML = '<div class="col-12 text-center py-5 text-muted small">No tienes citas agendadas próximamente.</div>';
                return;
            }

            container.innerHTML = citas.map(c => {
                const color = c.estado === "Confirmada" ? "success" : c.estado === "Pendiente" ? "warning" : "danger";
                const iconoModalidad = c.modalidad === 'Virtual' ? 'fa-video' : 'fa-location-dot';
                const colorModalidad = c.modalidad === 'Virtual' ? 'text-primary' : 'text-danger';

                return `
                <div class="col-md-6 mb-3">
                    <div class="card border-0 shadow-sm border-start border-4 border-${color} h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between mb-2 align-items-center">
                                <span class="badge bg-${color} bg-opacity-10 text-${color} border border-${color} border-opacity-25">${c.estado}</span>
                                <small class="text-muted fw-bold" style="font-size:0.75rem;">${c.fecha} - ${c.hora}</small>
                            </div>
                            <h6 class="fw-bold mb-0 text-dark">${c.nombreOrganizador}</h6>
                            <small class="text-muted d-block mb-2">${c.cargo}</small>
                            
                            <div class="bg-light p-2 rounded small text-secondary fst-italic mb-3">
                                "${c.motivo}"
                            </div>
                            
                            <div class="small fw-medium text-dark d-flex align-items-center">
                                <i class="fa-solid ${iconoModalidad} ${colorModalidad} me-2"></i>
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
                container.innerHTML = `<p class="text-center p-5 text-muted small">No hay historial clínico registrado.</p>`;
                return;
            }

            container.innerHTML = data.map(ex => `
                <div class="col-md-10 mb-4">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between mb-3 align-items-center">
                                <h5 class="fw-bold text-primary mb-0">${ex.titulo}</h5>
                                <span class="badge bg-light text-muted border fw-normal">
                                    <i class="fa-regular fa-calendar me-1"></i>${ex.fecha}
                                </span>
                            </div>
                            <p class="text-secondary small mb-3">${ex.descripcion}</p>
                            
                            <div class="p-3 border-start border-4 border-success rounded-end" style="background-color: #f0fdf4;">
                                <h6 class="fw-bold text-success small mb-2"><i class="fa-solid fa-check-circle me-1"></i>RECOMENDACIONES</h6>
                                <p class="mb-0 text-dark small">${ex.recomendaciones}</p>
                            </div>
                            
                            <div class="mt-3 text-end border-top pt-2">
                                <small class="text-muted">Atendido por: <strong class="text-dark">${ex.nombrePsicologo}</strong></small>
                            </div>
                        </div>
                    </div>
                </div>`).join('');
        }
    } catch (e) { console.error("Error expediente:", e); }
}

async function enviarSolicitudCita(form) {
    const tokenLocal = localStorage.getItem("tokenEscuela");

    const destinatario = document.getElementById("slcDestinatario").value;
    if (!destinatario) { alert("Seleccione un especialista"); return; }

    const dto = {
        destinatarioId: destinatario,
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
            alert(res.mensaje || "Solicitud enviada");
            form.reset();
            cargarCitas();
        } else {
            alert("Error: " + (res.message || res));
        }
    } catch (e) { alert("Error de conexión"); }
}