using Escuela.API.Dtos;
using Escuela.Core.Entities;
using Escuela.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Escuela.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class IncidenciasController : ControllerBase
    {
        private readonly EscuelaDbContext _context;

        public IncidenciasController(EscuelaDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<IncidenciaDto>>> GetIncidencias(
            [FromQuery] int? estudianteId, 
            [FromQuery] string? usuarioId)  
        {
            var userId = User.FindFirstValue("uid");
            var esAlumno = User.IsInRole("Estudiantil");
            var esStaff = User.IsInRole("Docente") || User.IsInRole("Administrativo") || User.IsInRole("Psicologo") || User.IsInRole("Academico");

            var query = _context.Incidencias
                .Include(i => i.Estudiante)
                .AsQueryable();

            if (esAlumno)
            {
                query = query.Where(i => i.Estudiante!.UsuarioId == userId);
            }
            else if (esStaff)
            {
                if (estudianteId.HasValue)
                {
                    query = query.Where(i => i.EstudianteId == estudianteId.Value);
                }
                else if (!string.IsNullOrEmpty(usuarioId))
                {
                    var estudiante = await _context.Estudiantes
                        .FirstOrDefaultAsync(e => e.UsuarioId == usuarioId);

                    if (estudiante != null)
                    {
                        query = query.Where(i => i.EstudianteId == estudiante.Id);
                    }
                    else
                    {
                        return Ok(new List<IncidenciaDto>());
                    }
                }
            }

            var lista = await query
                .OrderByDescending(i => i.Fecha)
                .Select(i => new IncidenciaDto
                {
                    Id = i.Id,
                    Fecha = i.Fecha.ToString("dd/MM/yyyy HH:mm"),
                    Titulo = i.Titulo,
                    Descripcion = i.Descripcion,
                    Nivel = i.Nivel,
                    Estado = i.Estado,
                    NombreReportador = i.NombreReportador,
                    NombreEstudiante = $"{i.Estudiante!.Nombres} {i.Estudiante.Apellidos}"
                })
                .ToListAsync();

            return Ok(lista);
        }

        [HttpPost]
        [Authorize(Roles = "Docente,Administrativo,Psicologo,Academico")]
        public async Task<IActionResult> Reportar(ReportarIncidenciaHibridaDto dto)
        {
            var userId = User.FindFirstValue("uid");
            string nombreReal = "Staff";
            var docente = await _context.Docentes
                .FirstOrDefaultAsync(d => d.UsuarioId == userId);

            if (docente != null)
            {
                nombreReal = $"{docente.Nombres} {docente.Apellidos}";
            }
            else
            {
                var psicologo = await _context.Psicologos
                    .FirstOrDefaultAsync(p => p.UsuarioId == userId);

                if (psicologo != null)
                {
                    nombreReal = $"{psicologo.Nombres} {psicologo.Apellidos}";
                }
                else
                {
                    nombreReal = User.Identity?.Name ?? "Administrativo";
                }
            }

            int? idFinal = dto.EstudianteId;
            if ((idFinal == null || idFinal == 0) && !string.IsNullOrEmpty(dto.UsuarioId))
            {
                var est = await _context.Estudiantes.FirstOrDefaultAsync(e => e.UsuarioId == dto.UsuarioId);
                if (est != null) idFinal = est.Id;
            }

            if (idFinal == null || idFinal == 0) return BadRequest("Estudiante no válido.");

            var incidencia = new Incidencia
            {
                EstudianteId = idFinal.Value,
                ReportadoPorId = userId,
                NombreReportador = nombreReal, 
                Titulo = dto.Titulo,
                Descripcion = dto.Descripcion,
                Nivel = dto.Nivel,
                Fecha = DateTime.Now,
                Estado = "Abierto"
            };

            _context.Incidencias.Add(incidencia);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Incidencia reportada correctamente." });
        }
    }
}