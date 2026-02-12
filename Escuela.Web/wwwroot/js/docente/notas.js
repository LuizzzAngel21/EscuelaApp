let todosLosCursos = [];
let cursoIdActual = null;
let seccionIdActual = 0;
let alumnosGlobal = [];
let alumnosFiltrados = [];
let estructuraGlobal = [];
let filasPorPagina = 1000;
let paginaActual = 1;

document.addEventListener("DOMContentLoaded", () => {
    configurarListeners();
    cargarDatosMaestros();
});

function configurarListeners() {
    document.getElementById("cboMateria").addEventListener("change", function () { renderizarGrados(this.value); });

    document.getElementById("cboGrado").addEventListener("change", function () {
        cursoIdActual = this.value;
        const option = this.options[this.selectedIndex];
        seccionIdActual = 0;
        cargarSecciones(option.getAttribute("data-grado-id"), false);
    });

    document.getElementById("cboSeccion").addEventListener("change", function () {
        seccionIdActual = parseInt(this.value);
        cargarSabana();
    });

    document.getElementById("txtBuscarAlumno").addEventListener("keyup", aplicarFiltrosLocales);

    document.getElementById("cboMostrarFilas").addEventListener("change", function () {
        filasPorPagina = this.value === "Todos" ? 10000 : parseInt(this.value);
        paginaActual = 1;
        renderizarPaginado();
    });

    document.getElementById("btnPrevPage").addEventListener("click", () => {
        if (paginaActual > 1) { paginaActual--; renderizarPaginado(); }
    });
    document.getElementById("btnNextPage").addEventListener("click", () => {
        const total = Math.ceil(alumnosFiltrados.length / filasPorPagina);
        if (paginaActual < total) { paginaActual++; renderizarPaginado(); }
    });
}

async function cargarDatosMaestros() {
    const token = localStorage.getItem("tokenEscuela");
    try {
        const res = await fetch(`${API_BASE_URL}/Cursos`, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
            todosLosCursos = await res.json();
            if (todosLosCursos.length === 0) { mostrarEstadoCritico("No tienes cursos asignados."); return; }

            const materiasSet = new Set();
            todosLosCursos.forEach(c => materiasSet.add(c.nombre.split(' - ')[0].trim()));

            const cbo = document.getElementById("cboMateria");
            let html = "<option selected disabled value=''>Seleccione...</option>";
            [...materiasSet].sort().forEach(n => html += `<option value="${n}">${n}</option>`);
            cbo.innerHTML = html;

            const urlParams = new URLSearchParams(window.location.search);
            const cursoPreseleccionadoId = urlParams.get('cursoId');
            if (cursoPreseleccionadoId) preseleccionarCurso(cursoPreseleccionadoId);
        }
    } catch (e) { console.error("Error cargando cursos", e); }
}

function preseleccionarCurso(cursoId) {
    const cursoTarget = todosLosCursos.find(c => c.id == cursoId);
    if (!cursoTarget) return;
    const nombreMateria = cursoTarget.nombre.split(' - ')[0].trim();
    const cboMateria = document.getElementById("cboMateria");
    cboMateria.value = nombreMateria;
    renderizarGrados(nombreMateria, cursoId);
}

function renderizarGrados(nombreMateria, cursoIdParaSeleccionar = null) {
    const cbo = document.getElementById("cboGrado");
    const filtrados = todosLosCursos.filter(c => c.nombre.startsWith(nombreMateria));
    filtrados.sort((a, b) => a.nombreGrado.localeCompare(b.nombreGrado));
    let html = "<option selected disabled value=''>Seleccione Grado...</option>";
    let gradoIdDelCurso = null;

    filtrados.forEach(c => {
        let txt = c.nombre.split(' - ')[1]?.trim() || c.nombreGrado;
        html += `<option value="${c.id}" data-grado-id="${c.gradoId}">${txt}</option>`;
        if (cursoIdParaSeleccionar && c.id == cursoIdParaSeleccionar) gradoIdDelCurso = c.gradoId;
    });

    cbo.innerHTML = html;
    cbo.disabled = false;

    if (cursoIdParaSeleccionar && gradoIdDelCurso) {
        cbo.value = cursoIdParaSeleccionar;
        cursoIdActual = cursoIdParaSeleccionar;
        cargarSecciones(gradoIdDelCurso, true);
    } else {
        document.getElementById("cboSeccion").innerHTML = "<option>Seleccione Grado</option>";
        document.getElementById("cboSeccion").disabled = true;
    }
}

async function cargarSecciones(gradoId, autoseleccionarPrimera = false) {
    const token = localStorage.getItem("tokenEscuela");
    const cbo = document.getElementById("cboSeccion");
    cbo.innerHTML = "<option>Cargando...</option>";
    cbo.disabled = true;

    try {
        const res = await fetch(`${API_BASE_URL}/Secciones/Grado/${gradoId}`, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
            const secs = await res.json();
            let html = `<option value="0" ${!autoseleccionarPrimera ? 'selected' : ''}>Todas las secciones</option>`;
            secs.forEach((s, index) => {
                const isSelected = (autoseleccionarPrimera && index === 0) ? 'selected' : '';
                html += `<option value="${s.id}" ${isSelected}>${s.nombre}</option>`;
                if (autoseleccionarPrimera && index === 0) seccionIdActual = s.id;
            });
            cbo.innerHTML = html;
            cbo.disabled = false;

            if (autoseleccionarPrimera && secs.length > 0) cargarSabana();
            else if (autoseleccionarPrimera && secs.length === 0) { seccionIdActual = 0; cargarSabana(); }
        }
    } catch (e) { cbo.innerHTML = "<option>Error de carga</option>"; }
}

async function cargarSabana() {
    const token = localStorage.getItem("tokenEscuela");
    const tabla = document.getElementById("contenedorTabla");
    const bienvenida = document.getElementById("panelBienvenida");
    const estado = document.getElementById("panelEstado");
    const footer = document.getElementById("footerControles");
    const buscar = document.getElementById("txtBuscarAlumno");

    tabla.style.display = "none";
    bienvenida.style.display = "none";
    footer.style.display = "none";
    buscar.disabled = true;
    estado.style.display = "block";
    estado.innerHTML = `<div class="py-5"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted small fw-bold">CARGANDO REGISTRO...</p></div>`;

    try {
        const res = await fetch(`${API_BASE_URL}/Notas/Sabana?cursoId=${cursoIdActual}&seccionId=${seccionIdActual}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error();

        const data = await res.json();
        estructuraGlobal = data.estructura;
        alumnosGlobal = data.alumnos;

        document.getElementById("btnConfigurar").href = `/Docente/Aula?cursoId=${cursoIdActual}`;
        document.getElementById("panelConfiguracion").style.display = "block";

        if (!estructuraGlobal || estructuraGlobal.length === 0) {
            estado.innerHTML = `<div class="py-5"><i class="fa-solid fa-clipboard-list fa-3x text-secondary mb-3"></i><h4 class="fw-bold text-dark">Sin Criterios</h4><p class="text-muted mb-3">Configure la evaluación.</p><a href="/Docente/Aula?cursoId=${cursoIdActual}" class="btn btn-outline-primary rounded-pill px-4 fw-bold">Configurar</a></div>`;
            return;
        }

        if (alumnosGlobal.length === 0) {
            estado.innerHTML = `<div class="py-5 text-muted"><i class="fa-regular fa-folder-open fa-2x mb-2"></i><p>No se encontraron alumnos.</p></div>`;
            return;
        }

        estado.style.display = "none";
        tabla.style.display = "block";
        footer.style.display = "block";
        buscar.disabled = false;

        renderizarCabeceras(estructuraGlobal);
        aplicarFiltrosLocales();

    } catch (e) {
        console.error(e);
        estado.innerHTML = `<div class="alert alert-danger d-inline-block mt-4 px-4">Error al cargar datos.</div>`;
    }
}

function aplicarFiltrosLocales() {
    const txt = document.getElementById("txtBuscarAlumno").value.toLowerCase();
    alumnosFiltrados = txt === "" ? alumnosGlobal : alumnosGlobal.filter(a => a.estudianteNombre.toLowerCase().includes(txt));
    paginaActual = 1;
    renderizarPaginado();
}

function renderizarPaginado() {
    const tBody = document.getElementById("bodyAlumnos");
    const containerPag = document.getElementById("paginacionContainer");
    const totalRegistros = alumnosFiltrados.length;

    if (totalRegistros === 0) {
        tBody.innerHTML = `<tr><td colspan="20" class="text-center py-5 text-muted">No se encontraron coincidencias.</td></tr>`;
        document.getElementById("lblContadorFilas").innerText = "0 estudiantes";
        containerPag.style.display = "none";
        return;
    }

    const totalPaginas = Math.ceil(totalRegistros / filasPorPagina);
    const inicio = (paginaActual - 1) * filasPorPagina;
    const fin = inicio + filasPorPagina;
    const alumnosEnPagina = alumnosFiltrados.slice(inicio, fin);

    let html = "";
    alumnosEnPagina.forEach((alum, index) => html += generarHtmlFila(alum, inicio + index + 1));
    tBody.innerHTML = html;

    document.getElementById("lblContadorFilas").innerText = `Mostrando ${inicio + 1} - ${Math.min(fin, totalRegistros)} de ${totalRegistros} estudiantes`;

    if (filasPorPagina >= 1000 || totalPaginas <= 1) {
        containerPag.style.display = "none";
    } else {
        containerPag.style.display = "flex";
        document.getElementById("btnPrevPage").disabled = (paginaActual === 1);
        document.getElementById("btnNextPage").disabled = (paginaActual === totalPaginas);
        const divNumeros = document.getElementById("paginasNumeros");
        let htmlNums = "";
        for (let i = 1; i <= totalPaginas; i++) {
            const activeClass = i === paginaActual ? "bg-secondary text-white border-secondary" : "bg-white text-dark border";
            htmlNums += `<button class="btn btn-sm ${activeClass}" onclick="irAPagina(${i})">${i}</button>`;
        }
        divNumeros.innerHTML = htmlNums;
    }
}

function irAPagina(num) {
    paginaActual = num;
    renderizarPaginado();
}

function generarAcronimo(texto) {
    const limpio = texto.trim().toUpperCase();
    if (limpio.length <= 4) return limpio;
    const palabras = limpio.split(' ');
    let siglas = "";
    palabras.forEach(p => { if (!isNaN(p)) siglas += p; else siglas += p.charAt(0); });
    if (siglas.length < 2 && palabras.length === 1) return limpio.substring(0, 3);
    return siglas;
}

function renderizarCabeceras(estructura) {
    const tP = document.getElementById("rowHeaderPeriodos");
    const tC = document.getElementById("rowHeaderCriterios");

    let hP = `<th rowspan="2" class="col-sticky-left ps-4 align-middle bg-white shadow-sm" style="z-index:50;">
                <div class="d-flex align-items-center text-secondary">
                    <span class="me-3 small text-muted">N°</span>
                    <span class="small fw-bold text-dark">APELLIDOS Y NOMBRES</span>
                </div>
              </th>`;
    let hC = ``;

    estructura.forEach(p => {
        hP += `<th colspan="${p.criterios.length + 1}" class="text-center border-start py-2 bg-light text-secondary small fw-bold">${p.nombre.toUpperCase()}</th>`;
        p.criterios.forEach(c => {
            let corto = generarAcronimo(c.nombre);
            hC += `<th class="text-center border-start fw-bold text-secondary bg-white" title="${c.nombre} (Peso: ${Math.round(c.peso * 100)}%)" style="min-width: 60px; cursor: help;">${corto}</th>`;
        });
        hC += `<th class="text-center fw-bold text-dark bg-light border-start small" style="min-width:60px;">PROM</th>`;
    });

    hP += `<th rowspan="2" class="text-center align-middle header-final-institutional border-start" style="min-width:70px;">FINAL</th>`;

    tP.innerHTML = hP;
    tC.innerHTML = hC;
}

function generarHtmlFila(alum, index) {
    let nombre = alum.estudianteNombre;
    if (nombre.includes("Del ")) { const p = nombre.split(','); if (p.length > 1) nombre = p[1].trim() + " " + p[0].trim(); }

    let tr = `<tr data-matricula="${alum.matriculaId}" class="fila-alumno bg-white">
                <td class="col-sticky-left ps-4 py-2">
                    <div class="d-flex align-items-center">
                        <span class="text-muted small me-3 fw-bold" style="width:25px;">${index}</span>
                        <span class="nombre-alumno-text fw-bold" title="${nombre}">${nombre}</span>
                    </div>
                </td>`;

    estructuraGlobal.forEach(p => {
        let suma = 0, pesoTotal = 0;
        p.criterios.forEach(c => {
            const nota = alum.notas.find(n => n.criterioId === c.id);
            const val = nota ? nota.valor : "";
            let colorClase = "";
            if (val !== "") colorClase = val < 11 ? "texto-rojo" : "texto-azul";

            tr += `<td class="p-1 border-start text-center" style="min-width:60px;">
                    <input type="number" class="input-nota-elegant ${colorClase}" value="${val}" 
                           data-criterio="${c.id}" data-peso="${c.peso}" data-periodo="${p.numeroPeriodo}"
                           step="0.1" min="0" max="20" onblur="validarYCalcular(this)">
                   </td>`;

            let valorNumerico = val === "" ? 0 : parseFloat(val);
            suma += valorNumerico * c.peso;
            pesoTotal += c.peso;
        });

        const prom = pesoTotal > 0 ? suma / pesoTotal : 0;
        const cProm = prom < 11 ? "texto-rojo" : "texto-azul";
        const tProm = pesoTotal > 0 ? prom.toFixed(1) : "-";

        tr += `<td class="text-center border-start fw-bold small bg-light ${cProm}" style="min-width:60px;" id="prom-p${p.numeroPeriodo}-m${alum.matriculaId}">${tProm}</td>`;
    });

    const f = alum.promedioFinalAnual;
    const cF = f < 11 ? "texto-rojo" : "texto-azul";
    tr += `<td class="text-center fw-bold border-start bg-light ${cF}" style="min-width:70px;" id="prom-final-m${alum.matriculaId}">${f.toFixed(1)}</td></tr>`;

    return tr;
}

function validarYCalcular(input) {
    let val = parseFloat(input.value);
    input.classList.remove("texto-rojo", "texto-azul");
    if (isNaN(val)) {
        input.value = "";
    } else {
        if (val < 0) val = 0;
        if (val > 20) val = 20;
        input.value = parseFloat(val).toFixed(1);
        if (val < 11) input.classList.add("texto-rojo");
        else input.classList.add("texto-azul");
    }
    recalcularFila(input);
}

function recalcularFila(input) {
    const tr = input.closest("tr");
    const matId = tr.dataset.matricula;
    const pId = input.dataset.periodo;
    const inputsBimestre = tr.querySelectorAll(`input[data-periodo="${pId}"]`);
    let suma = 0, pesoTotal = 0;
    inputsBimestre.forEach(i => {
        let valor = i.value === "" ? 0 : parseFloat(i.value);
        let peso = parseFloat(i.dataset.peso);
        suma += valor * peso;
        pesoTotal += peso;
    });
    const tdProm = document.getElementById(`prom-p${pId}-m${matId}`);
    if (pesoTotal > 0) {
        const prom = suma / pesoTotal;
        tdProm.innerText = prom.toFixed(1);
        tdProm.className = `text-center border-start fw-bold small bg-light ${prom < 11 ? "texto-rojo" : "texto-azul"}`;
    }
    const proms = tr.querySelectorAll(`td[id^="prom-p"]`);
    let sF = 0, cF = 0;
    proms.forEach(p => {
        let val = parseFloat(p.innerText);
        if (!isNaN(val)) { sF += val; cF++; }
    });
    const tdF = document.getElementById(`prom-final-m${matId}`);
    if (cF > 0) {
        const f = sF / cF;
        tdF.innerText = f.toFixed(1);
        tdF.className = `text-center fw-bold border-start bg-light ${f < 11 ? "texto-rojo" : "texto-azul"}`;
    }
}

async function guardarNotasMasivas() {
    const btn = document.getElementById("btnGuardar");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`;

    const payload = [];
    document.querySelectorAll(".fila-alumno").forEach(tr => {
        const m = tr.dataset.matricula;
        tr.querySelectorAll("input").forEach(i => {
            if (i.value !== "") {
                payload.push({
                    matriculaId: parseInt(m),
                    criterioId: parseInt(i.dataset.criterio),
                    valor: parseFloat(i.value)
                });
            }
        });
    });

    if (payload.length === 0) {
        alert("No hay notas válidas para guardar.");
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
    }

    try {
        const token = localStorage.getItem("tokenEscuela");
        const res = await fetch(`${API_BASE_URL}/Notas/Masiva`, {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            mostrarToast();
        } else {
            const errorTxt = await res.text();
            alert("Error al guardar: " + errorTxt);
        }
    } catch (e) {
        console.error(e);
        alert("Error de conexión.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-floppy-disk me-2"></i>Guardar Cambios`;
    }
}

function mostrarToast() {
    const container = document.getElementById('toastContainer');
    const toastEl = document.getElementById('toastNotificacion');

    if (container && toastEl) {
        container.classList.remove('d-none');

        setTimeout(() => {
            toastEl.classList.add('show');
        }, 10);

        setTimeout(() => {
            toastEl.classList.remove('show');

            setTimeout(() => {
                container.classList.add('d-none');
            }, 300);

        }, 3000);
    }
}

function mostrarEstadoCritico(msg) {
    document.getElementById("contenedorTabla").style.display = "none";
    document.getElementById("panelEstado").style.display = "block";
    document.getElementById("panelEstado").innerHTML = `<div class="alert alert-danger px-5 shadow-sm border-0">${msg}</div>`;
}