using Escuela.API.Dtos;
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
        public async Task<ActionResult<IEnumerable<IncidenciaDto>>> GetIncidencias([FromQuery] int? estudianteId)
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
            else if (esStaff && estudianteId.HasValue)
            {
                query = query.Where(i => i.EstudianteId == estudianteId);
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
        public async Task<IActionResult> Reportar(CrearIncidenciaDto dto)
        {
            var userId = User.FindFirstValue("uid");
            var userName = User.Identity?.Name ?? "Staff";

            var estudiante = await _context.Estudiantes.FindAsync(dto.EstudianteId);
            if (estudiante == null) return NotFound("Estudiante no encontrado.");

            var incidencia = new Incidencia
            {
                EstudianteId = dto.EstudianteId,
                ReportadoPorId = userId,
                NombreReportador = userName,
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