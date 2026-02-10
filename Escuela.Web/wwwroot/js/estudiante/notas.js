document.addEventListener("DOMContentLoaded", () => {
    cargarBoletaGlobal();
});

async function cargarBoletaGlobal() {
    const tabla = document.getElementById("tablaBoleta");
    const lblPromedio = document.getElementById("lblPromedioGeneral");
    const token = localStorage.getItem("tokenEscuela");

    const baseUrl = typeof API_BASE_URL !== "undefined"
        ? API_BASE_URL
        : "http://localhost:5000/api";

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
                lblPromedio.innerText = "0.00";
                lblPromedio.className = "fw-bold mb-0 display-6 text-primary";
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

                if (c.avance > 0) {
                    sumaPromedios += c.promedio;
                    cursosConNota++;
                }

                const colorNotaFinal =
                    (c.promedio < 11 && c.avance > 0)
                        ? "text-danger"
                        : "text-dark";

                html += `
                <tr>
                    <td class="ps-4 fw-bold text-dark">
                        ${c.curso}
                    </td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="bg-light rounded-circle p-2 me-2 text-secondary"
                                 style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
                                <i class="fa-solid fa-user-tie" style="font-size: 0.8rem;"></i>
                            </div>
                            <small class="text-muted">${c.docente || "Sin asignar"}</small>
                        </div>
                    </td>
                    <td class="text-center">
                        <span class="badge bg-${c.colorEstado} bg-opacity-10 text-${c.colorEstado}
                                     px-3 py-2 rounded-pill border border-${c.colorEstado} border-opacity-10"
                              style="min-width: 110px;">
                            <i class="fa-solid ${icon} me-1"></i> ${c.estado}
                        </span>
                    </td>
                    <td class="text-center">
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
                    <td class="text-end pe-4">
                        <span class="h5 fw-bold ${colorNotaFinal}">
                            ${c.promedio.toFixed(2)}
                        </span>
                    </td>
                </tr>`;
            });

            tabla.innerHTML = html;

            const promedioGeneral =
                cursosConNota > 0 ? (sumaPromedios / cursosConNota) : 0;

            lblPromedio.innerText = promedioGeneral.toFixed(2);

            const colorGeneral =
                (promedioGeneral < 11 && promedioGeneral > 0)
                    ? "text-danger"
                    : "text-primary";

            lblPromedio.className = `fw-bold mb-0 display-6 ${colorGeneral}`;
        }
    } catch (error) {
        console.error("Error en cargarBoletaGlobal:", error);
        tabla.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger py-5">
                    <i class="fa-solid fa-triangle-exclamation display-4 mb-3"></i>
                    <p>No se pudo conectar con el servidor de notas. Intente más tarde.</p>
                </td>
            </tr>`;
    }
}

/* GENERACIÓN del pdf de boletas */

function descargarPDF() {
    const elemento = document.getElementById("areaImprimible");
    const cabecera = document.getElementById("cabeceraPdf");
    const pie = document.getElementById("piePdf");

    cabecera.classList.remove("d-none");
    pie.classList.remove("d-none");

    const opciones = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `Boleta_Final_${new Date().getFullYear()}_${Math.floor(Math.random() * 1000)}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
            scale: 3,
            useCORS: true,
            logging: false,
            letterRendering: true
        },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
    };

    html2pdf()
        .set(opciones)
        .from(elemento)
        .save()
        .then(() => {
            cabecera.classList.add("d-none");
            pie.classList.add("d-none");
        })
        .catch(err => {
            console.error("Error al generar PDF:", err);
            cabecera.classList.add("d-none");
            pie.classList.add("d-none");
            alert("Hubo un error al generar el archivo PDF.");
        });
}
