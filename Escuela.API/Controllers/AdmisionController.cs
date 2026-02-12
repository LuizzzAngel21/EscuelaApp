using Escuela.API.Dtos;
using Escuela.API.Services;
using Escuela.Core.Entities;
using Escuela.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Escuela.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdmisionController : ControllerBase
    {
        private readonly EscuelaDbContext _context;
        private readonly IEmailService _emailService;

        public AdmisionController(EscuelaDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        [HttpPost("Solicitar")]
        public async Task<IActionResult> SolicitarAdmision([FromBody] CrearSolicitudDto dto)
        {
            var existe = await _context.SolicitudesMatricula
                .AnyAsync(s => s.Dni == dto.Dni && s.Estado != EstadoSolicitud.Rechazado);

            if (existe)
                return BadRequest("Ya existe una solicitud en proceso para este DNI.");

            var tokenSeguimiento = Guid.NewGuid();

            var solicitud = new SolicitudMatricula
            {
                Dni = dto.Dni,
                Nombres = dto.Nombres,
                Apellidos = dto.Apellidos,
                FechaNacimiento = dto.FechaNacimiento,
                TelefonoApoderado = dto.TelefonoApoderado ?? string.Empty,
                EmailPersonal = dto.EmailPersonal,
                GradoId = dto.GradoId,

                TokenSeguimiento = tokenSeguimiento,
                Estado = EstadoSolicitud.Recibido,
                FechaSolicitud = DateTime.Now,
                PagoRealizado = false
            };

            _context.SolicitudesMatricula.Add(solicitud);
            await _context.SaveChangesAsync();

            string linkSeguimiento = $"http://localhost:5000/Matricula/carpeta?token={tokenSeguimiento}";

            string asunto = "Admisión 2026 - Continúa tu trámite";
            string cuerpo = $@"
                <h1>¡Registro Recibido!</h1>
                <p>Hola, hemos recibido los datos de <strong>{dto.Nombres}</strong>.</p>
                <p>Tu código de seguimiento es: <strong>{tokenSeguimiento}</strong></p>
                <p>Para subir los documentos y realizar el pago, haz clic en el siguiente enlace:</p>
                <br>
                <a href='{linkSeguimiento}' style='background-color:#4CAF50; color:white; padding:10px 20px; text-decoration:none;'>CONTINUAR TRÁMITE AQUÍ</a>
                <br><br>
                <p>Si el botón no funciona, copia este link: {linkSeguimiento}</p>";

            await _emailService.SendEmailAsync(dto.EmailPersonal, asunto, cuerpo);

            return Ok(new
            {
                mensaje = "Solicitud iniciada. Revise su correo para continuar.",
                token = tokenSeguimiento
            });
        }


    }
}