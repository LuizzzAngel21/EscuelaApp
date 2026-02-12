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
    public class CursosController : ControllerBase
    {
        private readonly EscuelaDbContext _context;

        public CursosController(EscuelaDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CursoDto>>> GetCursos()
        {
            var userId = User.FindFirstValue("uid");
            var esEstudiante = User.IsInRole("Estudiantil");
            var esDocente = User.IsInRole("Academico");

            var query = _context.Cursos
                .Include(c => c.Grado)
                .Include(c => c.Docente)
                .AsQueryable();

            if (esEstudiante)
            {
                var matricula = await _context.Matriculas
                    .OrderByDescending(m => m.FechaMatricula)
                    .FirstOrDefaultAsync(m => m.Estudiante!.UsuarioId == userId);

                if (matricula == null) return Ok(new List<CursoDto>());
                query = query.Where(c => c.GradoId == matricula.GradoId);
            }
            else if (esDocente)
            {
                query = query.Where(c => c.Docente!.UsuarioId == userId);
            }

            var cursos = await query
                .Select(c => new CursoDto
                {
                    Id = c.Id,
                    Nombre = c.Nombre,
                    Descripcion = c.Descripcion ?? "Sin descripción",
                    Activo = c.Activo,

                    GradoId = c.GradoId,

                    NombreGrado = c.Grado != null ? c.Grado.Nombre : "Grado No Asignado",
                    NombreDocente = c.Docente != null
                        ? $"{c.Docente.Nombres} {c.Docente.Apellidos}"
                        : "Sin Docente Asignado"
                })
                .ToListAsync();

            return Ok(cursos);
        }

        [HttpPost]
        [Authorize(Roles = "Administrativo,Academico")]
        public async Task<ActionResult<CursoDto>> PostCurso(CrearCursoDto dto)
        {
            if (!await _context.Grados.AnyAsync(g => g.Id == dto.GradoId)) return BadRequest("El grado no existe.");
            if (!await _context.Docentes.AnyAsync(d => d.Id == dto.DocenteId)) return BadRequest("El docente no existe.");

            bool existe = await _context.Cursos.AnyAsync(c => c.GradoId == dto.GradoId && c.Nombre == dto.Nombre);
            if (existe) return BadRequest("Ya existe un curso con este nombre en el grado seleccionado.");

            var nuevoCurso = new Curso
            {
                Nombre = dto.Nombre,
                Descripcion = dto.Descripcion,
                GradoId = dto.GradoId,
                DocenteId = dto.DocenteId,
                Activo = true
            };

            _context.Cursos.Add(nuevoCurso);
            await _context.SaveChangesAsync();

            var cursoDb = await _context.Cursos
                .Include(c => c.Grado)
                .Include(c => c.Docente)
                .FirstAsync(c => c.Id == nuevoCurso.Id);

            var respuesta = new CursoDto
            {
                Id = cursoDb.Id,
                Nombre = cursoDb.Nombre,
                Descripcion = cursoDb.Descripcion ?? "Sin descripción",
                Activo = cursoDb.Activo,
                GradoId = cursoDb.GradoId, 
                NombreGrado = cursoDb.Grado?.Nombre ?? "N/A",
                NombreDocente = cursoDb.Docente != null ? $"{cursoDb.Docente.Nombres} {cursoDb.Docente.Apellidos}" : "Sin Docente"
            };

            return CreatedAtAction(nameof(GetCursos), new { id = respuesta.Id }, respuesta);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrativo,Academico")]
        public async Task<IActionResult> PutCurso(int id, CrearCursoDto dto)
        {
            var curso = await _context.Cursos.FindAsync(id);
            if (curso == null) return NotFound();

            if (dto.DocenteId > 0 && curso.DocenteId != dto.DocenteId)
            {
                if (!await _context.Docentes.AnyAsync(d => d.Id == dto.DocenteId))
                    return BadRequest("El nuevo docente no existe.");
                curso.DocenteId = dto.DocenteId;
            }

            curso.Nombre = dto.Nombre;
            curso.Descripcion = dto.Descripcion;

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Curso actualizado" });
        }
    }
}