let todosLosComunicados = [];

document.addEventListener("DOMContentLoaded", () => {
    mostrarFechaHoy();
    cargarHorarioHoy();
    cargarEstadoFinanciero();
    cargarComunicados();
});

function mostrarFechaHoy() {
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha = new Date().toLocaleDateString('es-ES', opciones);
    const lbl = document.getElementById("lblFechaHoy");
    if (lbl) lbl.innerText = fecha.charAt(0).toUpperCase() + fecha.slice(1);
}

async function cargarHorarioHoy() {
    const container = document.getElementById("timeline-container");
    const token = localStorage.getItem("tokenEscuela");

    if (!container) return;

    try {
        const diasSemana = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
        const diaHoy = diasSemana[new Date().getDay()];

        const response = await fetch(`${API_BASE_URL}/Horarios`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const todosHorarios = await response.json();

            const horariosHoy = todosHorarios.filter(h => normalizarTexto(h.dia) === normalizarTexto(diaHoy));

            horariosHoy.sort((a, b) => {
                return parseInt(a.horaInicio.replace(":", "")) - parseInt(b.horaInicio.replace(":", ""));
            });

            if (horariosHoy.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-5">
                        <div class="bg-light rounded-circle d-inline-flex p-3 mb-3 text-muted opacity-50">
                            <i class="fa-solid fa-mug-hot display-4"></i>
                        </div>
                        <p class="text-muted fw-medium">No hay clases programadas para hoy.</p>
                    </div>`;
                return;
            }

            let html = `<div class="timeline-vertical">`;

            const ahora = new Date();
            const minutosAhora = (ahora.getHours() * 60) + ahora.getMinutes();

            horariosHoy.forEach(h => {
                const [hInicio, mInicio] = h.horaInicio.split(':').map(Number);
                const [hFin, mFin] = h.horaFin.split(':').map(Number);

                const minutosInicio = (hInicio * 60) + mInicio;
                const minutosFin = (hFin * 60) + mFin;

                let estadoClass = "";
                let timeColor = "text-muted";
                let badgeEstado = "";

                if (minutosFin < minutosAhora) {
                    estadoClass = "opacity-75";
                    badgeEstado = `<span class="badge bg-light text-muted border border-secondary-subtle">FINALIZADO</span>`;

                } else if (minutosInicio <= minutosAhora && minutosFin >= minutosAhora) {
                    estadoClass = "active";
                    badgeEstado = `<span class="badge bg-success text-white shadow-sm">EN VIVO</span>`;

                } else {
                    estadoClass = "";
                    badgeEstado = `<span class="badge bg-light text-muted border border-secondary-subtle">PENDIENTE</span>`;
                }

                html += `
                <div class="timeline-v-item ${estadoClass}">
                    <div class="timeline-v-dot"></div>
                    <div class="timeline-v-content">
                        <div class="d-flex justify-content-between mb-1 align-items-center">
                            <span class="small ${timeColor}">${h.horaInicio} - ${h.horaFin}</span>
                            ${badgeEstado}
                        </div>
                        <h6 class="fw-bold text-dark mb-1" style="font-size:0.9rem;">${h.curso}</h6>
                        <div class="small text-muted">
                            <i class="fa-solid fa-user-tie me-1 opacity-50"></i>${h.docente || 'Docente'}
                        </div>
                        
                        ${estadoClass === 'active' ?
                        `<div class="mt-2 pt-2 border-top border-light">
                                <a href="/Estudiante/Aula?cursoId=${h.cursoId || 1}" class="btn btn-primary btn-sm w-100 rounded-pill" style="font-size: 0.75rem;">
                                    Entrar al Aula
                                </a>
                             </div>`
                        : ''}
                    </div>
                </div>`;
            });
            html += `</div>`;
            container.innerHTML = html;
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="text-danger text-center small">No se pudo cargar el horario.</p>`;
    }
}

async function cargarEstadoFinanciero() {
    const loader = document.getElementById("loaderFinanzas");
    const content = document.getElementById("contentFinanzas");
    const card = document.getElementById("cardFinanzas");
    const icon = document.getElementById("iconFinanzas");
    const lblEstado = document.getElementById("lblEstadoFinanciero");
    const lblMonto = document.getElementById("lblMontoDeuda");
    const btn = document.getElementById("btnAccionFinanzas");

    if (!card) return;
    const token = localStorage.getItem("tokenEscuela");

    try {
        const response = await fetch(`${API_BASE_URL}/Pensiones/MisPagos`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            let pensiones = await response.json();
            const vencidos = pensiones.filter(p => (p.estado || "").toUpperCase() === "VENCIDO");
            const siguientePendiente = pensiones.find(p => (p.estado || "").toUpperCase() === "PENDIENTE");

            loader.style.display = "none";
            content.style.display = "block";

            card.parentElement.classList.remove("bg-danger-subtle", "bg-warning-subtle", "bg-success-subtle");
            icon.classList.remove("text-danger", "text-warning", "text-success", "text-primary");
            btn.className = "btn btn-sm w-100 rounded-pill fw-medium";

            if (vencidos.length > 0) {
                const totalVencido = vencidos.reduce((acc, curr) => acc + curr.totalAPagar, 0);
                card.parentElement.classList.add("bg-danger-subtle");

                icon.className = "fa-regular fa-circle-xmark fs-1 mb-2 text-danger";
                lblEstado.innerText = "Pagos Pendientes";
                lblEstado.className = "fw-bold mb-0 text-danger";

                lblMonto.innerText = `Total: S/ ${totalVencido.toFixed(2)}`;

                btn.classList.add("btn-danger");
                btn.innerText = "Regularizar";

            } else if (siguientePendiente) {
                card.parentElement.classList.add("bg-warning-subtle");

                icon.className = "fa-regular fa-clock fs-1 mb-2 text-warning";
                lblEstado.innerText = "Próximo Vencimiento";
                lblEstado.className = "fw-bold mb-0 text-dark";

                lblMonto.innerText = `${siguientePendiente.fechaVencimiento} - S/ ${siguientePendiente.totalAPagar.toFixed(2)}`;

                btn.classList.add("btn-warning", "text-white");
                btn.innerText = "Ver detalle";

            } else {
                card.parentElement.classList.add("bg-success-subtle");

                icon.className = "fa-regular fa-circle-check fs-1 mb-2 text-success";
                lblEstado.innerText = "Estás al día";
                lblEstado.className = "fw-bold mb-0 text-success";

                lblMonto.innerText = "Sin deudas pendientes";

                btn.classList.add("btn-outline-success");
                btn.innerText = "Historial de Pagos";
            }
        }
    } catch (error) {
        console.error(error);
    }
}

async function cargarComunicados() {
    const container = document.getElementById("lista-comunicados");
    const token = localStorage.getItem("tokenEscuela");
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE_URL}/Comunicados`, { headers: { "Authorization": `Bearer ${token}` } });

        if (response.ok) {
            todosLosComunicados = await response.json();
            const ultimos = todosLosComunicados.slice(0, 3);

            if (ultimos.length === 0) {
                container.innerHTML = '<p class="text-center text-muted py-4 small">No hay avisos recientes.</p>';
                return;
            }

            let html = "";
            ultimos.forEach((c, index) => {
                html += `
                <div class="comunicado-item" onclick="verDetalleComunicado(${index})">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="fw-bold text-primary" style="font-size:0.75rem;">${c.autor}</span>
                        <small class="text-muted" style="font-size:0.7rem;">${c.fecha.split(' ')[0]}</small>
                    </div>
                    <h6 class="mb-1 text-dark fw-bold text-truncate" style="font-size:0.9rem;">${c.titulo}</h6>
                    <p class="mb-0 text-muted small text-truncate">${c.contenido}</p>
                </div>`;
            });
            container.innerHTML = html;
        }
    } catch (error) { console.error(error); }
}

function verDetalleComunicado(index) {
    const c = todosLosComunicados[index];
    if (!c) return;
    document.getElementById("modalTitulo").innerText = c.titulo;
    document.getElementById("modalContenido").innerText = c.contenido;
    document.getElementById("modalAutor").innerText = c.autor;
    document.getElementById("modalFecha").innerText = c.fecha;
    new bootstrap.Modal(document.getElementById('modalComunicado')).show();
}

function abrirHistorialComunicados() {
    renderizarListaHistorial(todosLosComunicados);
    new bootstrap.Modal(document.getElementById('modalHistorialComunicados')).show();
}

function renderizarListaHistorial(lista) {
    const container = document.getElementById("contenedor-historial-comunicados");
    if (!container) return;
    if (lista.length === 0) { container.innerHTML = '<div class="text-center p-4 text-muted small">Sin resultados.</div>'; return; }

    container.innerHTML = lista.map(c => `
        <div class="card mb-2 border border-light shadow-sm">
            <div class="card-body p-3">
                <div class="d-flex justify-content-between mb-2">
                    <span class="fw-bold text-primary small">${c.autor}</span>
                    <span class="text-muted small">${c.fecha}</span>
                </div>
                <h6 class="fw-bold text-dark mb-1">${c.titulo}</h6>
                <p class="text-muted small mb-0">${c.contenido}</p>
            </div>
        </div>
    `).join('');
}

function filtrarComunicadosPorFecha() {
    const fecha = document.getElementById("filtroFechaComunicado").value;
    if (!fecha) return;
    const filtrados = todosLosComunicados.filter(c => {
        const parts = c.fecha.split(' ')[0].split('/');
        return `${parts[2]}-${parts[1]}-${parts[0]}` === fecha;
    });
    renderizarListaHistorial(filtrados);
}

function limpiarFiltroComunicados() {
    document.getElementById("filtroFechaComunicado").value = "";
    renderizarListaHistorial(todosLosComunicados);
}

function normalizarTexto(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}