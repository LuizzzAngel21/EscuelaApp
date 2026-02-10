document.addEventListener("DOMContentLoaded", () => {
    cargarPensiones();
});

let modalPago;


/* visualizacion de pensiones llamando al get del back */

async function cargarPensiones() {
    const tabla = document.getElementById("tablaPensiones");
    const lblDeuda = document.getElementById("lblDeudaTotal");
    const lblEstado = document.getElementById("lblEstadoCuenta");
    const token = localStorage.getItem("tokenEscuela");

    try {
        const response = await fetch(`${API_BASE_URL}/Pensiones/MisPagos`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const pensiones = await response.json();

            if (pensiones.length === 0) {
                tabla.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-5 text-muted">
                            No tienes pensiones generadas.
                        </td>
                    </tr>`;
                lblDeuda.innerText = "S/ 0.00";
                lblEstado.innerHTML = `<span class="text-success fw-bold">Sin Obligaciones</span>`;
                return;
            }

            let html = "";
            let deudaExigible = 0;
            let hayVencidas = false;

            pensiones.forEach(p => {

                if (p.estado === "VENCIDO" || p.estado === "PENDIENTE") {
                    deudaExigible += p.totalAPagar;
                }

                if (p.estado === "VENCIDO") {
                    hayVencidas = true;
                }

                let accionHtml = "";
                if (p.estado === "PAGADO") {
                    accionHtml = `
                        <button class="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                onclick="verRecibo('${p.codigoOperacion}')">
                            <i class="fa-solid fa-file-invoice me-1"></i> Recibo
                        </button>`;
                } else {
                    accionHtml = `
                        <button class="btn btn-sm btn-primary rounded-pill px-3 shadow-sm"
                                onclick="abrirModalPago(${p.id}, '${p.mes}', ${p.totalAPagar})">
                            <i class="fa-regular fa-credit-card me-1"></i> Pagar
                        </button>`;
                }

                const textoColor =
                    p.estado === "PENDIENTE" ? "text-dark" : "text-white";

                html += `
                <tr>
                    <td class="ps-4 fw-bold text-dark text-capitalize">${p.mes}</td>
                    <td class="text-secondary">${p.fechaVencimiento}</td>
                    <td class="text-end">S/ ${p.montoBase.toFixed(2)}</td>
                    <td class="text-end text-danger">
                        ${p.mora > 0 ? 'S/ ' + p.mora.toFixed(2) : '-'}
                    </td>
                    <td class="text-end fw-bold text-dark">
                        S/ ${p.totalAPagar.toFixed(2)}
                    </td>
                    <td class="text-center">
                        <span class="badge rounded-pill fw-normal px-3 py-2 ${textoColor}"
                              style="background-color: ${p.colorEstado}; opacity: 0.9;">
                            ${p.estado}
                        </span>
                    </td>
                    <td class="text-center pe-4">
                        ${accionHtml}
                    </td>
                </tr>`;
            });

            tabla.innerHTML = html;
            lblDeuda.innerText = `S/ ${deudaExigible.toFixed(2)}`;

            if (deudaExigible === 0) {
                lblEstado.innerHTML = `
                    <span class="text-success">
                        <i class="fa-solid fa-check-circle me-1"></i>Al Corriente
                    </span>`;
                lblDeuda.className = "fw-bold mb-0 text-success";
            } else if (hayVencidas) {
                lblEstado.innerHTML = `
                    <span class="text-danger">
                        <i class="fa-solid fa-triangle-exclamation me-1"></i>Pagos Atrasados
                    </span>`;
                lblDeuda.className = "fw-bold mb-0 text-danger";
            } else {
                lblEstado.innerHTML = `
                    <span class="text-warning">
                        <i class="fa-solid fa-clock me-1"></i>Pago Pendiente
                    </span>`;
                lblDeuda.className = "fw-bold mb-0 text-dark";
            }

        } else {
            if (response.status === 404) {
                tabla.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-5 text-muted">
                            No se encontró matrícula activa.
                        </td>
                    </tr>`;
                lblEstado.innerText = "Sin Matrícula";
            } else {
                tabla.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-danger py-4">
                            Error al cargar datos.
                        </td>
                    </tr>`;
            }
        }
    } catch (error) {
        console.error("Error fetch:", error);
        tabla.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger py-4">
                    Error de conexión.
                </td>
            </tr>`;
    }
}


/* modal de pago */

function abrirModalPago(id, mes, total) {
    document.getElementById("hdnPensionId").value = id;
    document.getElementById("txtMontoPagar").innerText = `S/ ${total.toFixed(2)}`;
    document.getElementById("txtConceptoPagar").innerText = `Pago de pensión: Mes de ${mes}`;
    document.getElementById("txtTarjeta").value = "";

    modalPago = new bootstrap.Modal(document.getElementById("modalPagar"));
    modalPago.show();
}


/* procesamiento de pago */

async function procesarPago() {
    const id = document.getElementById("hdnPensionId").value;
    let tarjeta = document.getElementById("txtTarjeta").value;
    const token = localStorage.getItem("tokenEscuela");

    tarjeta = tarjeta.replace(/\s/g, "");

    if (!tarjeta) {
        Swal.fire("Atención", "Ingresa el número de tarjeta", "warning");
        return;
    }

    if (!tarjeta.startsWith("4")) {
        Swal.fire(
            "Tarjeta Inválida",
            "Para la simulación, usa una tarjeta que empiece con 4.",
            "info"
        );
        return;
    }

    const payload = {
        pensionId: parseInt(id),
        numeroTarjeta: tarjeta,
        fechaVencimiento: "12/30",
        cvv: "123"
    };

    try {
        modalPago.hide();
        Swal.fire({
            title: "Procesando...",
            didOpen: () => { Swal.showLoading(); }
        });

        const response = await fetch(`${API_BASE_URL}/Pensiones/Pagar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (response.ok) {
            Swal.fire({
                title: "¡Pago Exitoso!",
                text: `Código: ${data.codigo}. Total cobrado: S/ ${data.totalCobrado}`,
                icon: "success"
            }).then(() => {
                cargarPensiones();
            });
        } else {
            let mensajeError = "No se pudo procesar el pago.";

            if (typeof data === "string") {
                mensajeError = data;
            } else if (data.mensaje) {
                mensajeError = data.mensaje;
            } else if (data.errors) {
                mensajeError = "Datos inválidos (Verifica tarjeta o formato)";
            }

            Swal.fire("Pago Rechazado", mensajeError, "error");
        }

    } catch (error) {
        console.error(error);
        Swal.fire(
            "Error",
            "Error de comunicación con el servidor",
            "error"
        );
    }
}


/* visualizacion del recibo*/

function verRecibo(codigo) {
    Swal.fire({
        title: "Recibo de Pago",
        text: `Código de operación: ${codigo}`,
        icon: "info",
        confirmButtonText: "Cerrar"
    });
}
