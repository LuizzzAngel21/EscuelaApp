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
    public class HorariosController : ControllerBase
    {
        private readonly EscuelaDbContext _context;

        public HorariosController(EscuelaDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<HorarioDto>>> GetHorarios(
            [FromQuery] int? gradoId,
            [FromQuery] int? docenteId)
        {
            var userId = User.FindFirstValue("uid");
            var esAdmin = User.IsInRole("Administrativo");
            var esProfe = User.IsInRole("Academico");
            var esAlumno = User.IsInRole("Estudiantil");

            var query = _context.Horarios
                .Include(h => h.Curso)
                .ThenInclude(c => c.Grado)
                .Include(h => h.Curso)
                .ThenInclude(c => c.Docente)
                .AsQueryable();

            if (esAlumno)
            {
                query = query.Where(h => h.Curso!.Grado!.Matriculas
                    .Any(m => m.Estudiante!.UsuarioId == userId));
            }
            else if (esProfe)
            {
                query = query.Where(h => h.Curso!.Docente!.UsuarioId == userId);
            }
            else if (esAdmin)
            {
                if (gradoId.HasValue) query = query.Where(h => h.Curso!.GradoId == gradoId.Value);
                if (docenteId.HasValue) query = query.Where(h => h.Curso!.DocenteId == docenteId.Value);
            }

            var horarios = await query
                .OrderBy(h => h.DiaSemana)
                .ThenBy(h => h.HoraInicio)
                .Select(h => new HorarioDto
                {
                    Id = h.Id,
                    Dia = h.DiaSemana,
                    HoraInicio = h.HoraInicio.ToString(@"hh\:mm"),
                    HoraFin = h.HoraFin.ToString(@"hh\:mm"),
                    Curso = h.Curso != null ? h.Curso.Nombre : "Sin Curso",
                    Grado = h.Curso != null && h.Curso.Grado != null ? h.Curso.Grado.Nombre : "N/A"
                }).ToListAsync();

            return Ok(horarios);
        }

        [HttpPost]
        [Authorize(Roles = "Administrativo,Academico")]
        public async Task<ActionResult<HorarioDto>> PostHorario(CrearHorarioDto dto)
        {
            if (!TimeSpan.TryParse(dto.HoraInicio, out var inicio) || !TimeSpan.TryParse(dto.HoraFin, out var fin))
                return BadRequest("El formato de hora debe ser HH:mm (ej: 08:30).");

            if (fin <= inicio) return BadRequest("La hora de fin debe ser posterior al inicio.");

            if (!await _context.Cursos.AnyAsync(c => c.Id == dto.CursoId))
                return BadRequest("El curso especificado no existe.");

            if (await ExisteCruceHorario(dto.CursoId, dto.DiaSemana, inicio, fin))
                return BadRequest($"Conflicto: El docente o el grado ya tienen clases el {dto.DiaSemana} en ese horario.");

            var nuevoHorario = new Horario
            {
                DiaSemana = dto.DiaSemana,
                HoraInicio = inicio,
                HoraFin = fin,
                CursoId = dto.CursoId
            };

            _context.Horarios.Add(nuevoHorario);
            await _context.SaveChangesAsync();

            var horarioDb = await _context.Horarios
                .Include(h => h.Curso).ThenInclude(c => c.Grado)
                .FirstAsync(h => h.Id == nuevoHorario.Id);

            var respuesta = new HorarioDto
            {
                Id = horarioDb.Id,
                Dia = horarioDb.DiaSemana,
                HoraInicio = horarioDb.HoraInicio.ToString(@"hh\:mm"),
                HoraFin = horarioDb.HoraFin.ToString(@"hh\:mm"),
                Curso = horarioDb.Curso?.Nombre ?? "N/A",
                Grado = horarioDb.Curso?.Grado?.Nombre ?? "N/A"
            };

            return CreatedAtAction(nameof(GetHorarios), new { id = respuesta.Id }, respuesta);
        }

        [HttpPost("Masivo")]
        [Authorize(Roles = "Administrativo")]
        public async Task<ActionResult> PostHorariosMasivos(List<CrearHorarioDto> dtos)
        {
            if (dtos == null || !dtos.Any()) return BadRequest("Lista vacía.");

            var cursoIds = dtos.Select(d => d.CursoId).Distinct().ToList();
            var cursosInfo = await _context.Cursos
                .Where(c => cursoIds.Contains(c.Id))
                .Select(c => new { c.Id, c.GradoId, c.DocenteId })
                .ToListAsync();

            var horariosExistentes = await _context.Horarios
                .Include(h => h.Curso)
                .ToListAsync();

            var nuevosHorarios = new List<Horario>();
            var errores = new List<string>();

            foreach (var dto in dtos)
            {
                if (!TimeSpan.TryParse(dto.HoraInicio, out var inicio) || !TimeSpan.TryParse(dto.HoraFin, out var fin))
                {
                    errores.Add($"Hora inválida en curso {dto.CursoId}"); continue;
                }

                var curso = cursosInfo.FirstOrDefault(c => c.Id == dto.CursoId);
                if (curso == null) { errores.Add($"Curso {dto.CursoId} no existe"); continue; }

                bool cruce = horariosExistentes.Any(h => h.DiaSemana == dto.DiaSemana &&
                                                        (h.Curso!.GradoId == curso.GradoId || h.Curso.DocenteId == curso.DocenteId) &&
                                                        (inicio < h.HoraFin && fin > h.HoraInicio))
                             || nuevosHorarios.Any(h => h.DiaSemana == dto.DiaSemana &&
                                                       (cursosInfo.First(c => c.Id == h.CursoId).GradoId == curso.GradoId) &&
                                                       (inicio < h.HoraFin && fin > h.HoraInicio));

                if (cruce) { errores.Add($"Cruce detectado para el curso {dto.CursoId} el {dto.DiaSemana}"); continue; }

                nuevosHorarios.Add(new Horario
                {
                    DiaSemana = dto.DiaSemana,
                    HoraInicio = inicio,
                    HoraFin = fin,
                    CursoId = dto.CursoId
                });
            }

            if (errores.Any()) return BadRequest(new { mensaje = "Errores en la carga", detalles = errores });

            if (nuevosHorarios.Any())
            {
                _context.Horarios.AddRange(nuevosHorarios);
                await _context.SaveChangesAsync();
            }

            return Ok(new { mensaje = $"Se registraron {nuevosHorarios.Count} horarios correctamente." });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrativo")]
        public async Task<IActionResult> DeleteHorario(int id)
        {
            var horario = await _context.Horarios.FindAsync(id);
            if (horario == null) return NotFound();

            _context.Horarios.Remove(horario);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private async Task<bool> ExisteCruceHorario(int cursoId, string dia, TimeSpan inicio, TimeSpan fin)
        {
            var curso = await _context.Cursos.FindAsync(cursoId);
            if (curso == null) return false;

            return await _context.Horarios
                .Include(h => h.Curso)
                .AnyAsync(h => h.DiaSemana == dia &&
                              (h.Curso.GradoId == curso.GradoId || h.Curso.DocenteId == curso.DocenteId) &&
                              (inicio < h.HoraFin && fin > h.HoraInicio));
        }
    }
}