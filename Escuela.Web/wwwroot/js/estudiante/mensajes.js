const token = localStorage.getItem("tokenEscuela");
let bandejaActual = 'entrada'; 

document.addEventListener("DOMContentLoaded", () => {
    if (!token) { window.location.href = "/Login"; return; }

    cargarBandeja('entrada');
    cargarDestinatarios(); 

    document.getElementById("formEnviarMensaje").addEventListener("submit", enviarMensaje);
});

async function cargarBandeja(tipo) {
    bandejaActual = tipo;
    const container = document.getElementById("lista-mensajes");
    const titulo = document.getElementById("titulo-bandeja");

    document.getElementById("btn-tab-entrada").classList.toggle("active", tipo === 'entrada');
    document.getElementById("btn-tab-salida").classList.toggle("active", tipo === 'salida');

    titulo.innerText = tipo === 'entrada' ? "Bandeja de Entrada" : "Mensajes Enviados";
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';

    const endpoint = tipo === 'entrada' ? "Entrada" : "Salida";

    try {
        const response = await fetch(`${API_BASE_URL}/Mensajes/${endpoint}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const mensajes = await response.json();
            renderizarLista(mensajes, tipo);
        } else {
            container.innerHTML = '<p class="text-danger text-center py-4">Error al cargar mensajes.</p>';
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = '<p class="text-danger text-center py-4">Error de conexión.</p>';
    }
}

function renderizarLista(mensajes, tipo) {
    const container = document.getElementById("lista-mensajes");

    if (mensajes.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="fa-regular fa-envelope-open display-4 mb-3 opacity-25"></i>
                <p>No hay mensajes en esta bandeja.</p>
            </div>`;
        return;
    }

    let html = "";
    mensajes.forEach(m => {
        const esNoLeido = (tipo === 'entrada' && !m.leido);
        const claseEstado = esNoLeido ? "mensaje-no-leido" : "mensaje-leido";
        const nombreMostrar = tipo === 'entrada' ? m.remitenteNombre : `Para: ${m.destinatarioNombre}`;
        const icono = tipo === 'entrada' ? (esNoLeido ? 'fa-envelope' : 'fa-envelope-open') : 'fa-paper-plane';

        const dataJson = encodeURIComponent(JSON.stringify(m));

        html += `
        <div class="list-group-item px-4 py-3 border-0 border-bottom mensaje-item ${claseEstado}" 
             onclick="verMensaje('${dataJson}')">
            <div class="d-flex justify-content-between align-items-center mb-1">
                <small class="text-uppercase fw-bold text-muted" style="font-size: 0.75rem;">
                    ${nombreMostrar}
                </small>
                <small class="text-muted text-end" style="min-width: 120px;">
                    ${m.fecha}
                </small>
            </div>
            <div class="d-flex align-items-center justify-content-between">
                <h6 class="mb-0 text-truncate mensaje-asunto" style="max-width: 80%;">
                    ${m.asunto}
                </h6>
                <i class="fa-regular ${icono} text-muted opacity-50"></i>
            </div>
            <p class="mb-0 text-muted small text-truncate pe-4 opacity-75">
                ${m.contenido}
            </p>
        </div>`;
    });

    container.innerHTML = html;
}

function recargarBandejaActual() {
    cargarBandeja(bandejaActual);
}

async function verMensaje(dataEncoded) {
    const m = JSON.parse(decodeURIComponent(dataEncoded));

    // Llenar Modal
    document.getElementById("leerAsunto").innerText = m.asunto;
    document.getElementById("leerRemitente").innerText = bandejaActual === 'entrada' ? m.remitenteNombre : `Para: ${m.destinatarioNombre}`;
    document.getElementById("leerFecha").innerText = m.fecha;
    document.getElementById("leerCuerpo").innerText = m.contenido;

    const areaAdjunto = document.getElementById("areaAdjunto");
    const linkAdjunto = document.getElementById("linkAdjunto");
    if (m.archivoUrl) {
        areaAdjunto.classList.remove("d-none");
        linkAdjunto.href = m.archivoUrl;
    } else {
        areaAdjunto.classList.add("d-none");
    }

    new bootstrap.Modal(document.getElementById('modalLeerMensaje')).show();

    if (bandejaActual === 'entrada' && !m.leido) {
        try {
            await fetch(`${API_BASE_URL}/Mensajes/Leer/${m.id}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            cargarBandeja('entrada');
        } catch (e) { console.error("Error al marcar como leído", e); }
    }
}

function abrirModalRedactar() {
    document.getElementById("formEnviarMensaje").reset();
    new bootstrap.Modal(document.getElementById('modalRedactar')).show();
}

async function cargarDestinatarios() {
    const select = document.getElementById("slcDestinatarios");
    try {
        const response = await fetch(`${API_BASE_URL}/Mensajes/Destinatarios`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const destinatarios = await response.json();

            const grupos = {};
            destinatarios.forEach(d => {
                if (!grupos[d.rol]) grupos[d.rol] = [];
                grupos[d.rol].push(d);
            });

            let html = '<option value="">-- Selecciona un destinatario --</option>';

            for (const [rol, usuarios] of Object.entries(grupos)) {
                html += `<optgroup label="${rol}">`;
                usuarios.forEach(u => {
                    html += `<option value="${u.usuarioId}">${u.nombreCompleto}</option>`;
                });
                html += `</optgroup>`;
            }

            select.innerHTML = html;
        }
    } catch (e) {
        console.error("Error cargando destinatarios", e);
        select.innerHTML = '<option value="">Error al cargar lista</option>';
    }
}

async function enviarMensaje(e) {
    e.preventDefault();
    const btnSubmit = e.target.querySelector('button[type="submit"]');

    const dto = {
        destinatarioId: document.getElementById("slcDestinatarios").value,
        asunto: document.getElementById("txtAsunto").value,
        contenido: document.getElementById("txtContenido").value,
        archivoAdjuntoUrl: document.getElementById("txtAdjunto").value || null 
    };

    const btnOriginal = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';

    try {
        const response = await fetch(`${API_BASE_URL}/Mensajes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(dto)
        });

        if (response.ok) {
            const modalEl = document.getElementById('modalRedactar');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();

            alert("Mensaje enviado correctamente."); 

            cargarBandeja('salida');
        } else {
            const err = await response.text();
            alert("Error al enviar: " + err);
        }
    } catch (e) {
        alert("Error de conexión");
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = btnOriginal;
    }
}