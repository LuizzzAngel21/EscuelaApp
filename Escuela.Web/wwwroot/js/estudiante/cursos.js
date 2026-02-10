document.addEventListener("DOMContentLoaded", () => {
    cargarCursos();
});

async function cargarCursos() {
    const loader = document.getElementById("loaderCursos");
    const grid = document.getElementById("gridCursos");
    const emptyState = document.getElementById("emptyStateCursos");
    const token = localStorage.getItem("tokenEscuela");

    try {
        const response = await fetch(`${API_BASE_URL}/Cursos`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const cursos = await response.json();
            loader.style.display = "none";

            if (cursos.length === 0) {
                emptyState.style.display = "block";
                return;
            }

            let html = "";
            cursos.forEach(c => {
                const estiloFondo = obtenerGradientePorId(c.id);
                const nombreSeguro = encodeURIComponent(c.nombre);
                const docenteSeguro = encodeURIComponent(c.nombreDocente || 'Por asignar');

                html += `
                <div class="col-md-6 col-lg-4 col-xl-3">
                    <div class="card border-0 shadow-sm h-100 curso-card">
                        <div class="card-header border-0 pt-4 pb-3 px-4 text-white position-relative overflow-hidden" 
                             style="${estiloFondo}; height: 120px;">
                            <div class="curso-decoracion"></div>
                            <span class="badge bg-black bg-opacity-25 backdrop-blur border border-white border-opacity-25 mb-2">
                                ${c.nombreGrado || 'General'}
                            </span>
                            <h5 class="card-title fw-bold text-truncate mb-0" title="${c.nombre}">${c.nombre}</h5>
                        </div>

                        <div class="card-body px-4 pt-4 pb-3 d-flex flex-column">
                            <div class="mb-4">
                                <small class="text-uppercase text-muted fw-bold" style="font-size: 0.65rem; letter-spacing: 1px;">Docente</small>
                                <div class="d-flex align-items-center mt-1">
                                    <div class="avatar-circle bg-light text-primary me-2"><i class="fa-solid fa-user"></i></div>
                                    <span class="text-dark fw-medium small text-truncate">${c.nombreDocente || 'Por asignar'}</span>
                                </div>
                            </div>
                            <div class="mt-auto">
                                <a href="/Estudiante/Aula?cursoId=${c.id}&nombreCurso=${nombreSeguro}&docente=${docenteSeguro}" 
                                   class="btn btn-outline-primary w-100 rounded-pill fw-medium btn-sm">
                                    Entrar al Aula <i class="fa-solid fa-arrow-right ms-1"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>`;
            });

            grid.innerHTML = html;
            grid.style.display = "flex";
        } else {
            loader.innerHTML = `<p class="text-danger">Error al cargar cursos.</p>`;
        }
    } catch (error) {
        console.error(error);
        loader.innerHTML = `<p class="text-danger">Error de conexión.</p>`;
    }
}

function obtenerGradientePorId(id) {
    const gradientes = [
        "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "background: linear-gradient(135deg, #2af598 0%, #009efd 100%)",
        "background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)",
        "background: linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
        "background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
        "background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
        "background: linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)"
    ];
    return gradientes[id % gradientes.length];
}