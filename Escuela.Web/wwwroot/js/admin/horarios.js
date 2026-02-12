const bloquesHorarios = [
    { inicio: "08:00", fin: "08:45", tipo: "clase" },
    { inicio: "08:45", fin: "09:30", tipo: "clase" },
    { inicio: "09:30", fin: "10:15", tipo: "clase" },
    { inicio: "10:15", fin: "10:45", tipo: "recreo", label: "R E C R E O" },
    { inicio: "10:45", fin: "11:30", tipo: "clase" },
    { inicio: "11:30", fin: "12:15", tipo: "clase" },
    { inicio: "12:15", fin: "13:00", tipo: "clase" }
];

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
let horariosData = [];

document.addEventListener("DOMContentLoaded", () => {
    cargarGrados();

    const cboGrado = document.getElementById("cboGrado");
    const cboSeccion = document.getElementById("cboSeccion");
    const btnCargar = document.getElementById("btnCargar");

    cboGrado.addEventListener("change", async (e) => {
        if (e.target.value) {
            await cargarSecciones(e.target.value);
            cboSeccion.disabled = false;
            btnCargar.disabled = true;
        } else {
            cboSeccion.innerHTML = '<option value="">Primero elija un grado</option>';
            cboSeccion.disabled = true;
            btnCargar.disabled = true;
        }
    });

    cboSeccion.addEventListener("change", (e) => {
        btnCargar.disabled = !e.target.value;
    });

    btnCargar.addEventListener("click", cargarCalendario);
    document.getElementById("formAsignar").addEventListener("submit", guardarHorario);
});

async function cargarGrados() {
    const token = localStorage.getItem("tokenEscuela");
    try {
        const res = await fetch(`${API_BASE_URL}/Grados`, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
            const grados = await res.json();
            let html = '<option value="">Seleccione Grado...</option>';
            grados.forEach(g => html += `<option value="${g.id}">${g.nombre} - ${g.nivel}</option>`);
            document.getElementById("cboGrado").innerHTML = html;
        }
    } catch (e) { console.error(e); }
}

async function cargarSecciones(gradoId) {
    const token = localStorage.getItem("tokenEscuela");
    try {
        const res = await fetch(`${API_BASE_URL}/Secciones/Grado/${gradoId}`, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
            const secciones = await res.json();
            let html = '<option value="">Seleccione Sección...</option>';
            secciones.forEach(s => html += `<option value="${s.id}" data-nombre="${s.nombre}">${s.nombre} (Cap: ${s.capacidad})</option>`);
            document.getElementById("cboSeccion").innerHTML = html;
        }
    } catch (e) { console.error(e); }
}

async function cargarCursosParaModal(gradoId) {
    const token = localStorage.getItem("tokenEscuela");
    const cboCurso = document.getElementById("cboCurso");

    try {
        cboCurso.innerHTML = '<option value="">Buscando cursos...</option>';

        const res = await fetch(`${API_BASE_URL}/Horarios?gradoId=${gradoId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
            const horarios = await res.json();

            const cursosMap = new Map();
            horarios.forEach(h => {
                if (h.cursoId && !cursosMap.has(h.cursoId)) {
                    cursosMap.set(h.cursoId, {
                        id: h.cursoId,
                        nombre: h.curso,
                        docente: h.docente
                    });
                }
            });

            if (cursosMap.size === 0) {
                cboCurso.innerHTML = '<option value="">No hay cursos configurados para este grado</option>';
                return;
            }

            let html = '<option value="">Seleccione un curso...</option>';
            cursosMap.forEach(c => {
                html += `<option value="${c.id}">${c.nombre} — ${c.docente}</option>`;
            });
            cboCurso.innerHTML = html;
        } else {
            cboCurso.innerHTML = '<option value="">Error al obtener catálogo</option>';
        }
    } catch (e) {
        console.error("Error en la carga de cursos:", e);
        cboCurso.innerHTML = '<option value="">Error de conexión</option>';
    }
}
async function cargarCalendario() {
    const gradoId = document.getElementById("cboGrado").value;
    const seccionSelect = document.getElementById("cboSeccion");
    const seccionId = seccionSelect.value;
    const seccionNombre = seccionSelect.options[seccionSelect.selectedIndex].dataset.nombre;
    const gradoNombre = document.getElementById("cboGrado").options[document.getElementById("cboGrado").selectedIndex].text;

    document.getElementById("lblAulaActual").innerText = `${gradoNombre} - Sección "${seccionNombre}"`;
    const tbody = document.getElementById("tbodyHorario");
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-5"><div class="spinner-border text-primary"></div></td></tr>';
    document.getElementById("contenedorCalendario").style.display = "block";

    const token = localStorage.getItem("tokenEscuela");
    try {
        const res = await fetch(`${API_BASE_URL}/Horarios?gradoId=${gradoId}`, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
            const todosLosHorarios = await res.json();

            horariosData = todosLosHorarios.filter(h => h.grado.includes(seccionNombre));

            renderizarGrid();
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar el horario.</td></tr>';
    }
}

function renderizarGrid() {
    const tbody = document.getElementById("tbodyHorario");
    let html = "";

    bloquesHorarios.forEach(bloque => {
        if (bloque.tipo === "recreo") {
            html += `<tr class="recreo-row"><td class="time-col">${bloque.inicio} - ${bloque.fin}</td><td colspan="5">${bloque.label}</td></tr>`;
            return;
        }

        html += `<tr><td class="time-col">${bloque.inicio} - ${bloque.fin}</td>`;

        diasSemana.forEach(dia => {
            const clase = horariosData.find(h => h.dia === dia && h.horaInicio === bloque.inicio);

            if (clase) {
                html += `
                <td>
                    <div class="class-card animate__animated animate__zoomIn">
                        <button class="btn-delete-class" onclick="eliminarHorario(${clase.id})" title="Eliminar clase">
                            <i class="fa-solid fa-times"></i>
                        </button>
                        <div class="curso">${clase.curso}</div>
                        <div class="docente"><i class="fa-solid fa-user-tie me-1"></i>${clase.docente}</div>
                    </div>
                </td>`;
            } else {
                html += `
                <td>
                    <button class="btn-add-class" onclick="abrirModalAsignacion('${dia}', '${bloque.inicio}', '${bloque.fin}')" title="Asignar clase aquí">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </td>`;
            }
        });
        html += `</tr>`;
    });

    tbody.innerHTML = html;
}

async function abrirModalAsignacion(dia, inicio, fin) {
    const lblDia = document.getElementById("txtDiaLabel");
    const lblHora = document.getElementById("txtHoraLabel");

    if (lblDia) lblDia.innerText = dia;
    if (lblHora) lblHora.innerText = `${inicio} - ${fin}`;

    const hdnDia = document.getElementById("hdnDia");
    const hdnInicio = document.getElementById("hdnHoraInicio");
    const hdnFin = document.getElementById("hdnHoraFin");

    if (hdnDia) hdnDia.value = dia;
    if (hdnInicio) hdnInicio.value = inicio;
    if (hdnFin) hdnFin.value = fin;

    const gradoId = document.getElementById("cboGrado").value;
    await cargarCursosParaModal(gradoId);

    const modalElement = document.getElementById("modalAsignar");
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
}
async function guardarHorario(e) {
    e.preventDefault();
    const token = localStorage.getItem("tokenEscuela");

  
    const payload = {
        diaSemana: document.getElementById("hdnDia").value,
        horaInicio: document.getElementById("hdnHoraInicio").value,
        horaFin: document.getElementById("hdnHoraFin").value,
        cursoId: parseInt(document.getElementById("cboCurso").value),
        seccionId: parseInt(document.getElementById("cboSeccion").value)
    };

    if (!payload.cursoId) {
        Swal.fire("Atención", "Debe seleccionar un curso", "warning");
        return;
    }

    const btn = document.querySelector("#formAsignar button[type='submit']");
    const origText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';

    try {
        const res = await fetch(`${API_BASE_URL}/Horarios`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const modalElt = document.getElementById("modalAsignar");
            const modal = bootstrap.Modal.getInstance(modalElt);
            modal.hide();

            Swal.fire({
                icon: 'success',
                title: 'Clase Asignada',
                text: 'El horario se actualizó correctamente',
                showConfirmButton: false,
                timer: 1500
            });

            cargarCalendario(); 
        } else {
            const errorTxt = await res.text();
            Swal.fire("Conflicto de Horario", errorTxt.replace(/"/g, ''), "error");
        }
    } catch (error) {
        Swal.fire("Error", "No se pudo conectar con el servidor", "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = origText;
    }
}
async function eliminarHorario(id) {
    if (!confirm("¿Está seguro de quitar esta clase del horario?")) return;

    const token = localStorage.getItem("tokenEscuela");
    try {
        const res = await fetch(`${API_BASE_URL}/Horarios/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
            cargarCalendario(); 
        } else {
            Swal.fire("Error", "No se pudo eliminar", "error");
        }
    } catch (error) {
        Swal.fire("Error", "Problema de red", "error");
    }
}
