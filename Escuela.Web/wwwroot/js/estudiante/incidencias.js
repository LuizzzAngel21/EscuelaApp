const token = localStorage.getItem("tokenEscuela");

document.addEventListener("DOMContentLoaded", () => {
    if (!token) { window.location.href = "/Login"; return; }
    cargarIncidencias();
});

async function cargarIncidencias() {
    const container = document.getElementById("lista-incidencias");

    try {
        const response = await fetch(`${API_BASE_URL}/Incidencias`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const incidencias = await response.json();

            if (incidencias.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fa-solid fa-medal display-1 text-warning mb-3 opacity-50"></i>
                        <h5 class="fw-bold text-dark">¡Historial Limpio!</h5>
                        <p class="text-muted">No tienes incidencias registradas hasta la fecha.</p>
                    </div>`;
                container.style.borderLeft = "none";
                return;
            }

            container.innerHTML = incidencias.map(inc => {
                let nivelLower = (inc.nivel || "").toLowerCase();
                let colorClase = "nivel-leve";
                let badgeClase = "bg-info text-dark";

                if (nivelLower.includes("grave")) { colorClase = "nivel-grave"; badgeClase = "bg-warning text-dark"; }
                if (nivelLower.includes("muy grave") || nivelLower.includes("expulsión")) { colorClase = "nivel-muy-grave"; badgeClase = "bg-danger"; }

                return `
                <div class="card border-0 shadow-sm incidence-card mb-4">
                    <div class="incidencia-marker ${colorClase}"></div>
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <span class="badge ${badgeClase} mb-2 text-uppercase fw-bold" style="font-size: 0.7rem;">${inc.nivel}</span>
                                <h5 class="fw-bold mb-0 text-dark">${inc.titulo}</h5>
                            </div>
                            <small class="text-muted fw-bold">${inc.fecha}</small>
                        </div>
                        
                        <p class="text-secondary mb-3">${inc.descripcion}</p>
                        
                        <div class="d-flex justify-content-between align-items-center pt-3 border-top mt-3">
                            <small class="text-muted">
                                <i class="fa-solid fa-user-tie me-1"></i> Reportado por: <strong>${inc.nombreReportador || 'Staff'}</strong>
                            </small>
                            <span class="badge bg-light text-secondary border">Estado: ${inc.estado}</span>
                        </div>
                    </div>
                </div>`;
            }).join('');
        } else {
            container.innerHTML = `<p class="text-danger text-center">Error al cargar datos.</p>`;
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = `<p class="text-danger text-center">Error de conexión.</p>`;
    }
}