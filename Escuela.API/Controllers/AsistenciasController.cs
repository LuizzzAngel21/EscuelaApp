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

        [HttpGet("Diaria/{cursoId}")]
        public async Task<ActionResult<IEnumerable<AsistenciaDiariaDto>>> GetHojaAsistencia(
       int cursoId,
       [FromQuery] DateTime fecha,
       [FromQuery] int? seccionId)
        {
            var curso = await _context.Cursos.FindAsync(cursoId);
            if (curso == null) return NotFound("El curso especificado no existe.");

            var query = _context.Matriculas
                .Include(m => m.Estudiante)
                .Where(m => m.GradoId == curso.GradoId) 
                .AsQueryable();

            if (seccionId.HasValue)
            {
                query = query.Where(m => m.SeccionId == seccionId.Value);
            }

            var matriculas = await query
                .OrderBy(m => m.Estudiante.Apellidos)
                .ToListAsync();

            if (!matriculas.Any())
            {
                return Ok(new List<AsistenciaDiariaDto>());
            }

            var asistenciasHoy = await _context.Asistencias
                .Where(a => a.CursoId == cursoId && a.Fecha.Date == fecha.Date)
                .ToListAsync();

            var hojaAsistencia = matriculas.Select(m =>
            {
                var asistencia = asistenciasHoy.FirstOrDefault(a => a.MatriculaId == m.Id);

                return new AsistenciaDiariaDto
                {
                    MatriculaId = m.Id,
                    EstudianteNombre = m.Estudiante != null
                        ? $"{m.Estudiante.Apellidos}, {m.Estudiante.Nombres}"
                        : "Desconocido",
                    EstadoId = asistencia != null ? (int)asistencia.Estado : 0, 
                    Observacion = asistencia?.Observacion,
                    YaRegistrado = asistencia != null
                };
            }).ToList();

            return Ok(hojaAsistencia);
        }

        [HttpPost("Masiva")]
        [Authorize(Roles = "Academico,Administrativo")]
        public async Task<ActionResult> PostAsistenciaMasiva([FromBody] List<CrearAsistenciaDto> listaAsistencias)
        {
            if (listaAsistencias == null || !listaAsistencias.Any())
                return BadRequest("La lista de asistencia está vacía.");

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var fechaProceso = listaAsistencias.First().Fecha?.Date ?? DateTime.Today;

                foreach (var dto in listaAsistencias)
                {
                    var asistenciaDb = await _context.Asistencias
                        .FirstOrDefaultAsync(a => a.MatriculaId == dto.MatriculaId
                                               && a.CursoId == dto.CursoId
                                               && a.Fecha.Date == fechaProceso);

                    if (asistenciaDb != null)
                    {
                        asistenciaDb.Estado = dto.Estado;
                        asistenciaDb.Observacion = dto.Observacion;
                        _context.Entry(asistenciaDb).State = EntityState.Modified;
                    }
                    else
                    {
                        var nueva = new Asistencia
                        {
                            MatriculaId = dto.MatriculaId,
                            CursoId = dto.CursoId,
                            Fecha = fechaProceso,
                            Estado = dto.Estado,
                            Observacion = dto.Observacion
                        };
                        _context.Asistencias.Add(nueva);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { mensaje = "Asistencia guardada correctamente." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Error interno al guardar: {ex.Message}");
            }
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
    }
}