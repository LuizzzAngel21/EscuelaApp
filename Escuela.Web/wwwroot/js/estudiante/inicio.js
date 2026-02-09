let todosLosComunicados = []; 

document.addEventListener("DOMContentLoaded", () => {
    mostrarFechaHoy();
    cargarHorarioHoy();
    cargarEstadoFinanciero();
    cargarComunicados();
});

/* Fecha actual */
function mostrarFechaHoy() {
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha = new Date().toLocaleDateString('es-ES', opciones);
    const lbl = document.getElementById("lblFechaHoy");
    if (lbl) lbl.innerText = fecha.charAt(0).toUpperCase() + fecha.slice(1);
}

/* Horario del día */
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

            const horariosHoy = todosHorarios.filter(h =>
                normalizarTexto(h.dia) === normalizarTexto(diaHoy)
            );

            horariosHoy.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

            if (horariosHoy.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fa-solid fa-mug-hot text-muted fs-1 mb-3"></i>
                        <p class="text-muted">¡Día libre! No tienes clases programadas hoy.</p>
                    </div>`;
                return;
            }

            let html = "";
            const ahora = new Date();
            const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

            horariosHoy.forEach(h => {
                const [hInicio, mInicio] = h.horaInicio.split(':').map(Number);
                const [hFin, mFin] = h.horaFin.split(':').map(Number);

                const minutosInicio = hInicio * 60 + mInicio;
                const minutosFin = hFin * 60 + mFin;

                let estadoClass = "future";
                let badgeHtml = `<span class="badge bg-light text-dark border">${h.horaInicio} - ${h.horaFin}</span>`;

                if (minutosFin < minutosAhora) {
                    estadoClass = "past";
                    badgeHtml = `<span class="badge bg-secondary opacity-50">Finalizado</span>`;
                } else if (minutosInicio <= minutosAhora && minutosFin >= minutosAhora) {
                    estadoClass = "current";
                    badgeHtml = `<span class="badge bg-danger animate__animated animate__pulse animate__infinite">En Curso • Termina ${h.horaFin}</span>`;
                }

                const docenteHtml = h.docente
                    ? `<i class="fa-solid fa-chalkboard-user me-1"></i> ${h.docente} <span class="mx-2">•</span>`
                    : ``;

                html += `
                <div class="timeline-item ${estadoClass}">
                    <div class="timeline-dot"></div>
                    <div class="card border border-light shadow-sm">
                        <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h6 class="fw-bold text-primary mb-0">${h.curso}</h6>
                                ${badgeHtml}
                            </div>
                            <div class="small text-muted">
                                ${docenteHtml}
                                <i class="fa-solid fa-door-open me-1"></i> ${h.grado || 'Aula General'}
                            </div>
                            ${estadoClass === 'current'
                        ? '<button class="btn btn-primary btn-sm mt-2 w-100"><i class="fa-solid fa-video me-2"></i>Entrar al Aula Virtual</button>'
                        : ''}
                        </div>
                    </div>
                </div>`;
            });

            container.innerHTML = html;
        } else {
            container.innerHTML = `<p class="text-danger text-center">No se pudo cargar el horario.</p>`;
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="text-danger text-center">Error de conexión.</p>`;
    }
}

/* Estado Financiero */
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
            icon.classList.remove("text-danger", "text-warning", "text-success");
            lblEstado.classList.remove("text-danger", "text-dark", "text-success");

            if (vencidos.length > 0) {
                const totalVencido = vencidos.reduce((acc, curr) => acc + curr.totalAPagar, 0);

                card.parentElement.classList.add("bg-danger-subtle");
                icon.className = "fa-solid fa-circle-exclamation display-4 text-danger";
                lblEstado.innerText = "Pagos Vencidos";
                lblEstado.classList.add("fw-bold", "mb-0", "text-danger");
                lblMonto.innerText = `S/ ${totalVencido.toFixed(2)}`;
                btn.className = "btn btn-danger btn-sm w-100 rounded-pill fw-medium";
                btn.innerText = "Pagar Vencidos";

            } else if (siguientePendiente) {
                card.parentElement.classList.add("bg-warning-subtle");
                icon.className = "fa-regular fa-clock display-4 text-warning";
                lblEstado.innerText = `Vence: ${siguientePendiente.fechaVencimiento}`;
                lblEstado.classList.add("fw-bold", "mb-0", "text-dark");
                lblEstado.style.fontSize = "0.85rem";
                lblMonto.innerText = `S/ ${siguientePendiente.totalAPagar.toFixed(2)}`;
                btn.className = "btn btn-warning btn-sm w-100 rounded-pill fw-medium text-white";
                btn.innerText = "Pagar Mensualidad";

            } else {
                card.parentElement.classList.add("bg-success-subtle");
                icon.className = "fa-solid fa-shield-check display-4 text-success";
                lblEstado.innerText = "Estás al día";
                lblEstado.classList.add("fw-bold", "mb-0", "text-success");
                lblMonto.innerText = "Sin deuda";
                btn.className = "btn btn-outline-success btn-sm w-100 rounded-pill fw-medium";
                btn.innerText = "Ver Historial";
            }
        }
    } catch (error) {
        console.error("Error finanzas", error);
    }
}

async function cargarComunicados() {
    const container = document.getElementById("lista-comunicados");
    const token = localStorage.getItem("tokenEscuela");
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE_URL}/Comunicados`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

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
                <div class="list-group-item px-3 py-3 border-0 border-bottom comunicado-card cursor-pointer"
                     onclick="verDetalleComunicado(${index})">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10">${c.autor}</span>
                        <small class="text-muted">${c.fecha.split(' ')[0]}</small>
                    </div>
                    <h6 class="mb-1 text-dark fw-semibold text-truncate">${c.titulo}</h6>
                    <p class="mb-0 text-muted small text-truncate">${c.contenido}</p>
                </div>`;
            });
            container.innerHTML = html;
        }
    } catch (error) {
        console.error("Error al cargar comunicados:", error);
    }
}

function verDetalleComunicado(index) {
    const c = todosLosComunicados[index];
    if (!c) return;

    document.getElementById("modalTitulo").innerText = c.titulo;
    document.getElementById("modalContenido").innerText = c.contenido;
    document.getElementById("modalAutor").innerText = c.autor;
    document.getElementById("modalFecha").innerText = c.fecha;

    const myModal = new bootstrap.Modal(document.getElementById('modalComunicado'));
    myModal.show();
}

// funciones del modal

function abrirHistorialComunicados() {
    renderizarListaHistorial(todosLosComunicados);
    const myModal = new bootstrap.Modal(document.getElementById('modalHistorialComunicados'));
    myModal.show();
}

function renderizarListaHistorial(lista) {
    const container = document.getElementById("contenedor-historial-comunicados");
    if (!container) return;

    if (lista.length === 0) {
        container.innerHTML = '<div class="text-center p-5 text-muted">No se encontraron comunicados con los criterios de búsqueda.</div>';
        return;
    }

    container.innerHTML = lista.map(c => `
        <div class="card mb-3 border-0 shadow-sm">
            <div class="card-body">
                <div class="d-flex justify-content-between border-bottom pb-2 mb-2">
                    <span class="fw-bold text-primary"><i class="fa-solid fa-user-pen me-2"></i>${c.autor}</span>
                    <span class="badge bg-light text-dark">${c.fecha}</span>
                </div>
                <h6 class="fw-bold text-dark">${c.titulo}</h6>
                <p class="text-muted small mb-0" style="white-space: pre-wrap;">${c.contenido}</p>
            </div>
        </div>
    `).join('');
}

function filtrarComunicadosPorFecha() {
    const fechaBusqueda = document.getElementById("filtroFechaComunicado").value;
    if (!fechaBusqueda) return;

    const filtrados = todosLosComunicados.filter(c => {
        const [dia, mes, anio] = c.fecha.split(' ')[0].split('/');
        const fechaFormateada = `${anio}-${mes}-${dia}`;
        return fechaFormateada === fechaBusqueda;
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
