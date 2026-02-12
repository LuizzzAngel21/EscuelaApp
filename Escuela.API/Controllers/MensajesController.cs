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
                var miMatricula = await _context.Matriculas.Include(m => m.Grado)
                    .OrderByDescending(m => m.Id).FirstOrDefaultAsync(m => m.Estudiante!.UsuarioId == userId);

                if (miMatricula != null)
                {
                    var misProfesores = await _context.Cursos
                        .Where(c => c.GradoId == miMatricula.GradoId)
                        .Include(c => c.Docente).Select(c => c.Docente).Distinct().ToListAsync();

                    foreach (var profe in misProfesores)
                        if (profe != null) listaDestinatarios.Add(new DestinatarioDto { UsuarioId = profe.UsuarioId, NombreCompleto = $"{profe.Nombres} {profe.Apellidos}", Rol = "Mis Docentes" });
                }

                var psicologos = await _context.Psicologos.ToListAsync();
                listaDestinatarios.AddRange(psicologos.Select(p => new DestinatarioDto { UsuarioId = p.UsuarioId, NombreCompleto = $"{p.Nombres} {p.Apellidos}", Rol = "Psicología" }));
            }
            else if (esDocente)
            {
                var misCursos = await _context.Cursos
                    .Where(c => c.Docente!.UsuarioId == userId)
                    .Include(c => c.Grado)
                    .ToListAsync();

                var gradosIds = misCursos.Select(c => c.GradoId).Distinct().ToList();

                var misAlumnos = await _context.Matriculas
                    .Include(m => m.Estudiante)
                    .Include(m => m.Grado)
                    .Include(m => m.Seccion)
                    .Where(m => gradosIds.Contains(m.GradoId) && m.Estudiante != null)
                    .OrderBy(m => m.GradoId).ThenBy(m => m.SeccionId).ThenBy(m => m.Estudiante!.Apellidos)
                    .ToListAsync();

                foreach (var mat in misAlumnos)
                {
                    string nombreSalon = $"{mat.Grado?.Nombre ?? "Grado"} - {mat.Seccion?.Nombre ?? "Gral"}";

                    if (mat.Estudiante != null)
                    {
                        listaDestinatarios.Add(new DestinatarioDto
                        {
                            UsuarioId = mat.Estudiante.UsuarioId,
                            NombreCompleto = $"{mat.Estudiante.Apellidos}, {mat.Estudiante.Nombres}",
                            Rol = nombreSalon 
                        });
                    }
                }
            }

            var administrativos = await _userManager.GetUsersInRoleAsync("Administrativo");
            foreach (var admin in administrativos)
                listaDestinatarios.Add(new DestinatarioDto { UsuarioId = admin.Id, NombreCompleto = admin.UserName ?? "Administrador", Rol = "Soporte Administrativo" });

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
                }).ToListAsync();
            return Ok(mensajes);
        }

        [HttpGet("Salida")]
        public async Task<ActionResult<IEnumerable<MensajeDto>>> GetSalida()
        {
            var userId = User.FindFirstValue("uid");
            var mensajesDb = await _context.Mensajes
                .Where(m => m.RemitenteId == userId)
                .OrderByDescending(m => m.FechaEnvio)
                .ToListAsync();

            var resultado = new List<MensajeDto>();
            foreach (var m in mensajesDb)
            {
                string nombreDestino = await ObtenerNombrePersona(m.DestinatarioId);
                resultado.Add(new MensajeDto
                {
                    Id = m.Id,
                    Asunto = m.Asunto,
                    Contenido = m.Contenido,
                    Fecha = m.FechaEnvio.ToString("dd/MM/yyyy HH:mm"),
                    Leido = m.Leido,
                    RemitenteNombre = "Mí",
                    DestinatarioNombre = nombreDestino,
                    ArchivoUrl = m.ArchivoAdjuntoUrl,
                    YoSoyRemitente = true
                });
            }
            return Ok(resultado);
        }

        [HttpPost]
        public async Task<ActionResult> Enviar(CrearMensajeDto dto)
        {
            var userId = User.FindFirstValue("uid");
            string nombreRemitenteReal = "Usuario";

            var estudiante = await _context.Estudiantes.FirstOrDefaultAsync(e => e.UsuarioId == userId);
            if (estudiante != null) nombreRemitenteReal = $"{estudiante.Nombres} {estudiante.Apellidos}";
            else
            {
                var docente = await _context.Docentes.FirstOrDefaultAsync(d => d.UsuarioId == userId);
                if (docente != null) nombreRemitenteReal = $"{docente.Nombres} {docente.Apellidos}";
                else nombreRemitenteReal = await ObtenerNombrePersona(userId);
            }

            var nuevoMensaje = new Mensaje
            {
                RemitenteId = userId,
                NombreRemitente = nombreRemitenteReal,
                DestinatarioId = dto.DestinatarioId,
                Asunto = dto.Asunto,
                Contenido = dto.Contenido,
                FechaEnvio = DateTime.Now,
                Leido = false,
                ArchivoAdjuntoUrl = dto.ArchivoAdjuntoUrl
            };

            _context.Mensajes.Add(nuevoMensaje);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Mensaje enviado." });
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

        private async Task<string> ObtenerNombrePersona(string userId)
        {
            var est = await _context.Estudiantes.FirstOrDefaultAsync(e => e.UsuarioId == userId);
            if (est != null) return $"{est.Nombres} {est.Apellidos}";

            var doc = await _context.Docentes.FirstOrDefaultAsync(d => d.UsuarioId == userId);
            if (doc != null) return $"{doc.Nombres} {doc.Apellidos}";

            var psi = await _context.Psicologos.FirstOrDefaultAsync(p => p.UsuarioId == userId);
            if (psi != null) return $"{psi.Nombres} {psi.Apellidos}";

            var user = await _userManager.FindByIdAsync(userId);
            if (user != null) return user.UserName ?? "Usuario";

            return "Desconocido";
        }
    }
}