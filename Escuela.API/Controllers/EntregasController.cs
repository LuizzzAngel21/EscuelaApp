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
    public class EntregasController : ControllerBase
    {
        private readonly EscuelaDbContext _context;
        private readonly IWebHostEnvironment _env;

        public EntregasController(EscuelaDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet("Tarea/{tareaId}")]
        [Authorize(Roles = "Academico,Administrativo")]
        public async Task<ActionResult<IEnumerable<EntregaDto>>> GetEntregasPorTarea(int tareaId)
        {
            var entregas = await _context.Entregas
                .Include(e => e.Estudiante)
                .Where(e => e.TareaId == tareaId)
                .Select(e => new EntregaDto
                {
                    Id = e.Id,
                    EstudianteNombre = e.Estudiante != null
                        ? $"{e.Estudiante.Nombres} {e.Estudiante.Apellidos}"
                        : "Estudiante Desconocido",
                    FechaEnvio = e.FechaEnvio.ToShortDateString(),
                    UrlArchivo = $"{Request.Scheme}://{Request.Host}/{e.RutaArchivo}",
                    Calificacion = e.Calificacion,
                    Comentarios = e.ComentariosDocente
                })
                .ToListAsync();

            return Ok(entregas);
        }

        [HttpPost("Subir")]
        [Authorize(Roles = "Estudiantil")]
        public async Task<ActionResult> SubirEntrega([FromForm] SubirEntregaDto dto)
        {
            var userId = User.FindFirstValue("uid");
            var estudiante = await _context.Estudiantes.FirstOrDefaultAsync(e => e.UsuarioId == userId);

            if (estudiante == null) return BadRequest("No se encontró el perfil de estudiante.");

            if (dto.Archivo == null || dto.Archivo.Length == 0)
                return BadRequest("El archivo es obligatorio.");

            var tarea = await _context.Tareas.Include(t => t.Curso).FirstOrDefaultAsync(t => t.Id == dto.TareaId);
            if (tarea == null) return BadRequest("La tarea no existe.");

            if (DateTime.Now > tarea.FechaLimite)
                return BadRequest($"El plazo venció el {tarea.FechaLimite:dd/MM/yyyy HH:mm}.");

            var existe = await _context.Entregas.AnyAsync(e => e.TareaId == dto.TareaId && e.EstudianteId == estudiante.Id);
            if (existe) return BadRequest("Ya has enviado una entrega para esta tarea.");

            string rutaRaiz = _env.WebRootPath ?? _env.ContentRootPath;
            var carpeta = Path.Combine(rutaRaiz, "entregas");
            if (!Directory.Exists(carpeta)) Directory.CreateDirectory(carpeta);

            var extension = Path.GetExtension(dto.Archivo.FileName);
            var nombreArchivo = $"{Guid.NewGuid()}{extension}";
            var rutaCompleta = Path.Combine(carpeta, nombreArchivo);

            using (var stream = new FileStream(rutaCompleta, FileMode.Create))
            {
                await dto.Archivo.CopyToAsync(stream);
            }

            var entrega = new Entrega
            {
                TareaId = dto.TareaId,
                EstudianteId = estudiante.Id,
                FechaEnvio = DateTime.Now,
                RutaArchivo = $"entregas/{nombreArchivo}"
            };

            _context.Entregas.Add(entrega);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Tarea entregada con éxito" });
        }

        [HttpPut("Calificar/{id}")]
        [Authorize(Roles = "Academico")]
        public async Task<ActionResult> CalificarEntrega(int id, [FromBody] CalificarEntregaDto dto)
        {
            var entrega = await _context.Entregas.FindAsync(id);
            if (entrega == null) return NotFound("La entrega no existe.");

            entrega.Calificacion = dto.Nota;
            entrega.ComentariosDocente = dto.Comentarios;

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Calificación registrada" });
        }
    }
}