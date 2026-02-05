document.addEventListener("DOMContentLoaded", () => {

    // Datepicker
    flatpickr("#fechaNacimiento", {
        dateFormat: "Y-m-d",
        maxDate: "today"
    });

    // Referencias
    const nivelSelect = document.getElementById("nivel");
    const gradoSelect = document.getElementById("grado");
    const form = document.getElementById("admisionForm");

    // Lógica de grados por nivel
    const gradosPorNivel = {
        Inicial: ["4 años", "5 años"],
        Primaria: [
            "1ro Primaria",
            "2do Primaria",
            "3ro Primaria",
            "4to Primaria",
            "5to Primaria",
            "6to Primaria"
        ],
        Secundaria: [
            "1ro Secundaria",
            "2do Secundaria",
            "3ro Secundaria",
            "4to Secundaria",
            "5to Secundaria"
        ]
    };

    // Nivel → Grado
    nivelSelect.addEventListener("change", () => {
        gradoSelect.innerHTML = '<option value="">Seleccione un grado</option>';

        const grados = gradosPorNivel[nivelSelect.value];
        if (!grados) return;

        grados.forEach(grado => {
            const option = document.createElement("option");
            option.value = grado;
            option.textContent = grado;
            gradoSelect.appendChild(option);
        });
    });

    // Validaciones numéricas
    document.getElementById("dni").addEventListener("input", e => {
        e.target.value = e.target.value.replace(/\D/g, "");
    });

    document.getElementById("telefono").addEventListener("input", e => {
        e.target.value = e.target.value.replace(/\D/g, "");
    });

    // Submit
    form.addEventListener("submit", e => {
        e.preventDefault();

        const data = {
            dni: dni.value,
            nombres: nombres.value,
            apellidos: apellidos.value,
            fechaNacimiento: fechaNacimiento.value,
            telefono: telefono.value,
            correo: correo.value,
            grado: gradoSelect.value
        };

        if (data.dni.length !== 8) {
            Swal.fire("Error", "El DNI debe tener 8 dígitos", "warning");
            return;
        }

        if (data.telefono.length !== 9) {
            Swal.fire("Error", "El teléfono debe tener 9 dígitos", "warning");
            return;
        }

        fetch("/Admision/Solicitar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })
            .then(res => {
                if (res.status === 409) {
                    Swal.fire(
                        "Solicitud existente",
                        "Ya existe una solicitud registrada con este DNI",
                        "info"
                    );
                    throw new Error("DNI duplicado");
                }
                return res.json();
            })
            .then(() => {
                Swal.fire(
                    "Solicitud recibida",
                    "Hemos enviado un correo con la confirmación",
                    "success"
                );
                form.reset();
                gradoSelect.innerHTML = '<option value="">Seleccione un grado</option>';
            })
            .catch(() => { });
    });

});
