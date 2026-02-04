using Escuela.API.Dtos;
using Escuela.Core.Entities;
using Escuela.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Escuela.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AsistenciasController : ControllerBase
    {
        private readonly EscuelaDbContext _context;

        public AsistenciasController(EscuelaDbContext context)
        {
            _context = context;
        }

        [HttpGet("Alumno/{matriculaId}")]
        public async Task<ActionResult<IEnumerable<AsistenciaDto>>> GetAsistenciasPorAlumno(int matriculaId)
        {
            var asistencias = await _context.Asistencias
                .Include(a => a.Matricula!).ThenInclude(m => m.Estudiante)
                .Include(a => a.Curso) 
                .Where(a => a.MatriculaId == matriculaId)
                .Select(a => new AsistenciaDto
                {
                    Id = a.Id,
                    Estudiante = a.Matricula!.Estudiante != null ? $"{a.Matricula.Estudiante.Nombres} {a.Matricula.Estudiante.Apellidos}" : "N/A",
                    Curso = a.Curso != null ? a.Curso.Nombre : "N/A",
                    Fecha = a.Fecha.ToString("dd/MM/yyyy"),
                    Estado = a.Estado.ToString(),
                    Observacion = a.Observacion ?? ""
                })
                .ToListAsync();

            return Ok(asistencias);
        }

        [HttpPost]
        [Authorize(Roles = "Academico,Administrativo")]
        public async Task<ActionResult<AsistenciaDto>> PostAsistencia(CrearAsistenciaDto dto)
        {
            var existeMatricula = await _context.Matriculas.AnyAsync(m => m.Id == dto.MatriculaId);
            if (!existeMatricula) return BadRequest("La matrícula no existe.");

            var existeCurso = await _context.Cursos.AnyAsync(c => c.Id == dto.CursoId);
            if (!existeCurso) return BadRequest("El curso no existe.");

            var yaRegistroHoy = await _context.Asistencias
                .AnyAsync(a => a.MatriculaId == dto.MatriculaId &&
                               a.CursoId == dto.CursoId &&
                               a.Fecha.Date == DateTime.Today);

            if (yaRegistroHoy) return BadRequest("El estudiante ya tiene asistencia registrada para este curso el día de hoy.");

            var nuevaAsistencia = new Asistencia
            {
                MatriculaId = dto.MatriculaId,
                CursoId = dto.CursoId,
                Fecha = DateTime.Now,
                Estado = dto.Estado,
                Observacion = dto.Observacion
            };

            _context.Asistencias.Add(nuevaAsistencia);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Asistencia registrada correctamente", estado = nuevaAsistencia.Estado.ToString() });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Academico,Administrativo")]
        public async Task<IActionResult> PutAsistencia(int id, [FromBody] CrearAsistenciaDto dto)
        {
            var asistencia = await _context.Asistencias.FindAsync(id);

            if (asistencia == null)
            {
                return NotFound("La asistencia especificada no existe.");
            }

            asistencia.Estado = dto.Estado;
            asistencia.Observacion = dto.Observacion;

            _context.Entry(asistencia).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.Asistencias.AnyAsync(a => a.Id == id))
                    return NotFound();
                else
                    throw;
            }

            return Ok(new { mensaje = "Asistencia actualizada correctamente", estado = asistencia.Estado.ToString() });
        }
    }
}