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
    [Authorize(Roles = "Academico,Administrativo")]
    public class CriteriosController : ControllerBase
    {
        private readonly EscuelaDbContext _context;

        public CriteriosController(EscuelaDbContext context)
        {
            _context = context;
        }

        [HttpGet("Curso/{cursoId}")]
        public async Task<ActionResult<IEnumerable<CriterioDto>>> GetCriteriosPorCurso(int cursoId)
        {
            var criterios = await _context.CriteriosEvaluacion
                .Include(c => c.Curso)
                .Where(c => c.CursoId == cursoId)
                .OrderBy(c => c.NumeroPeriodo)
                .ThenBy(c => c.Nombre)
                .Select(c => new CriterioDto
                {
                    Id = c.Id,
                    Nombre = c.Nombre,
                    Peso = c.Peso,
                    Curso = c.Curso != null ? c.Curso.Nombre : "N/A",
                    NumeroPeriodo = c.NumeroPeriodo
                })
                .ToListAsync();

            return Ok(criterios);
        }

        [HttpPost]
        public async Task<ActionResult<CriterioDto>> PostCriterio(CrearCriterioDto dto)
        {
            var existeCurso = await _context.Cursos.AnyAsync(c => c.Id == dto.CursoId);
            if (!existeCurso) return BadRequest("El curso no existe.");

            if (dto.NumeroPeriodo < 1 || dto.NumeroPeriodo > 4)
                return BadRequest("El periodo debe ser entre 1 y 4.");

            var nuevoCriterio = new CriterioEvaluacion
            {
                Nombre = dto.Nombre,
                Peso = dto.Peso,
                CursoId = dto.CursoId,
                NumeroPeriodo = dto.NumeroPeriodo
            };

            _context.CriteriosEvaluacion.Add(nuevoCriterio);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Criterio creado", id = nuevoCriterio.Id });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCriterio(int id)
        {
            var criterio = await _context.CriteriosEvaluacion.FindAsync(id);
            if (criterio == null) return NotFound();

            var tieneNotas = await _context.Notas.AnyAsync(n => n.CriterioEvaluacionId == id);
            if (tieneNotas) return BadRequest("No se puede eliminar el criterio porque ya hay notas registradas.");

            _context.CriteriosEvaluacion.Remove(criterio);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}