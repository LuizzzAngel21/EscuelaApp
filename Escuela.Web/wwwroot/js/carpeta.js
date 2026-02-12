document.addEventListener("DOMContentLoaded", async () => {
    const token = document.getElementById("hdnToken").value;
    const lblNombre = document.getElementById("lblNombreEstudiante");

    try {
        lblNombre.innerHTML = '<span class="spinner-border spinner-border-sm text-primary"></span> Verificando estado...';

        const res = await fetch(`${API_BASE_URL}/CarpetaDigital/Consultar/${token}`);

        if (res.ok) {
            const data = await res.json();
            inicializarFormulario(data);
        } else {
            lblNombre.innerText = "Error de enlace";
            Swal.fire({
                icon: "error",
                title: "Enlace Inválido",
                text: "El link de acceso ha expirado o no existe.",
                confirmButtonColor: "#0b2a4a"
            });
        }
    } catch (e) {
        console.error("Error cargando estado:", e);
        lblNombre.innerText = "Error de conexión";
    }

    const inputCard = document.getElementById("cardNumber");
    if (inputCard) {
        inputCard.addEventListener("input", (e) => {
            let val = e.target.value.replace(/\D/g, '');
            e.target.value = val.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
        });
    }

    const inputExpiry = document.getElementById("cardExpiry");
    if (inputExpiry) {
        inputExpiry.addEventListener("input", (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length >= 2) {
                e.target.value = val.substring(0, 2) + '/' + val.substring(2, 4);
            } else {
                e.target.value = val;
            }
        });
    }
});

function inicializarFormulario(data) {
    const nombres = data.nombres || data.Nombres || "";
    const apellidos = data.apellidos || data.Apellidos || "";
    const dni = data.dni || data.Dni || "";
    const observaciones = data.observaciones || data.Observaciones;

    const pagoRealizado = (data.pagoRealizado === true || data.PagoRealizado === true);
    const existeDni = (data.existeFotoDni === true || data.ExisteFotoDni === true);
    const existeNotas = (data.existeConstancia === true || data.ExisteConstancia === true);
    const existeSeguro = (data.existeSeguro === true || data.ExisteSeguro === true);

    document.getElementById("lblNombreEstudiante").innerHTML =
        `<i class="fa-solid fa-user-graduate me-2"></i>${nombres} ${apellidos} <span class="badge bg-secondary ms-2">${dni}</span>`;

    if (observaciones) {
        const alerta = document.getElementById("alertaObservacion");
        document.getElementById("txtObservacion").innerText = observaciones;
        alerta.style.display = "block";
        alerta.classList.add("animate__animated", "animate__shakeX");
    }

    if (pagoRealizado) {
        const formPago = document.getElementById("formularioPago");
        if (formPago) formPago.remove();

        const boxVerde = document.getElementById("pagoValidado");
        if (boxVerde) {
            boxVerde.classList.remove("d-none");
            boxVerde.classList.add("d-flex");
        }
    }

    configurarInputArchivo("fileDni", "msgDni", existeDni);
    configurarInputArchivo("fileNotas", "msgNotas", existeNotas);
    configurarInputArchivo("fileSeguro", "msgSeguro", existeSeguro);

    configurarEnvio();
}

function configurarInputArchivo(inputId, msgId, existe) {
    if (existe) {
        const input = document.getElementById(inputId);
        const msg = document.getElementById(msgId);

        input.removeAttribute("required");

        msg.style.display = "block";

        input.classList.add("border-success", "bg-success", "bg-opacity-10");
    }
}

function configurarEnvio() {
    const form = document.getElementById("carpetaForm");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const inputCard = document.getElementById("cardNumber");
        if (inputCard) { 
            const rawCard = inputCard.value.replace(/\s/g, '');
            if (!rawCard.startsWith("4")) {
                return Swal.fire({
                    title: "Tarjeta no válida",
                    text: "Por favor ingrese una tarjeta VISA válida (debe iniciar con 4).",
                    icon: "warning",
                    confirmButtonColor: "#0b2a4a"
                });
            }
            if (rawCard.length < 16) {
                return Swal.fire("Atención", "Número de tarjeta incompleto.", "warning");
            }
        }

        const btn = form.querySelector("button[type='submit']");
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin me-2"></i>Guardando Cambios...';

        const formData = new FormData();
        formData.append("Token", document.getElementById("hdnToken").value);

        if (inputCard) {
            formData.append("NumeroTarjeta", inputCard.value.replace(/\s/g, ''));
            formData.append("FechaVencimiento", document.getElementById("cardExpiry").value);
            formData.append("Cvv", document.getElementById("cardCvv").value);
        }

        const fileDni = document.getElementById("fileDni").files[0];
        const fileNotas = document.getElementById("fileNotas").files[0];
        const fileSeguro = document.getElementById("fileSeguro").files[0];

        if (fileDni) formData.append("FotoDni", fileDni);
        if (fileNotas) formData.append("ConstanciaNotas", fileNotas);
        if (fileSeguro) formData.append("SeguroMedico", fileSeguro);

        try {
            const res = await fetch(`${API_BASE_URL}/CarpetaDigital/Enviar`, {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                Swal.fire({
                    title: "¡Carpeta Actualizada!",
                    text: "Hemos recibido su información correctamente. La secretaría revisará su expediente a la brevedad.",
                    icon: "success",
                    confirmButtonColor: "#0b2a4a",
                    allowOutsideClick: false
                }).then(() => {
                    window.location.href = "/";
                });
            } else {
                const errorText = await res.text();
                Swal.fire({
                    title: "No se pudo guardar",
                    text: errorText.replace(/^{|}$|"/g, ""),
                    icon: "warning",
                    confirmButtonColor: "#d32f2f"
                });
            }
        } catch (error) {
            console.error(error);
            Swal.fire("Error de Conexión", "No se pudo conectar con el servidor.", "error");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });
}