document.addEventListener("DOMContentLoaded", () => {

    flatpickr("#fechaNacimiento", {
        dateFormat: "Y-m-d",
        maxDate: "2018-12-31", 
        locale: { firstDayOfWeek: 1 }
    });

    const nivelSelect = document.getElementById("nivel");
    const gradoSelect = document.getElementById("grado");
    const form = document.getElementById("admisionForm");

    const dataGrados = {
        Secundaria: [
            { id: 1, nombre: "1ro Secundaria" },
            { id: 2, nombre: "2do Secundaria" },
            { id: 3, nombre: "3ro Secundaria" },
            { id: 4, nombre: "4to Secundaria" },
            { id: 5, nombre: "5to Secundaria" }
        ]
    };

    nivelSelect.addEventListener("change", function () {
        gradoSelect.innerHTML = '<option value="">Seleccione Grado...</option>';
        const nivel = this.value;

        if (nivel && dataGrados[nivel]) {
            gradoSelect.disabled = false;
            dataGrados[nivel].forEach(item => {
                const opt = document.createElement("option");
                opt.value = item.id;
                opt.textContent = item.nombre;
                gradoSelect.appendChild(opt);
            });
        } else {
            gradoSelect.disabled = true;
            gradoSelect.innerHTML = '<option value="">Esperando Nivel...</option>';
        }
    });

    document.getElementById("dni").addEventListener("input", function () { this.value = this.value.replace(/\D/g, ""); });
    document.getElementById("telefono").addEventListener("input", function () { this.value = this.value.replace(/\D/g, ""); });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const payload = {
            Dni: document.getElementById("dni").value,
            Nombres: document.getElementById("nombres").value,
            Apellidos: document.getElementById("apellidos").value,
            FechaNacimiento: document.getElementById("fechaNacimiento").value,
            TelefonoApoderado: document.getElementById("telefono").value,
            EmailPersonal: document.getElementById("correo").value,
            GradoId: parseInt(gradoSelect.value) 
        };

        if (payload.Dni.length !== 8) return Swal.fire("Error", "El DNI debe tener 8 dígitos.", "warning");
        if (payload.TelefonoApoderado.length !== 9) return Swal.fire("Error", "El teléfono debe tener 9 dígitos.", "warning");

        const btn = form.querySelector("button[type='submit']");
        const btnOriginal = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

        try {
            const res = await fetch(`${API_BASE_URL}/Admision/Solicitar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                Swal.fire({
                    title: "¡Solicitud Recibida!",
                    html: `Hemos enviado un correo a <b>${payload.EmailPersonal}</b> con tu código de seguimiento.<br><br>Por favor revisa tu bandeja.`,
                    icon: "success",
                    confirmButtonColor: "#1f3c88"
                }).then(() => {
                    form.reset();
                    gradoSelect.innerHTML = '<option value="">Esperando Nivel...</option>';
                    gradoSelect.disabled = true;
                });
            } else {
                const errorText = await res.text();
                Swal.fire("Atención", errorText.replace(/"/g, ""), "warning");
            }
        } catch (error) {
            console.error(error);
            Swal.fire("Error de Conexión", "No se pudo conectar con el servidor.", "error");
        } finally {
            btn.disabled = false;
            btn.innerHTML = btnOriginal;
        }
    });
});