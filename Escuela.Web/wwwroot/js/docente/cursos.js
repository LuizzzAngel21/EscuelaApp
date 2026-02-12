let listaCursosGlobal = [];

document.addEventListener("DOMContentLoaded", () => {
    cargarCursos();

    const inputBuscar = document.getElementById("txtBuscarCurso");
    if (inputBuscar) {
        inputBuscar.addEventListener("keyup", (e) => {
            filtrarCursos(e.target.value);
        });
    }
});

async function cargarCursos() {
    const contenedor = document.getElementById("contenedor-cursos");
    const estadoVacio = document.getElementById("estado-vacio");
    const token = localStorage.getItem("tokenEscuela");

    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/Cursos`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const cursos = await response.json();
            listaCursosGlobal = cursos;
            renderizarTarjetas(cursos);
        } else {
            console.error("Error al obtener cursos:", response.statusText);
            contenedor.innerHTML = `<div class="col-12 text-center text-danger">Error al cargar los cursos. Intenta nuevamente.</div>`;
        }
    } catch (error) {
        console.error("Error de red:", error);
        contenedor.innerHTML = `<div class="col-12 text-center text-danger">No se pudo conectar con el servidor.</div>`;
    }
}

function renderizarTarjetas(cursos) {
    const contenedor = document.getElementById("contenedor-cursos");
    const estadoVacio = document.getElementById("estado-vacio");

    contenedor.innerHTML = "";

    if (cursos.length === 0) {
        estadoVacio.classList.remove("d-none");
        return;
    } else {
        estadoVacio.classList.add("d-none");
    }

    let html = "";

    cursos.forEach(curso => {
        let colorTema = "secondary";

        // Lógica de colores según el grado
        const gradoLower = curso.nombreGrado.toLowerCase();
        if (gradoLower.includes("1ro")) { colorTema = "primary"; }
        else if (gradoLower.includes("2do")) { colorTema = "info"; }
        else if (gradoLower.includes("3ro")) { colorTema = "success"; }
        else if (gradoLower.includes("4to")) { colorTema = "warning"; }
        else if (gradoLower.includes("5to")) { colorTema = "danger"; }

        html += `
        <div class="col-md-6 col-xl-4 fade-in">
            <div class="card h-100 border-0 shadow-sm hover-elevate">
                
                <div class="card-header border-0 py-2 bg-${colorTema} bg-opacity-10 border-top border-4 border-${colorTema}">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-${colorTema} text-white shadow-sm">
                            ${curso.nombreGrado}
                        </span>
                        </div>
                </div>

                <div class="card-body">
                    <h5 class="card-title fw-bold text-dark mb-2">${curso.nombre}</h5>
                    <p class="card-text text-muted small text-truncate-2" style="min-height: 40px;">
                        ${curso.descripcion || "Materia asignada al docente."}
                    </p>
                    
                    <hr class="my-3 opacity-25">

                    <div class="d-grid gap-2">
                        <a href="/Docente/Aula?cursoId=${curso.id}" class="btn btn-outline-${colorTema} fw-medium btn-sm d-flex align-items-center justify-content-center gap-2 py-2">
                            <i class="fa-solid fa-folder-open"></i> Aula Virtual
                        </a>
                        
                        <a href="/Docente/Asistencia?cursoId=${curso.id}" class="btn btn-light text-muted fw-medium btn-sm border d-flex align-items-center justify-content-center gap-2 py-2" title="Tomar Asistencia">
                            <i class="fa-solid fa-user-check"></i> Tomar Asistencia
                        </a>
                    </div>
                </div>
            </div>
        </div>
        `;
    });

    contenedor.innerHTML = html;
}
function filtrarCursos(texto) {
    const textoBusqueda = texto.toLowerCase().trim();

    const cursosFiltrados = listaCursosGlobal.filter(c =>
        c.nombre.toLowerCase().includes(textoBusqueda) ||
        c.nombreGrado.toLowerCase().includes(textoBusqueda)
    );

    renderizarTarjetas(cursosFiltrados);
}