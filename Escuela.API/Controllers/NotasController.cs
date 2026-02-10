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
                var userId = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (matricula == null || matricula.Estudiante?.UsuarioId != userId) return Forbid();
            }

            var nombreCurso = await _context.Cursos.Where(c => c.Id == cursoId).Select(c => c.Nombre).FirstOrDefaultAsync() ?? "Desconocido";
            var criterios = await _context.CriteriosEvaluacion.Where(c => c.CursoId == cursoId).ToListAsync();

            if (!criterios.Any())
            {
                return Ok(new PromedioDto { Curso = nombreCurso, PromedioFinal = 0, Estado = "SIN CONFIGURAR", Detalles = new List<DetalleNotaDto>() });
            }

            var notasEstudiante = await _context.Notas
                .Where(n => n.MatriculaId == matriculaId && n.CriterioEvaluacion!.CursoId == cursoId)
                .ToListAsync();

            decimal sumaPonderada = 0;
            decimal pesoEvaluado = 0; 
            var detalles = new List<DetalleNotaDto>();

            foreach (var criterio in criterios)
            {
                var nota = notasEstudiante.FirstOrDefault(n => n.CriterioEvaluacionId == criterio.Id);
                decimal valorNota = 0;

                if (nota != null)
                {
                    valorNota = nota.Valor;
                    sumaPonderada += valorNota * criterio.Peso;
                    pesoEvaluado += criterio.Peso; 
                }

                detalles.Add(new DetalleNotaDto
                {
                    Evaluacion = criterio.Nombre,
                    Peso = criterio.Peso,
                    NotaObtenida = valorNota 
                });
            }

            decimal promedioFinal = 0;
            string estado = "Sin Notas";

            if (pesoEvaluado > 0)
            {
                promedioFinal = sumaPonderada / pesoEvaluado;
                promedioFinal = Math.Round(promedioFinal, 2);
                estado = promedioFinal >= 11 ? "APROBADO" : "DESAPROBADO";
            }

            return Ok(new PromedioDto
            {
                Curso = nombreCurso,
                PromedioFinal = promedioFinal,
                Estado = estado,
                Detalles = detalles
            });
        }

        [HttpGet("BoletaGlobal")]
        public async Task<ActionResult> GetBoletaGlobal()
        {
            var userId = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

            var matricula = await _context.Matriculas
                .Include(m => m.Estudiante)
                .OrderByDescending(m => m.Id)
                .FirstOrDefaultAsync(m => m.Estudiante.UsuarioId == userId);

            if (matricula == null) return Ok(new List<object>());

            var cursosDelGrado = await _context.Cursos
                .Include(c => c.Docente)
                .Where(c => c.GradoId == matricula.GradoId)
                .ToListAsync();

            var notas = await _context.Notas
                .Where(n => n.MatriculaId == matricula.Id)
                .ToListAsync();

            var cursoIds = cursosDelGrado.Select(c => c.Id).ToList();
            var criteriosTodos = await _context.CriteriosEvaluacion
                .Where(c => cursoIds.Contains(c.CursoId))
                .ToListAsync();

            var boleta = new List<object>();

            foreach (var curso in cursosDelGrado)
            {
                var criteriosCurso = criteriosTodos.Where(c => c.CursoId == curso.Id).ToList();

                decimal sumaPonderada = 0;
                decimal pesoAcumulado = 0;

                foreach (var c in criteriosCurso)
                {
                    var nota = notas.FirstOrDefault(n => n.CriterioEvaluacionId == c.Id);
                    if (nota != null)
                    {
                        sumaPonderada += nota.Valor * c.Peso;
                        pesoAcumulado += c.Peso;
                    }
                }

                decimal promedio = 0;
                string estado = "Sin Notas";
                string colorEstado = "secondary"; 

                if (pesoAcumulado > 0)
                {
                    promedio = sumaPonderada / pesoAcumulado; 

                    if (promedio >= 11)
                    {
                        estado = "Aprobado";
                        colorEstado = "success"; 
                    }
                    else
                    {
                        estado = "Reprobado";
                        colorEstado = "danger"; 
                    }
                }

                decimal pesoTotalCurso = criteriosCurso.Sum(c => c.Peso);
                decimal avance = pesoTotalCurso > 0 ? (pesoAcumulado / pesoTotalCurso) * 100 : 0;

                boleta.Add(new
                {
                    Curso = curso.Nombre,
                    Docente = curso.Docente != null ? $"{curso.Docente.Nombres} {curso.Docente.Apellidos}" : "Por asignar",
                    Promedio = Math.Round(promedio, 2),
                    Estado = estado,
                    ColorEstado = colorEstado, 
                    Avance = Math.Round(avance, 0)
                });
            }

            return Ok(boleta);
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