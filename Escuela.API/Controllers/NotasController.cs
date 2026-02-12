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

        [HttpGet("Sabana")]
        [Authorize(Roles = "Academico,Administrativo")]
        public async Task<ActionResult<SabanaResponseDto>> GetSabanaDocente(
            [FromQuery] int cursoId,
            [FromQuery] int seccionId)
        {
            var curso = await _context.Cursos.FindAsync(cursoId);
            if (curso == null) return NotFound("Curso no encontrado.");

            var criterios = await _context.CriteriosEvaluacion
                .Where(c => c.CursoId == cursoId)
                .OrderBy(c => c.NumeroPeriodo)
                .ThenBy(c => c.Id)
                .Select(c => new CriterioDto
                {
                    Id = c.Id,
                    Nombre = c.Nombre,
                    Peso = c.Peso,
                    NumeroPeriodo = c.NumeroPeriodo
                })
                .ToListAsync();

            var estructura = criterios
                .GroupBy(c => c.NumeroPeriodo)
                .Select(g => new PeriodoHeaderDto
                {
                    NumeroPeriodo = g.Key,
                    Nombre = $"Bimestre {ToRoman(g.Key)}",
                    Criterios = g.ToList()
                })
                .OrderBy(p => p.NumeroPeriodo)
                .ToList();

            var queryMatriculas = _context.Matriculas
                .Include(m => m.Estudiante)
                .Where(m => m.GradoId == curso.GradoId);

            if (seccionId > 0)
            {
                queryMatriculas = queryMatriculas.Where(m => m.SeccionId == seccionId);
            }

            var matriculas = await queryMatriculas
                .OrderBy(m => m.Estudiante.Apellidos)
                .ToListAsync();

            var matriculaIds = matriculas.Select(m => m.Id).ToList();
            var notasDB = await _context.Notas
                .Where(n => matriculaIds.Contains(n.MatriculaId) && n.CriterioEvaluacion.CursoId == cursoId)
                .ToListAsync();

            var alumnosSabana = new List<AlumnoSabanaDto>();

            foreach (var mat in matriculas)
            {
                var notasDelAlumno = notasDB.Where(n => n.MatriculaId == mat.Id).ToList();
                var promediosPorPeriodo = new Dictionary<int, decimal>();

                foreach (var periodo in estructura)
                {
                    decimal sumaPonderada = 0;
                    decimal pesoTotalEvaluado = 0;

                    foreach (var crit in periodo.Criterios)
                    {
                        var nota = notasDelAlumno.FirstOrDefault(n => n.CriterioEvaluacionId == crit.Id);
                        if (nota != null)
                        {
                            sumaPonderada += nota.Valor * crit.Peso;
                            pesoTotalEvaluado += crit.Peso;
                        }
                    }

                    if (pesoTotalEvaluado > 0)
                    {
                        decimal promedioBimestre = sumaPonderada / pesoTotalEvaluado;
                        promediosPorPeriodo[periodo.NumeroPeriodo] = Math.Round(promedioBimestre, 2);
                    }
                }

                decimal promedioFinal = promediosPorPeriodo.Any()
                    ? Math.Round(promediosPorPeriodo.Values.Average(), 2)
                    : 0;

                alumnosSabana.Add(new AlumnoSabanaDto
                {
                    MatriculaId = mat.Id,
                    EstudianteNombre = $"{mat.Estudiante.Apellidos}, {mat.Estudiante.Nombres}",
                    Notas = notasDelAlumno.Select(n => new NotaRegistroDto
                    {
                        CriterioId = n.CriterioEvaluacionId,
                        Valor = n.Valor
                    }).ToList(),
                    PromediosPorPeriodo = promediosPorPeriodo,
                    PromedioFinalAnual = promedioFinal
                });
            }

            return Ok(new SabanaResponseDto
            {
                Estructura = estructura,
                Alumnos = alumnosSabana
            });
        }

        [HttpGet("MisNotas/{cursoId}")]
        public async Task<ActionResult<EstudianteCursoDetalleDto>> GetMisNotasCurso(int cursoId)
        {
            var userId = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            var esEstudiante = User.IsInRole("Estudiantil");

            Matricula matricula = null;
            if (esEstudiante)
            {
                matricula = await _context.Matriculas
                    .Include(m => m.Estudiante)
                    .FirstOrDefaultAsync(m => m.Estudiante.UsuarioId == userId);
            }

            if (matricula == null) return Forbid();

            var curso = await _context.Cursos
                .Include(c => c.Docente)
                .FirstOrDefaultAsync(c => c.Id == cursoId);
            if (curso == null) return NotFound("Curso no encontrado");

            var criterios = await _context.CriteriosEvaluacion
                .Where(c => c.CursoId == cursoId)
                .OrderBy(c => c.NumeroPeriodo)
                .ToListAsync();

            var notas = await _context.Notas
                .Where(n => n.MatriculaId == matricula.Id && n.CriterioEvaluacion.CursoId == cursoId)
                .ToListAsync();

            var respuesta = new EstudianteCursoDetalleDto
            {
                CursoNombre = curso.Nombre,
                DocenteNombre = curso.Docente != null ? $"{curso.Docente.Nombres} {curso.Docente.Apellidos}" : "Por Asignar",
                PromedioFinalAcumulado = 0,
                Periodos = new List<PeriodoAlumnoDto>()
            };

            var gruposPeriodo = criterios.GroupBy(c => c.NumeroPeriodo).OrderBy(g => g.Key);

            decimal sumaPromediosBimestrales = 0;
            int cantidadBimestresConNota = 0;

            foreach (var grupo in gruposPeriodo)
            {
                var periodoDto = new PeriodoAlumnoDto
                {
                    NumeroPeriodo = grupo.Key,
                    NombrePeriodo = $"Bimestre {ToRoman(grupo.Key)}",
                    Notas = new List<DetalleNotaAlumnoDto>()
                };

                decimal sumaPonderada = 0;
                decimal pesoEvaluado = 0;

                foreach (var crit in grupo)
                {
                    var notaDb = notas.FirstOrDefault(n => n.CriterioEvaluacionId == crit.Id);

                    periodoDto.Notas.Add(new DetalleNotaAlumnoDto
                    {
                        Evaluacion = crit.Nombre,
                        Peso = crit.Peso,
                        Valor = notaDb?.Valor 
                    });

                    if (notaDb != null)
                    {
                        sumaPonderada += notaDb.Valor * crit.Peso;
                        pesoEvaluado += crit.Peso;
                    }
                }

                if (pesoEvaluado > 0)
                {
                    periodoDto.PromedioPeriodo = Math.Round(sumaPonderada / pesoEvaluado, 2);
                    sumaPromediosBimestrales += periodoDto.PromedioPeriodo;
                    cantidadBimestresConNota++;
                }

                respuesta.Periodos.Add(periodoDto);
            }

            if (cantidadBimestresConNota > 0)
            {
                respuesta.PromedioFinalAcumulado = Math.Round(sumaPromediosBimestrales / cantidadBimestresConNota, 2);
                respuesta.EstadoFinal = respuesta.PromedioFinalAcumulado >= 11 ? "Aprobado" : "En Riesgo";
            }

            return Ok(respuesta);
        }

        [HttpPost("Masiva")]
        [Authorize(Roles = "Academico,Administrativo")]
        public async Task<ActionResult> PostNotasMasiva([FromBody] List<GuardarNotaMasivaDto> listaNotas)
        {
            if (listaNotas == null || !listaNotas.Any())
                return BadRequest("No hay notas para guardar.");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                foreach (var dto in listaNotas)
                {
                    if (dto.Valor < 0 || dto.Valor > 20)
                        throw new Exception($"Nota inválida: {dto.Valor}");

                    var notaDb = await _context.Notas
                        .FirstOrDefaultAsync(n => n.MatriculaId == dto.MatriculaId && n.CriterioEvaluacionId == dto.CriterioId);

                    if (notaDb != null)
                    {
                        if (notaDb.Valor != dto.Valor)
                        {
                            notaDb.Valor = dto.Valor;
                            _context.Entry(notaDb).State = EntityState.Modified;
                        }
                    }
                    else
                    {
                        _context.Notas.Add(new Nota
                        {
                            MatriculaId = dto.MatriculaId,
                            CriterioEvaluacionId = dto.CriterioId,
                            Valor = dto.Valor
                        });
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(new { mensaje = "Notas actualizadas correctamente." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Error al guardar: {ex.Message}");
            }
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

            var cursos = await _context.Cursos
                .Include(c => c.Docente)
                .Where(c => c.GradoId == matricula.GradoId)
                .ToListAsync();

            var notas = await _context.Notas
                .Include(n => n.CriterioEvaluacion)
                .Where(n => n.MatriculaId == matricula.Id)
                .ToListAsync();

            var boleta = new List<object>();

            foreach (var curso in cursos)
            {
                var notasCurso = notas.Where(n => n.CriterioEvaluacion.CursoId == curso.Id).ToList();

                decimal suma = 0;
                decimal pesoTotal = 0;

                foreach (var n in notasCurso)
                {
                    suma += n.Valor * n.CriterioEvaluacion.Peso;
                    pesoTotal += n.CriterioEvaluacion.Peso;
                }

                decimal promedio = pesoTotal > 0 ? Math.Round(suma / pesoTotal, 2) : 0;

                boleta.Add(new
                {
                    CursoId = curso.Id,
                    Curso = curso.Nombre,
                    Docente = curso.Docente?.Nombres ?? "N/A",
                    Promedio = promedio,
                    Estado = promedio >= 11 ? "Aprobado" : "Reprobado"
                });
            }

            return Ok(boleta);
        }

        private string ToRoman(int number)
        {
            return number switch { 1 => "I", 2 => "II", 3 => "III", 4 => "IV", _ => number.ToString() };
        }
    }
}