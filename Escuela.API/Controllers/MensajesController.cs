using Escuela.API.Dtos;
using Escuela.Core.Entities;
using Escuela.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Escuela.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MensajesController : ControllerBase
    {
        private readonly EscuelaDbContext _context;
        private readonly UserManager<IdentityUser> _userManager;

        public MensajesController(EscuelaDbContext context, UserManager<IdentityUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpGet("Destinatarios")]
        public async Task<ActionResult<IEnumerable<DestinatarioDto>>> GetDestinatarios()
        {
            var userId = User.FindFirstValue("uid");
            var esEstudiante = User.IsInRole("Estudiantil");
            var esDocente = User.IsInRole("Academico");

            var listaDestinatarios = new List<DestinatarioDto>();

            if (esEstudiante)
            {
                var miMatricula = await _context.Matriculas
                    .Include(m => m.Grado)
                    .OrderByDescending(m => m.Id) 
                    .FirstOrDefaultAsync(m => m.Estudiante!.UsuarioId == userId);

                if (miMatricula != null)
                {
                    var misProfesores = await _context.Cursos
                        .Where(c => c.GradoId == miMatricula.GradoId)
                        .Include(c => c.Docente)
                        .Select(c => c.Docente)
                        .Distinct() 
                        .ToListAsync();

                    foreach (var profe in misProfesores)
                    {
                        if (profe != null)
                        {
                            listaDestinatarios.Add(new DestinatarioDto
                            {
                                UsuarioId = profe.UsuarioId,
                                NombreCompleto = $"{profe.Nombres} {profe.Apellidos}",
                                Rol = "Docente"
                            });
                        }
                    }
                }

                var administrativos = await _userManager.GetUsersInRoleAsync("Administrativo");
                foreach (var admin in administrativos)
                {
                    listaDestinatarios.Add(new DestinatarioDto
                    {
                        UsuarioId = admin.Id,
                        NombreCompleto = admin.UserName ?? "Personal Administrativo",
                        Rol = "Administrativo"
                    });
                }

                var psicologos = await _context.Psicologos.ToListAsync();
                listaDestinatarios.AddRange(psicologos.Select(p => new DestinatarioDto
                {
                    UsuarioId = p.UsuarioId,
                    NombreCompleto = $"{p.Nombres} {p.Apellidos}",
                    Rol = "Psicólogo"
                }));
            }
            else
            {
                var docentes = await _context.Docentes.ToListAsync();
                listaDestinatarios.AddRange(docentes.Select(d => new DestinatarioDto
                {
                    UsuarioId = d.UsuarioId,
                    NombreCompleto = $"{d.Nombres} {d.Apellidos}",
                    Rol = "Docente"
                }));

                var psicologos = await _context.Psicologos.ToListAsync();
                listaDestinatarios.AddRange(psicologos.Select(p => new DestinatarioDto
                {
                    UsuarioId = p.UsuarioId,
                    NombreCompleto = $"{p.Nombres} {p.Apellidos}",
                    Rol = "Psicólogo"
                }));
            }

            return Ok(listaDestinatarios);
        }

        [HttpGet("Entrada")]
        public async Task<ActionResult<IEnumerable<MensajeDto>>> GetEntrada()
        {
            var userId = User.FindFirstValue("uid");

            var mensajes = await _context.Mensajes
                .Where(m => m.DestinatarioId == userId)
                .OrderByDescending(m => m.FechaEnvio)
                .Select(m => new MensajeDto
                {
                    Id = m.Id,
                    Asunto = m.Asunto,
                    Contenido = m.Contenido,
                    Fecha = m.FechaEnvio.ToString("dd/MM/yyyy HH:mm"),
                    Leido = m.Leido,
                    RemitenteNombre = m.NombreRemitente,
                    DestinatarioNombre = "Mí",
                    ArchivoUrl = m.ArchivoAdjuntoUrl,
                    YoSoyRemitente = false
                })
                .ToListAsync();

            return Ok(mensajes);
        }

        [HttpGet("Salida")]
        public async Task<ActionResult<IEnumerable<MensajeDto>>> GetSalida()
        {
            var userId = User.FindFirstValue("uid");

            var mensajes = await _context.Mensajes
                .Where(m => m.RemitenteId == userId)
                .OrderByDescending(m => m.FechaEnvio)
                .Select(m => new MensajeDto
                {
                    Id = m.Id,
                    Asunto = m.Asunto,
                    Contenido = m.Contenido,
                    Fecha = m.FechaEnvio.ToString("dd/MM/yyyy HH:mm"),
                    Leido = m.Leido,
                    RemitenteNombre = "Mí",
                    DestinatarioNombre = "Destinatario",
                    ArchivoUrl = m.ArchivoAdjuntoUrl,
                    YoSoyRemitente = true
                })
                .ToListAsync();

            return Ok(mensajes);
        }

        [HttpPost]
        public async Task<ActionResult> Enviar(CrearMensajeDto dto)
        {
            var userId = User.FindFirstValue("uid");
            var userName = User.Identity?.Name ?? "Desconocido";

            var destinatario = await _userManager.FindByIdAsync(dto.DestinatarioId);
            if (destinatario == null) return BadRequest("El destinatario no existe.");

            var nuevoMensaje = new Mensaje
            {
                RemitenteId = userId,
                NombreRemitente = userName,
                DestinatarioId = dto.DestinatarioId,
                Asunto = dto.Asunto,
                Contenido = dto.Contenido,
                FechaEnvio = DateTime.Now,
                Leido = false,
                ArchivoAdjuntoUrl = dto.ArchivoAdjuntoUrl
            };

            _context.Mensajes.Add(nuevoMensaje);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Mensaje enviado correctamente." });
        }

        [HttpPut("Leer/{id}")]
        public async Task<IActionResult> MarcarLeido(int id)
        {
            var userId = User.FindFirstValue("uid");
            var mensaje = await _context.Mensajes.FindAsync(id);

            if (mensaje == null) return NotFound();

            if (mensaje.DestinatarioId != userId) return Forbid();

            mensaje.Leido = true;
            await _context.SaveChangesAsync();

            return Ok();
        }
    }
}