document.addEventListener("DOMContentLoaded", () => {
    initDashboard();
});

async function initDashboard() {
    const token = localStorage.getItem("tokenEscuela");
    if (!token) return;

    let nombreStored = localStorage.getItem("usuarioNombre") || "Docente";
    if (nombreStored.includes("@")) {
        nombreStored = nombreStored.split("@")[0].replace('.', ' ');
    }
    document.getElementById("lblDocenteNombre").innerText = nombreStored.charAt(0).toUpperCase() + nombreStored.slice(1);

    const opcionesFecha = { weekday: 'long', day: 'numeric', month: 'long' };
    const fechaHoy = new Date().toLocaleDateString('es-ES', opcionesFecha);
    document.getElementById("lblFechaHoy").innerText = fechaHoy.charAt(0).toUpperCase() + fechaHoy.slice(1);

    await Promise.all([
        cargarNombreRealDocente(token),
        cargarStats(token),
        cargarAgenda(token), 
        cargarAvisos(token)
    ]);
}

async function cargarNombreRealDocente(token) {
    try {
        const res = await fetch(`${API_BASE_URL}/Cursos`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            const cursos = await res.json();
            if (cursos.length > 0 && cursos[0].nombreDocente && cursos[0].nombreDocente !== "Sin Docente") {
                const nombreCompleto = cursos[0].nombreDocente;
                document.getElementById("lblDocenteNombre").innerText = nombreCompleto;
                localStorage.setItem("usuarioNombre", nombreCompleto);
            }
        }
    } catch (e) { console.warn("No se pudo obtener el nombre real.", e); }
}

async function cargarStats(token) {
    try {
        const res = await fetch(`${API_BASE_URL}/Cursos`, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
            const cursos = await res.json();
            document.getElementById("txtTotalCursos").innerText = cursos.length;
        }
    } catch (e) { console.error("Error stats:", e); }
}

async function cargarAgenda(token) {
    const contenedor = document.getElementById("contenedor-agenda");
    const contadorHoy = document.getElementById("txtClasesHoy");

    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const hoyNombre = dias[new Date().getDay()];

    try {
        const res = await fetch(`${API_BASE_URL}/Horarios`, { headers: { "Authorization": `Bearer ${token}` } });

        if (res.ok) {
            const todos = await res.json();

            const hoy = todos.filter(h => h.dia === hoyNombre)
                .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

            contadorHoy.innerText = hoy.length;

            if (hoy.length === 0) {
                contenedor.innerHTML = `
                    <div class="text-center py-5 text-muted">
                        <i class="fa-solid fa-mug-hot fa-2x mb-2 opacity-25"></i>
                        <p class="small mb-0">No tienes clases programadas para hoy.</p>
                    </div>`;
                return;
            }

            const ahora = new Date();
            const minutosAhora = (ahora.getHours() * 60) + ahora.getMinutes();

            let html = `<div class="timeline-dashboard">`;

            hoy.forEach(h => {
                const [hIni, mIni] = h.horaInicio.split(':').map(Number);
                const [hFin, mFin] = h.horaFin.split(':').map(Number);
                const minutosInicio = (hIni * 60) + mIni;
                const minutosFin = (hFin * 60) + mFin;

                let estadoItem = "";
                let badgeEstado = `<span class="badge bg-white text-primary border border-primary-subtle">PENDIENTE</span>`;
                let btnClass = "btn-outline-primary";

                if (minutosFin < minutosAhora) {
                    estadoItem = "finished";
                    badgeEstado = `<span class="badge bg-light text-muted border">FINALIZADO</span>`;
                    btnClass = "btn-outline-secondary";
                } else if (minutosInicio <= minutosAhora && minutosFin >= minutosAhora) {
                    estadoItem = "live";
                    badgeEstado = `<span class="badge bg-success-subtle text-success border border-success"><i class="fa-solid fa-circle fa-beat-fade me-1" style="font-size:6px"></i>EN VIVO</span>`;
                }

                let nombreSeccion = "";
                if (h.grado && h.grado.includes("-")) {
                    const partes = h.grado.split("-");
                    nombreSeccion = partes[partes.length - 1].trim();
                }

                const paramSeccion = nombreSeccion ? `&seccionNombre=${nombreSeccion}` : "";

                let textGrado = h.grado.includes("1ro") ? "text-primary" : "text-muted";

                html += `
                <div class="timeline-item ${estadoItem}">
                    <div class="timeline-dot"></div>
                    <div class="card card-hover border-0 shadow-sm">
                        <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-muted small fw-bold"><i class="fa-regular fa-clock me-1"></i>${h.horaInicio} - ${h.horaFin}</span>
                                ${badgeEstado}
                            </div>
                            <h6 class="fw-bold text-dark mb-1">${h.curso}</h6>
                            
                            <small class="${textGrado} fw-bold text-uppercase d-block mb-3" style="font-size: 0.75rem;">${h.grado}</small>
                            
                            <div class="d-flex justify-content-end">
                                <a href="/Docente/Asistencia?cursoId=${h.cursoId || 0}${paramSeccion}" class="btn btn-sm ${btnClass} rounded-pill px-3 fw-medium" style="font-size: 0.8rem;">
                                    <i class="fa-solid fa-user-check me-2"></i>Asistencia
                                </a>
                            </div>
                        </div>
                    </div>
                </div>`;
            });

            html += `</div>`;
            contenedor.innerHTML = html;
        }
    } catch (e) {
        console.error(e);
        contenedor.innerHTML = `<p class="text-danger small text-center">Error al cargar horario.</p>`;
    }
}
async function cargarAvisos(token) {
    const lista = document.getElementById("lista-comunicados");
    try {
        const res = await fetch(`${API_BASE_URL}/Comunicados`, { headers: { "Authorization": `Bearer ${token}` } });

        if (res.ok) {
            const datos = await res.json();
            const recientes = datos.slice(0, 3);

            if (recientes.length === 0) {
                lista.innerHTML = `<li class="list-group-item text-center text-muted small py-4">No hay avisos nuevos.</li>`;
                return;
            }

            let html = "";
            recientes.forEach(c => {
                let badgeClass = "bg-light text-muted border";
                if (c.autor && (c.autor.includes("Direc") || c.autor.includes("Coord"))) {
                    badgeClass = "bg-primary-subtle text-primary border-primary-subtle";
                }

                const contenidoSafe = encodeURIComponent(c.contenido);
                const tituloSafe = encodeURIComponent(c.titulo);

                html += `
                <li class="list-group-item border-0 border-bottom py-3 list-group-item-action" 
                    onclick="verDetalleComunicado('${tituloSafe}', '${c.fecha}', '${c.autor || 'General'}', '${contenidoSafe}')"
                    style="cursor: pointer;">
                    
                    <div class="d-flex justify-content-between mb-1">
                        <span class="badge ${badgeClass}" style="font-size: 0.6rem;">${c.autor || 'Institucional'}</span>
                        <small class="text-muted" style="font-size: 0.65rem;">${c.fecha}</small>
                    </div>
                    <h6 class="mb-1 text-dark fw-bold text-truncate" style="font-size: 0.85rem;">${c.titulo}</h6>
                    <p class="text-muted small mb-0 text-truncate">${c.contenido}</p>
                </li>`;
            });
            lista.innerHTML = html;
        }
    } catch (e) { console.error(e); }
}

function verDetalleComunicado(titulo, fecha, autor, contenido) {
    document.getElementById("modalTitulo").innerText = decodeURIComponent(titulo);
    document.getElementById("modalFecha").innerText = fecha;
    document.getElementById("modalContenido").innerText = decodeURIComponent(contenido);
    document.getElementById("modalAutor").innerText = autor;
    new bootstrap.Modal(document.getElementById("modalComunicado")).show();
}