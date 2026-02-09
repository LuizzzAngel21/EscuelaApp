document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("tokenEscuela")) {
        cargarNotificaciones();
    }
});

async function cargarNotificaciones() {
    const contenedor = document.getElementById("lista-notificaciones-dropdown");
    const badge = document.getElementById("badge-notificaciones");
    const token = localStorage.getItem("tokenEscuela");

    if (!contenedor || !badge) return;

    try {
        const response = await fetch(`${API_BASE_URL}/Notificaciones/Resumen`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const notificaciones = await response.json();
            const total = notificaciones.length;

            if (total > 0) {
                badge.innerText = total > 9 ? "9+" : total;
                badge.style.display = "inline-block";
                badge.classList.add("animate__animated", "animate__pulse");
            } else {
                badge.style.display = "none";
            }

            if (total === 0) {
                contenedor.innerHTML = `
                    <li class="text-center py-4 text-muted">
                        <i class="fa-regular fa-bell-slash fa-2x mb-2 opacity-25"></i>
                        <p class="mb-0 small">No tienes notificaciones nuevas</p>
                    </li>`;
                return;
            }

            let html = "";

            notificaciones.forEach(n => {
                let icono = "fa-info";
                let colorBg = "bg-primary";
                let colorText = "text-primary";

                switch (n.tipo) {
                    case "Mensaje":
                        icono = "fa-envelope"; colorBg = "bg-info"; colorText = "text-info"; break;
                    case "Alerta":
                        icono = "fa-triangle-exclamation"; colorBg = "bg-warning"; colorText = "text-warning"; break;
                    case "Pago":
                        icono = "fa-file-invoice-dollar"; colorBg = "bg-danger"; colorText = "text-danger"; break;
                    case "Cita":
                        icono = "fa-calendar-check"; colorBg = "bg-success"; colorText = "text-success"; break;
                }

                html += `
                <li class="border-bottom">
                    <a class="dropdown-item d-flex align-items-start py-3 px-3 position-relative notification-item" href="${n.urlDestino}">
                        <div class="flex-shrink-0">
                            <div class="rounded-circle ${colorBg} bg-opacity-10 d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;">
                                <i class="fa-solid ${icono} ${colorText}"></i>
                            </div>
                        </div>
                        <div class="flex-grow-1 ms-3">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <h6 class="mb-0 fw-bold text-dark text-truncate" style="max-width: 160px; font-size: 0.85rem;">${n.titulo}</h6>
                                <small class="text-muted" style="font-size: 0.65rem;">${n.fecha}</small>
                            </div>
                            <p class="mb-0 text-secondary text-truncate small" style="max-width: 200px;">${n.descripcion}</p>
                            ${n.esPrioritario ? '<span class="position-absolute top-0 start-0 translate-middle p-1 bg-danger border border-light rounded-circle ms-4 mt-4"></span>' : ''}
                        </div>
                    </a>
                </li>`;
            });

            contenedor.innerHTML = html;
        }
    } catch (error) {
        console.error("Error al cargar notificaciones:", error);
    }
}