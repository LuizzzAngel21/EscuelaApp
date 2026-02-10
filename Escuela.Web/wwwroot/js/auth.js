async function login() {
    const txtEmail = document.getElementById("txtEmail");
    const txtPassword = document.getElementById("txtPassword");
    const btnIngresar = document.getElementById("btnIngresar");

    const email = txtEmail.value.trim();
    const password = txtPassword.value.trim();

    if (!email || !password) {
        alert("Por favor ingresa tu usuario y contraseña.");
        return;
    }

    btnIngresar.disabled = true;
    btnIngresar.innerText = "Verificando...";

    try {
        const response = await fetch(`${API_BASE_URL}/Auth/Login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        if (response.ok) {
            const data = await response.json();

            localStorage.setItem("tokenEscuela", data.token);
            if (data.nombre) localStorage.setItem("usuarioNombre", data.nombre);
            if (data.rol) localStorage.setItem("usuarioRol", data.rol);

            switch (data.rol) {
                case "Estudiantil":
                    window.location.href = "/Estudiante/Inicio";
                    break;

                case "Academico":
                    window.location.href = "/Docente/Dashboard";
                    break;

                case "Administrativo":
                    window.location.href = "/Admin/Dashboard";
                    break;

                case "Psicologo":
                    window.location.href = "/Bienestar/Inicio";
                    break;

                default:
                    window.location.href = "/Estudiante/Inicio";
                    break;
            }

        } else {
            const errorText = await response.text();
            try {
                const errorJson = JSON.parse(errorText);
                alert("Error: " + (errorJson.message || "Credenciales incorrectas"));
            } catch {
                alert("Error: " + (errorText || "Credenciales incorrectas"));
            }
        }

    } catch (error) {
        console.error("Error de red:", error);
        alert("No se pudo conectar con el servidor. Verifica que la API esté corriendo.");
    } finally {
        btnIngresar.disabled = false;
        btnIngresar.innerText = "INGRESAR";
    }
}
