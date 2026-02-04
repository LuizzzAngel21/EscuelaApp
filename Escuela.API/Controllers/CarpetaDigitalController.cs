using Escuela.API.Dtos;
using Escuela.Core.Entities;
using Escuela.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Escuela.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CarpetaDigitalController : ControllerBase
    {
        private readonly EscuelaDbContext _context;
        private readonly IWebHostEnvironment _env;

        public CarpetaDigitalController(EscuelaDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpPost("Enviar")]
        public async Task<IActionResult> RecibirExpediente([FromForm] CarpetaDigitalDto dto)
        {
            var solicitud = await _context.SolicitudesMatricula
                .FirstOrDefaultAsync(s => s.TokenSeguimiento == dto.Token);

            if (solicitud == null) return NotFound("El código de seguimiento no es válido.");

            if (solicitud.Estado == EstadoSolicitud.Matriculado)
                return BadRequest("Este alumno ya está matriculado.");

            string rutaRaiz = _env.WebRootPath ?? "wwwroot";
            string carpetaDestino = Path.Combine(rutaRaiz, "documentos", solicitud.Dni);
            if (!Directory.Exists(carpetaDestino)) Directory.CreateDirectory(carpetaDestino);


            if (dto.FotoDni != null && dto.FotoDni.Length > 0)
            {
                solicitud.UrlFotoDni = await GuardarArchivo(dto.FotoDni, carpetaDestino);
            }

            if (dto.ConstanciaNotas != null && dto.ConstanciaNotas.Length > 0)
            {
                solicitud.UrlConstanciaNotas = await GuardarArchivo(dto.ConstanciaNotas, carpetaDestino);
            }

            if (dto.SeguroMedico != null && dto.SeguroMedico.Length > 0)
            {
                solicitud.UrlSeguroMedico = await GuardarArchivo(dto.SeguroMedico, carpetaDestino);
            }

            if (!solicitud.PagoRealizado)
            {
                if (string.IsNullOrEmpty(dto.NumeroTarjeta) || !dto.NumeroTarjeta.StartsWith("4"))
                {
                    return BadRequest(new { error = "Pago requerido", motivo = "Debe ingresar una tarjeta VISA válida (inicio con 4)." });
                }

                solicitud.PagoRealizado = true;
                solicitud.CodigoOperacion = $"VISA-{new Random().Next(1000, 9999)}";
            }

            solicitud.Estado = EstadoSolicitud.EnRevision;
            solicitud.Observaciones = null; 

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "¡Expediente actualizado con éxito!",
                estado = "En Revisión por Secretaría"
            });
        }

        private async Task<string> GuardarArchivo(IFormFile archivo, string carpetaDestino)
        {
            string nombreArchivo = $"{Guid.NewGuid()}_{archivo.FileName}";
            string rutaCompleta = Path.Combine(carpetaDestino, nombreArchivo);

            using (var stream = new FileStream(rutaCompleta, FileMode.Create))
            {
                await archivo.CopyToAsync(stream);
            }

            return Path.Combine("documentos", new DirectoryInfo(carpetaDestino).Name, nombreArchivo).Replace("\\", "/");
        }
    }
}