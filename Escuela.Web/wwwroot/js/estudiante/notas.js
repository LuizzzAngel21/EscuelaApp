document.addEventListener("DOMContentLoaded", () => {
    cargarBoletaGlobal();
});

async function cargarBoletaGlobal() {
    const tabla = document.getElementById("tablaBoleta");
    const lblPromedio = document.getElementById("lblPromedioGeneral");
    const token = localStorage.getItem("tokenEscuela");

    const baseUrl = typeof API_BASE_URL !== "undefined" ? API_BASE_URL : "http://localhost:5000/api";

    try {
        const response = await fetch(`${baseUrl}/Notas/BoletaGlobal`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const cursos = await response.json();

            if (cursos.length === 0) {
                tabla.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center py-5">
                            <i class="fa-solid fa-folder-open display-4 text-secondary opacity-25 mb-3"></i>
                            <p class="text-muted">No tienes cursos matriculados en este periodo.</p>
                        </td>
                    </tr>`;
                if (lblPromedio) {
                    lblPromedio.innerText = "0.00";
                    lblPromedio.className = "fw-bold mb-0 display-6 text-secondary";
                }
                return;
            }

            let sumaPromedios = 0;
            let cursosConNota = 0;
            let html = "";

            cursos.forEach(c => {
                let icon = "fa-minus";
                if (c.estado === "Aprobado") icon = "fa-check-circle";
                else if (c.estado === "Reprobado") icon = "fa-circle-xmark";
                else if (c.estado === "Sin Notas") icon = "fa-clock";

                let colorBadge = "secondary"; 

                if (c.estado === "Aprobado") {
                    colorBadge = "success"; 
                } else if (c.estado === "Reprobado") {
                    colorBadge = "danger"; 
                } else {
                    colorBadge = "secondary"; 
                }

                if (c.avance > 0) {
                    sumaPromedios += c.promedio;
                    cursosConNota++;
                }

                let colorNotaFinal = "text-muted opacity-50";
                if (c.avance > 0) {
                    colorNotaFinal = (c.promedio < 11) ? "text-danger" : "text-dark";
                }

                html += `
                <tr>
                    <td class="ps-4 fw-bold text-dark align-middle">
                        ${c.curso}
                    </td>
                    <td class="align-middle">
                        <div class="d-flex align-items-center">
                            <div class="bg-light rounded-circle p-2 me-2 text-secondary"
                                 style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
                                <i class="fa-solid fa-user-tie" style="font-size: 0.8rem;"></i>
                            </div>
                            <small class="text-muted">${c.docente || "Sin asignar"}</small>
                        </div>
                    </td>
                    <td class="text-center align-middle">
                        <span class="badge bg-${colorBadge} bg-opacity-10 text-${colorBadge}
                                     px-3 py-2 rounded-pill border border-${colorBadge} border-opacity-10"
                              style="min-width: 110px;">
                            <i class="fa-solid ${icon} me-1"></i> ${c.estado}
                        </span>
                    </td>
                    <td class="text-center align-middle">
                        <div class="d-flex align-items-center justify-content-center" style="min-width: 120px;">
                            <div class="progress w-50" style="height: 6px; background-color: #e9ecef;">
                                <div class="progress-bar bg-primary"
                                     role="progressbar"
                                     style="width: ${c.avance}%"
                                     aria-valuenow="${c.avance}"
                                     aria-valuemin="0"
                                     aria-valuemax="100">
                                </div>
                            </div>
                            <small class="ms-2 text-muted fw-bold" style="font-size: 0.7rem">
                                ${c.avance}%
                            </small>
                        </div>
                    </td>
                    <td class="text-end pe-4 align-middle">
                        <span class="h5 fw-bold ${colorNotaFinal}">
                            ${c.promedio.toFixed(2)}
                        </span>
                    </td>
                </tr>`;
            });

            tabla.innerHTML = html;

            if (lblPromedio) {
                const promedioGeneral = cursosConNota > 0 ? (sumaPromedios / cursosConNota) : 0;
                lblPromedio.innerText = promedioGeneral.toFixed(2);

                let colorGeneral = "text-secondary";
                if (promedioGeneral > 0) {
                    colorGeneral = (promedioGeneral < 11) ? "text-danger" : "text-primary";
                }
                lblPromedio.className = `fw-bold mb-0 display-6 ${colorGeneral}`;
            }
        }
    } catch (error) {
        console.error("Error en cargarBoletaGlobal:", error);
        tabla.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger py-5">
                    <i class="fa-solid fa-triangle-exclamation display-4 mb-3"></i>
                    <p>No se pudo conectar con el servidor de notas.</p>
                </td>
            </tr>`;
    }
}

/* PDF */
function descargarPDF() {
    if (typeof html2pdf === 'undefined') {
        alert("Librería PDF no cargada.");
        return;
    }
    const elemento = document.getElementById("areaImprimible");
    const cabecera = document.getElementById("cabeceraPdf");
    const pie = document.getElementById("piePdf");

    if (cabecera) cabecera.classList.remove("d-none");
    if (pie) pie.classList.remove("d-none");

    const opciones = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `Boleta_Notas_${new Date().getFullYear()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
    };

    html2pdf().set(opciones).from(elemento).save()
        .then(() => {
            if (cabecera) cabecera.classList.add("d-none");
            if (pie) pie.classList.add("d-none");
        })
        .catch(err => {
            console.error(err);
            if (cabecera) cabecera.classList.add("d-none");
            if (pie) pie.classList.add("d-none");
        });
}