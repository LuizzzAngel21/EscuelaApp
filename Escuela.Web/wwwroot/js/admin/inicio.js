document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("tokenEscuela");
    const headers = { "Authorization": `Bearer ${token}` };

    try {
        const [resMatriculas, resPendientes, resHorarios, resSecciones] = await Promise.all([
            fetch(`${API_BASE_URL}/Matriculas?anio=2026`, { headers }),
            fetch(`${API_BASE_URL}/Matriculas/Pendientes`, { headers }),
            fetch(`${API_BASE_URL}/Horarios`, { headers }),
            fetch(`${API_BASE_URL}/Secciones`, { headers })
        ]);

        if (resMatriculas.ok && resPendientes.ok && resHorarios.ok && resSecciones.ok) {
            const matriculas = await resMatriculas.json();
            const pendientes = await resPendientes.json();
            const horarios = await resHorarios.json();
            const secciones = await resSecciones.json();

            renderizarIndicadores(matriculas, pendientes, horarios);

            renderizarGraficoVacantes(secciones, matriculas);
            renderizarGraficoAdmision(matriculas, pendientes);
        }
    } catch (error) {
        console.error("Error cargando dashboard:", error);
    }
});


function renderizarIndicadores(matriculas, pendientes, horarios) {
    document.getElementById("countMatriculados").innerText = matriculas.length;

    document.getElementById("countPendientes").innerText = pendientes.length;

    const hoy = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(new Date());
    const diaHoy = hoy.charAt(0).toUpperCase() + hoy.slice(1); 

    const clasesHoy = horarios.filter(h => h.dia === diaHoy).length;
    document.getElementById("countClasesHoy").innerText = clasesHoy;
}

function renderizarGraficoVacantes(secciones, matriculas) {
    const ctx = document.getElementById('chartVacantes').getContext('2d');

    const capacidadPorGrado = {};
    secciones.forEach(s => {
        capacidadPorGrado[s.grado] = (capacidadPorGrado[s.grado] || 0) + s.capacidad;
    });

    const ocupadosPorGrado = {};
    matriculas.forEach(m => {
        ocupadosPorGrado[m.grado] = (ocupadosPorGrado[m.grado] || 0) + 1;
    });

    const labels = Object.keys(capacidadPorGrado);
    const dataCapacidad = labels.map(l => capacidadPorGrado[l]);
    const dataOcupados = labels.map(l => ocupadosPorGrado[l] || 0);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Matriculados',
                    data: dataOcupados,
                    backgroundColor: '#0b2a4a',
                    borderRadius: 5
                },
                {
                    label: 'Capacidad Total',
                    data: dataCapacidad,
                    backgroundColor: '#eef2f7',
                    borderRadius: 5
                }
            ]
        },
        options: {
            indexAxis: 'y', 
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: false, grid: { display: false } },
                y: { stacked: false, grid: { display: false } }
            },
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function renderizarGraficoAdmision(matriculas, pendientes) {
    const ctx = document.getElementById('chartAdmision').getContext('2d');

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Matriculados', 'En Revisión'],
            datasets: [{
                data: [matriculas.length, pendientes.length],
                backgroundColor: ['#0b2a4a', '#c5a059'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            },
            cutout: '70%' 
        }
    });
}