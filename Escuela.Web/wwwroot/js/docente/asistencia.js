let cursoIdGlobal = null;
let listaAlumnosMaster = [];
let listaAlumnosFiltrada = [];
let diccionarioSecciones = {};

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    cursoIdGlobal = urlParams.get('cursoId') || document.getElementById("hdnCursoId").value;

    if (!cursoIdGlobal) {
        alert("Error: Curso no identificado.");
        window.location.href = "/Docente/Cursos";
        return;
    }

    const inputFecha = document.getElementById("txtFechaAsistencia");
    if (!inputFecha.value) inputFecha.valueAsDate = new Date();

    await Promise.all([
        cargarInfoCursoEncabezado(),
        cargarDiccionarioSecciones()
    ]);

    cargarHojaAsistencia();

    inputFecha.addEventListener("change", cargarHojaAsistencia);

    document.getElementById("cmbSeccionFilter").addEventListener("change", function () {
        aplicarFiltroSeccion(this.value);
    });
});

async function cargarInfoCursoEncabezado() {
    const token = localStorage.getItem("tokenEscuela");
    try {
        const res = await fetch(`${API_BASE_URL}/Cursos`, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
            const cursos = await res.json();
            const curso = cursos.find(c => c.id == cursoIdGlobal);
            if (curso) {
                document.getElementById("lblCursoNombre").innerText = curso.nombre || curso.curso;
                document.getElementById("lblCursoGrado").innerText = curso.nombreGrado || curso.grado || "";
            }
        }
    } catch (e) { console.error(e); }
}

async function cargarDiccionarioSecciones() {
    const token = localStorage.getItem("tokenEscuela");
    try {
        const res = await fetch(`${API_BASE_URL}/Matriculas?anio=2026`, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
            const matriculas = await res.json();
            matriculas.forEach(m => {
                diccionarioSecciones[m.id] = m.seccion || "Sin Sección";
            });
        }
    } catch (e) { console.warn("No se pudieron cargar secciones cruzadas", e); }
}

async function cargarHojaAsistencia() {
    const fecha = document.getElementById("txtFechaAsistencia").value;
    const tbody = document.getElementById("lista-asistencia");

    tbody.innerHTML = '<tr><td colspan="3" class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted">Cargando y procesando lista...</p></td></tr>';

    const token = localStorage.getItem("tokenEscuela");

    try {
        const url = `${API_BASE_URL}/Asistencias/Diaria/${cursoIdGlobal}?fecha=${fecha}`;
        const res = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });

        if (!res.ok) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger py-4">Error al cargar datos.</td></tr>';
            return;
        }

        let data = await res.json();

        listaAlumnosMaster = data.map(alumno => ({
            ...alumno,
            seccionNombre: diccionarioSecciones[alumno.matriculaId] || "Gral"
        }));

        llenarComboFiltro();

        const filtroActual = document.getElementById("cmbSeccionFilter").value;
        aplicarFiltroSeccion(filtroActual);

        actualizarEstadoVisual(data.some(x => x.yaRegistrado));

    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Error de conexión.</td></tr>';
    }
}

function llenarComboFiltro() {
    const cmb = document.getElementById("cmbSeccionFilter");

    const urlParams = new URLSearchParams(window.location.search);
    const seccionEnUrl = urlParams.get('seccionNombre');

    const secciones = [...new Set(listaAlumnosMaster.map(a => a.seccionNombre))].sort();

    let html = `<option value="">Todas</option>`;
    secciones.forEach(sec => {
        html += `<option value="${sec}">Sección ${sec}</option>`;
    });
    cmb.innerHTML = html;

    if (seccionEnUrl && secciones.includes(seccionEnUrl)) {
        cmb.value = seccionEnUrl;
    } else if (secciones.length > 0) {
        cmb.value = secciones[0];
    }
}


function aplicarFiltroSeccion(seccion) {
    if (!seccion || seccion === "") {
        listaAlumnosFiltrada = [...listaAlumnosMaster];
    } else {
        listaAlumnosFiltrada = listaAlumnosMaster.filter(a => a.seccionNombre === seccion);
    }

    const url = new URL(window.location);
    if (seccion) {
        url.searchParams.set('seccionNombre', seccion);
    } else {
        url.searchParams.delete('seccionNombre');
    }
    window.history.replaceState({}, '', url);

    renderizarTabla();
    actualizarContadores();
}

function renderizarTabla() {
    const tbody = document.getElementById("lista-asistencia");
    tbody.innerHTML = "";

    if (listaAlumnosFiltrada.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center py-5 text-muted">No hay alumnos para la sección seleccionada.</td></tr>';
        return;
    }

    let html = "";

    listaAlumnosFiltrada.forEach((alumno) => {
        const indexReal = listaAlumnosMaster.findIndex(x => x.matriculaId === alumno.matriculaId);

        const activeP = alumno.estadoId === 0 ? "active-p" : "";
        const activeT = alumno.estadoId === 1 ? "active-t" : "";
        const activeF = alumno.estadoId === 2 ? "active-f" : "";
        const activeJ = alumno.estadoId === 3 ? "active-j" : "";

        const inicial = alumno.estudianteNombre ? alumno.estudianteNombre.charAt(0) : "?";

        const badgeSeccion = `<span class="badge bg-light text-secondary border ms-2" style="font-size:0.65rem;">${alumno.seccionNombre}</span>`;

        html += `
        <tr>
            <td class="ps-4 py-2">
                <div class="d-flex align-items-center">
                    <div class="avatar-circle me-3 bg-light text-primary fw-bold border" style="width:35px; height:35px; display:flex; align-items:center; justify-content:center; border-radius:50%;">
                        ${inicial}
                    </div>
                    <div>
                        <span class="fw-bold text-dark d-block" style="font-size:0.9rem;">${alumno.estudianteNombre} ${badgeSeccion}</span>
                        <span class="small text-muted">ID: ${alumno.estudianteId || 'Mat-' + alumno.matriculaId}</span>
                    </div>
                </div>
            </td>
            <td class="text-center py-2">
                <div class="d-flex justify-content-center gap-1">
                    <button type="button" class="btn-asist ${activeP}" onclick="cambiarEstado(${indexReal}, 0)">P</button>
                    <button type="button" class="btn-asist ${activeT}" onclick="cambiarEstado(${indexReal}, 1)">T</button>
                    <button type="button" class="btn-asist ${activeF}" onclick="cambiarEstado(${indexReal}, 2)">F</button>
                    <button type="button" class="btn-asist ${activeJ}" onclick="cambiarEstado(${indexReal}, 3)">J</button>
                </div>
            </td>
            <td class="pe-4 py-2">
                <input type="text" class="form-control form-control-sm border-0 bg-light" 
                       placeholder="..."
                       value="${alumno.observacion || ''}" 
                       onchange="cambiarObservacion(${indexReal}, this.value)">
            </td>
        </tr>`;
    });

    tbody.innerHTML = html;
}

function cambiarEstado(indexReal, nuevoEstado) {
    listaAlumnosMaster[indexReal].estadoId = nuevoEstado;

    renderizarTabla();
    actualizarContadores();
}

function cambiarObservacion(indexReal, texto) {
    listaAlumnosMaster[indexReal].observacion = texto;
}

function actualizarContadores() {
    const p = listaAlumnosFiltrada.filter(x => x.estadoId === 0).length;
    const t = listaAlumnosFiltrada.filter(x => x.estadoId === 1).length;
    const f = listaAlumnosFiltrada.filter(x => x.estadoId === 2).length;
    const j = listaAlumnosFiltrada.filter(x => x.estadoId === 3).length;

    document.getElementById("count-P").innerText = p;
    document.getElementById("count-T").innerText = t;
    document.getElementById("count-F").innerText = f;
    document.getElementById("count-J").innerText = j;
}

function actualizarEstadoVisual(yaRegistrado) {
    const panel = document.getElementById("panelEstadoRegistro");
    if (yaRegistrado) {
        panel.innerHTML = '<span class="badge bg-success-subtle text-success border border-success"><i class="fa-solid fa-check me-1"></i>Registrado</span>';
    } else {
        panel.innerHTML = '<span class="badge bg-light text-secondary border"><i class="fa-regular fa-clock me-1"></i>Pendiente</span>';
    }
}

async function guardarAsistencia() {
    const btn = document.getElementById("btnGuardar");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Guardando...';

    const fecha = document.getElementById("txtFechaAsistencia").value;
    const token = localStorage.getItem("tokenEscuela");

    const payload = listaAlumnosMaster.map(a => ({
        matriculaId: a.matriculaId,
        cursoId: parseInt(cursoIdGlobal),
        estado: a.estadoId,
        observacion: a.observacion,
        fecha: fecha
    }));

    try {
        const res = await fetch(`${API_BASE_URL}/Asistencias/Masiva`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Asistencia guardada correctamente.");
            cargarHojaAsistencia();
        } else {
            const txt = await res.text();
            alert("Error al guardar: " + txt);
        }
    } catch (e) {
        console.error(e);
        alert("Error de conexión");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}