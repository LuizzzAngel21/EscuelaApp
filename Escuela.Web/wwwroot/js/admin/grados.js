let gradoSeleccionadoId = null;
let gradoSeleccionadoNombre = "";

document.addEventListener("DOMContentLoaded", () => {
    cargarGrados();
    document.getElementById("formGrado").addEventListener("submit", guardarGrado);
    document.getElementById("formSeccion").addEventListener("submit", guardarSeccion);
});

async function cargarGrados() {
    const contenedor = document.getElementById("listaGrados");
    const token = localStorage.getItem("tokenEscuela");

    try {
        const res = await fetch(`${API_BASE_URL}/Grados`, { headers: { "Authorization": `Bearer ${token}` } });
        if (!res.ok) throw new Error("Error");
        const grados = await res.json();
        grados.sort((a, b) => a.nombre.localeCompare(b.nombre));

        let html = "";
        grados.forEach(g => {
            const icono = g.nivel === "Primaria" ? "fa-child" : "fa-user-graduate";
            html += `
                <a class="list-group-item list-group-item-action py-3 px-3 border-bottom d-flex align-items-center" 
                   onclick="seleccionarGrado(${g.id}, '${g.nombre}', this)" style="cursor: pointer;">
                    <div class="me-3 text-center text-muted" style="width:24px;">
                        <i class="fa-solid ${icono}"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="fw-semibold text-dark" style="font-size: 0.95rem;">${g.nombre}</div>
                        <small class="text-muted text-uppercase" style="font-size: 0.7rem; letter-spacing: 0.5px;">${g.nivel}</small>
                    </div>
                    <i class="fa-solid fa-chevron-right text-light small"></i>
                </a>
            `;
        });
        contenedor.innerHTML = html;
    } catch (e) {
        contenedor.innerHTML = `<div class="p-3 text-center text-danger small">Error de conexión</div>`;
    }
}

function seleccionarGrado(id, nombre, elementoHTML) {
    gradoSeleccionadoId = id;
    gradoSeleccionadoNombre = nombre;

    document.querySelectorAll(".list-group-item-action").forEach(el => {
        el.classList.remove("active", "bg-light");
        const icon = el.querySelector(".fa-chevron-right");
        if (icon) icon.classList.add("text-light");
        if (icon) icon.classList.remove("text-primary");
    });

    elementoHTML.classList.add("active", "bg-light");
    elementoHTML.querySelector(".fa-chevron-right").classList.remove("text-light");
    elementoHTML.querySelector(".fa-chevron-right").classList.add("text-primary");

    document.getElementById("tituloDetalle").innerText = `Secciones de ${nombre}`;
    document.getElementById("subtituloDetalle").innerText = "Gestione las aulas disponibles";
    document.getElementById("btnNuevaSeccion").disabled = false;
    document.getElementById("emptyState").style.display = "none";
    document.getElementById("contenedorTabla").style.display = "block";

    cargarSecciones(id);
}

async function cargarSecciones(gradoId) {
    const tbody = document.getElementById("bodySecciones");
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-5"><div class="spinner-border text-primary spinner-border-sm"></div></td></tr>`;
    const token = localStorage.getItem("tokenEscuela");

    try {
        const res = await fetch(`${API_BASE_URL}/Secciones/Grado/${gradoId}`, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
            const secciones = await res.json();
            if (secciones.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-5 small">No hay secciones registradas.</td></tr>`;
                return;
            }

            let html = "";
            secciones.forEach(s => {
                const capacidad = s.capacidad || s.Capacidad || 0;
                html += `
                    <tr>
                        <td class="py-3 ps-4">
                            <span class="d-inline-flex align-items-center justify-content-center bg-white border fw-bold text-dark rounded-circle shadow-sm" 
                                  style="width: 38px; height: 38px;">
                                ${s.nombre}
                            </span>
                        </td>
                        <td class="py-3">
                            <span class="text-muted small"><i class="fa-solid fa-users me-2"></i>${capacidad} max.</span>
                        </td>
                        <td class="py-3">
                            <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3" style="font-weight:500;">Activo</span>
                        </td>
                        <td class="py-3 pe-4 text-end">
                            <button class="btn btn-sm btn-outline-secondary border-0 me-1" 
                                    onclick="editarSeccion(${s.id}, '${s.nombre}', ${capacidad})" 
                                    title="Editar">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger border-0" 
                                    onclick="eliminarSeccion(${s.id})" 
                                    title="Eliminar">
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger small py-4">Error al cargar datos</td></tr>`;
    }
}

async function guardarGrado(e) { e.preventDefault(); procesarGuardado(`${API_BASE_URL}/Grados`, { nombre: document.getElementById("txtNombreGrado").value, nivel: document.getElementById("cboNivelGrado").value }, "modalGrado", "formGrado", () => cargarGrados()); }
async function guardarSeccion(e) { e.preventDefault(); procesarGuardado(`${API_BASE_URL}/Secciones`, { nombre: document.getElementById("txtNombreSeccion").value, capacidad: parseInt(document.getElementById("txtCapacidad").value), gradoId: gradoSeleccionadoId }, "modalSeccion", "formSeccion", () => cargarSecciones(gradoSeleccionadoId)); }

async function procesarGuardado(url, payload, modalId, formId, callbackSuccess) {
    const token = localStorage.getItem("tokenEscuela");
    try {
        const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(payload) });
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById(modalId)).hide();
            document.getElementById(formId).reset();
            callbackSuccess();
            const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, didOpen: (toast) => { toast.style.borderLeft = '5px solid #0b2a4a'; } });
            Toast.fire({ icon: 'success', title: 'Registrado correctamente' });
        } else { Swal.fire({ title: 'Error', text: 'No se pudo guardar', icon: 'error', confirmButtonColor: '#0b2a4a' }); }
    } catch (e) { console.error(e); }
}

async function editarSeccion(id, nombreActual, capacidadActual) {
    const token = localStorage.getItem("tokenEscuela");

    const { value: formValues } = await Swal.fire({
        title: 'Editar Sección',
        html: `
            <div class="text-start px-2">
                <div class="mb-3">
                    <label class="form-label fw-bold small text-muted">Nombre / Letra</label>
                    <input id="swal-nombre" class="form-control" value="${nombreActual}">
                </div>
                <div class="mb-1">
                    <label class="form-label fw-bold small text-muted">Capacidad</label>
                    <input id="swal-capacidad" type="number" class="form-control" value="${capacidadActual}">
                </div>
            </div>
            
            <style>
                .swal2-popup .form-control:focus {
                    border-color: #0b2a4a;
                    box-shadow: 0 0 0 0.25rem rgba(11, 42, 74, 0.15);
                }
            </style>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0b2a4a',
        cancelButtonColor: '#6c757d',
        width: '400px',
        customClass: {
            popup: 'rounded-4 shadow',
            title: 'fs-5 fw-bold text-dark mb-3',
            confirmButton: 'px-4',
            cancelButton: 'px-4'
        },
        preConfirm: () => {
            return {
                nombre: document.getElementById('swal-nombre').value,
                capacidad: document.getElementById('swal-capacidad').value
            }
        }
    });

    if (formValues) {
        if (!formValues.nombre || !formValues.capacidad) return;

        try {
            const res = await fetch(`${API_BASE_URL}/Secciones/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    id: id,
                    nombre: formValues.nombre,
                    capacidad: parseInt(formValues.capacidad),
                    gradoId: gradoSeleccionadoId
                })
            });

            if (res.ok) {
                cargarSecciones(gradoSeleccionadoId);
                const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, didOpen: (t) => t.style.borderLeft = '5px solid #0b2a4a' });
                Toast.fire({ icon: 'success', title: 'Actualizado correctamente' });
            } else {
                const txt = await res.text();
                Swal.fire({ title: 'Atención', text: txt.replace(/"/g, ''), icon: 'warning', confirmButtonColor: '#0b2a4a' });
            }
        } catch (e) {
            Swal.fire('Error', 'Fallo de conexión', 'error');
        }
    }
}

async function eliminarSeccion(id) {
    const token = localStorage.getItem("tokenEscuela");
    const result = await Swal.fire({
        title: '¿Eliminar sección?',
        text: "Solo permitido si no tiene alumnos.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        width: '350px',
        customClass: { popup: 'rounded-4', title: 'fs-5 fw-bold', htmlContainer: 'small text-muted' }
    });

    if (result.isConfirmed) {
        try {
            const res = await fetch(`${API_BASE_URL}/Secciones/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                cargarSecciones(gradoSeleccionadoId);
                const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, didOpen: (t) => t.style.borderLeft = '5px solid #0b2a4a' });
                Toast.fire({ icon: 'success', title: 'Eliminado correctamente' });
            } else {
                const errorTxt = await res.text();
                Swal.fire({ title: 'No permitido', text: errorTxt.replace(/"/g, ''), icon: 'error', confirmButtonColor: '#0b2a4a' });
            }
        } catch (e) { Swal.fire('Error', 'Fallo de conexión', 'error'); }
    }
}

function abrirModalSeccion() {
    document.getElementById("lblGradoModal").innerText = gradoSeleccionadoNombre;
    document.getElementById("txtNombreSeccion").value = "";
    document.getElementById("txtCapacidad").value = "30";
    new bootstrap.Modal(document.getElementById("modalSeccion")).show();
}