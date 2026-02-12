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
    public class TareasController : ControllerBase
    {
        private readonly EscuelaDbContext _context;

        public TareasController(EscuelaDbContext context)
        {
            _context = context;
        }

        [HttpGet("Curso/{cursoId}")]
        public async Task<ActionResult<IEnumerable<TareaDto>>> GetTareasPorCurso(int cursoId)
        {
            if (!await _context.Cursos.AnyAsync(c => c.Id == cursoId))
                return NotFound("Curso no encontrado.");

            var tareas = await _context.Tareas
                .Include(t => t.Curso)
                .Where(t => t.CursoId == cursoId)
                .OrderByDescending(t => t.FechaLimite)
                .Select(t => new TareaDto
                {
                    Id = t.Id,
                    Titulo = t.Titulo,
                    Descripcion = t.Descripcion ?? "Sin descripción",
                    FechaLimite = t.FechaLimite.ToShortDateString(),
                    NombreCurso = t.Curso != null ? t.Curso.Nombre : "Sin Curso",
                    EstaVencida = DateTime.Now > t.FechaLimite
                })
                .ToListAsync();

            return Ok(tareas);
        }

        [HttpGet("Estudiante")]
        [Authorize(Roles = "Estudiantil")]
        public async Task<ActionResult<IEnumerable<TareaEstudianteDto>>> GetTareasEstudiante()
        {
            var userId = User.FindFirstValue("uid");
            var estudiante = await _context.Estudiantes.FirstOrDefaultAsync(e => e.UsuarioId == userId);
            if (estudiante == null) return Unauthorized("No se encontró perfil de estudiante.");

            var tareas = await _context.Tareas
                .Include(t => t.Curso)
                .Include(t => t.Entregas) 
                .OrderByDescending(t => t.FechaLimite)
                .ToListAsync();

            var resultado = tareas.Select(t =>
            {
                var miEntrega = t.Entregas
                    .Where(e => e.EstudianteId == estudiante.Id)
                    .OrderByDescending(e => e.FechaEnvio)
                    .FirstOrDefault();

                return new TareaEstudianteDto
                {
                    Id = t.Id,
                    Titulo = t.Titulo,
                    Descripcion = t.Descripcion ?? "",
                    FechaLimite = t.FechaLimite.ToShortDateString(),
                    NombreCurso = t.Curso?.Nombre ?? "N/A",
                    Estado = miEntrega == null ? "Pendiente" :
                             miEntrega.Calificacion != null ? "Calificada" : "Entregada",

                    Nota = miEntrega?.Calificacion,
                    Comentarios = miEntrega?.ComentariosDocente,
                    EstaVencida = DateTime.Now > t.FechaLimite && miEntrega == null
                };
            }).ToList();

            return Ok(resultado);
        }

        [HttpPost]
        [Authorize(Roles = "Academico,Administrativo")]
        public async Task<ActionResult<TareaDto>> PostTarea(CrearTareaDto dto)
        {
            if (dto.FechaLimite < DateTime.Now)
                return BadRequest("La fecha límite no puede ser anterior a hoy.");

            if (!await _context.Cursos.AnyAsync(c => c.Id == dto.CursoId))
                return BadRequest("El curso especificado no existe.");

            var nuevaTarea = new Tarea
            {
                Titulo = dto.Titulo,
                Descripcion = dto.Descripcion,
                FechaLimite = dto.FechaLimite,
                CursoId = dto.CursoId,
                FechaCreacion = DateTime.Now
            };

            _context.Tareas.Add(nuevaTarea);
            await _context.SaveChangesAsync();

            var tareaDb = await _context.Tareas
                .Include(t => t.Curso)
                .FirstAsync(t => t.Id == nuevaTarea.Id);

            var respuesta = new TareaDto
            {
                Id = tareaDb.Id,
                Titulo = tareaDb.Titulo,
                Descripcion = tareaDb.Descripcion ?? "",
                FechaLimite = tareaDb.FechaLimite.ToShortDateString(),
                NombreCurso = tareaDb.Curso?.Nombre ?? "N/A",
                EstaVencida = false
            };

            return CreatedAtAction(nameof(GetTareasPorCurso), new { cursoId = respuesta.Id }, respuesta);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Academico,Administrativo")]
        public async Task<IActionResult> DeleteTarea(int id)
        {
            var tarea = await _context.Tareas.FindAsync(id);
            if (tarea == null) return NotFound();

            _context.Tareas.Remove(tarea);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Academico,Administrativo")]
        public async Task<IActionResult> PutTarea(int id, CrearTareaDto dto)
        {
            var tarea = await _context.Tareas.FindAsync(id);
            if (tarea == null) return NotFound();

            tarea.Titulo = dto.Titulo;
            tarea.Descripcion = dto.Descripcion;
            tarea.FechaLimite = dto.FechaLimite;

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Tarea actualizada" });
        }
    }
}