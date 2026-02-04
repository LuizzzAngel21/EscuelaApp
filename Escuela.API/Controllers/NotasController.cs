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
    public class NotasController : ControllerBase
    {
        private readonly EscuelaDbContext _context;

        public NotasController(EscuelaDbContext context)
        {
            _context = context;
        }

        [HttpGet("Matricula/{matriculaId}")]
        public async Task<ActionResult<IEnumerable<NotaDto>>> GetNotasPorMatricula(int matriculaId)
        {
            var esAlumno = User.IsInRole("Estudiantil");
            if (esAlumno)
            {
                var matricula = await _context.Matriculas
                    .Include(m => m.Estudiante)
                    .FirstOrDefaultAsync(m => m.Id == matriculaId);

                var userId = User.FindFirstValue("uid");
                if (matricula == null || matricula.Estudiante?.UsuarioId != userId) return Forbid();
            }

            var notas = await _context.Notas
                .Include(n => n.Matricula!).ThenInclude(m => m.Estudiante)
                .Include(n => n.CriterioEvaluacion)
                .Where(n => n.MatriculaId == matriculaId)
                .Select(n => new NotaDto
                {
                    Id = n.Id,
                    Estudiante = (n.Matricula != null && n.Matricula.Estudiante != null)
                        ? n.Matricula.Estudiante.Nombres
                        : "N/A",
                    Evaluacion = n.CriterioEvaluacion != null ? n.CriterioEvaluacion.Nombre : "Sin Criterio",
                    Valor = n.Valor
                })
                .ToListAsync();

            return Ok(notas);
        }

        [HttpPost]
        [Authorize(Roles = "Academico,Administrativo")]
        public async Task<ActionResult<NotaDto>> PostNota(CrearNotaDto dto)
        {
            var matricula = await _context.Matriculas.FindAsync(dto.MatriculaId);
            if (matricula == null) return BadRequest("La matrícula no existe.");

            var criterio = await _context.CriteriosEvaluacion
                .Include(c => c.Curso)
                .FirstOrDefaultAsync(c => c.Id == dto.CriterioEvaluacionId);

            if (criterio == null) return BadRequest("El criterio de evaluación no existe.");

            if (criterio.Curso == null) return BadRequest("El criterio no tiene un curso asignado válido.");

            if (matricula.GradoId != criterio.Curso.GradoId)
            {
                return BadRequest("El alumno no pertenece al grado de este curso.");
            }

            var notaExiste = await _context.Notas.AnyAsync(n => n.MatriculaId == dto.MatriculaId && n.CriterioEvaluacionId == dto.CriterioEvaluacionId);
            if (notaExiste) return BadRequest("El alumno ya tiene nota en este criterio. Use PUT para editar.");

            var nuevaNota = new Nota
            {
                MatriculaId = dto.MatriculaId,
                CriterioEvaluacionId = dto.CriterioEvaluacionId,
                Valor = dto.Valor
            };

            _context.Notas.Add(nuevaNota);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Nota registrada correctamente", nota = dto.Valor });
        }

        [HttpGet("Promedio")]
        public async Task<ActionResult<PromedioDto>> GetPromedioCurso(
            [FromQuery] int matriculaId,
            [FromQuery] int cursoId)
        {
            var esAlumno = User.IsInRole("Estudiantil");
            if (esAlumno)
            {
                var matricula = await _context.Matriculas.Include(m => m.Estudiante).FirstOrDefaultAsync(m => m.Id == matriculaId);
                var userId = User.FindFirstValue("uid");
                if (matricula == null || matricula.Estudiante?.UsuarioId != userId) return Forbid();
            }

            var criterios = await _context.CriteriosEvaluacion
                .Where(c => c.CursoId == cursoId)
                .ToListAsync();

            if (!criterios.Any()) return BadRequest("Este curso no tiene criterios configurados.");

            var notasEstudiante = await _context.Notas
                .Where(n => n.MatriculaId == matriculaId && n.CriterioEvaluacion!.CursoId == cursoId)
                .ToListAsync();

            decimal sumaPonderada = 0;
            decimal sumaPesos = 0;
            var detalles = new List<DetalleNotaDto>();

            foreach (var criterio in criterios)
            {
                var nota = notasEstudiante.FirstOrDefault(n => n.CriterioEvaluacionId == criterio.Id);
                decimal valorNota = nota != null ? nota.Valor : 0;

                sumaPonderada += valorNota * criterio.Peso;
                sumaPesos += criterio.Peso;

                detalles.Add(new DetalleNotaDto
                {
                    Evaluacion = criterio.Nombre,
                    Peso = criterio.Peso,
                    NotaObtenida = valorNota
                });
            }

            if (sumaPesos == 0) return BadRequest("Error: Los pesos del curso suman 0.");

            decimal promedioFinal = sumaPonderada / sumaPesos;
            promedioFinal = Math.Round(promedioFinal, 2);
            string estado = promedioFinal >= 11 ? "APROBADO" : "DESAPROBADO";

            var nombreCurso = await _context.Cursos
                .Where(c => c.Id == cursoId)
                .Select(c => c.Nombre)
                .FirstOrDefaultAsync() ?? "Desconocido";

            return Ok(new PromedioDto
            {
                Curso = nombreCurso,
                PromedioFinal = promedioFinal,
                Estado = estado,
                Detalles = detalles
            });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Academico,Administrativo")]
        public async Task<IActionResult> PutNota(int id, [FromBody] CrearNotaDto dto)
        {
            var nota = await _context.Notas.FindAsync(id);
            if (nota == null) return NotFound("Nota no encontrada.");

            nota.Valor = dto.Valor;
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Nota actualizada", nuevoValor = nota.Valor });
        }
    }
}