document.addEventListener("DOMContentLoaded", () => {
    cargarHorarioDocente();
});

async function cargarHorarioDocente() {
    const tbody = document.getElementById("tablaHorarioBody");
    const token = localStorage.getItem("tokenEscuela");

    try {
        const response = await fetch(`${API_BASE_URL}/Horarios`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            let horarios = await response.json();

            if (horarios.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-muted fst-italic">No tienes carga horaria asignada.</td></tr>`;
                return;
            }

            const horasUnicas = [...new Set(horarios.map(h => h.horaInicio))].sort((a, b) => {
                return parseInt(a.replace(":", "")) - parseInt(b.replace(":", ""));
            });

            const diasMap = { "Lunes": 1, "Martes": 2, "Miercoles": 3, "Miércoles": 3, "Jueves": 4, "Viernes": 5 };
            let htmlFilas = "";

            horasUnicas.forEach(hora => {
                let celdas = ["", "", "", "", "", ""];
                const clasesHora = horarios.filter(h => h.horaInicio === hora);

                clasesHora.forEach(clase => {
                    const idx = diasMap[clase.dia];
                    if (idx) {
                        celdas[idx] = `
                            <div class="clase-card">
                                <div class="clase-nombre text-truncate" title="${clase.curso}">
                                    ${clase.curso}
                                </div>
                                <span class="clase-info text-primary mb-1" style="font-weight:600;">
                                    ${clase.horaInicio} - ${clase.horaFin}
                                </span>
                                <span class="clase-info text-muted">
                                    <i class="fa-solid fa-users-rectangle me-1"></i>${clase.grado || 'Sección'}
                                </span>
                            </div>`;
                    }
                });

                htmlFilas += `
                <tr>
                    <td class="col-hora">${hora}</td>
                    <td>${celdas[1]}</td>
                    <td>${celdas[2]}</td>
                    <td>${celdas[3]}</td>
                    <td>${celdas[4]}</td>
                    <td>${celdas[5]}</td>
                </tr>`;
            });
            tbody.innerHTML = htmlFilas;
        }
    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Error de conexión.</td></tr>`;
    }
}