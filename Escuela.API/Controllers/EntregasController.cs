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
            var todasEntregas = await _context.Entregas
                .Include(e => e.Estudiante)
                .Where(e => e.TareaId == tareaId)
                .ToListAsync();

            var entregasFiltradas = todasEntregas
                .GroupBy(e => e.EstudianteId)
                .Select(g => g.OrderByDescending(e => e.FechaEnvio).First())
                .Select(e => new EntregaDto
                {
                    Id = e.Id,
                    EstudianteNombre = e.Estudiante != null
                        ? $"{e.Estudiante.Nombres} {e.Estudiante.Apellidos}"
                        : "Estudiante Desconocido",
                    FechaEnvio = e.FechaEnvio.ToString("dd/MM/yyyy HH:mm"),
                    UrlArchivo = $"{Request.Scheme}://{Request.Host}/{e.RutaArchivo}",
                    Calificacion = e.Calificacion,
                    Comentarios = e.ComentariosDocente
                })
                .ToList();

            return Ok(entregasFiltradas);
        }

        [HttpPost("Subir")]
        [Authorize(Roles = "Estudiantil")]
        [DisableRequestSizeLimit]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult> SubirEntrega([FromForm] SubirEntregaDto dto)
        {
            Console.WriteLine("--- INTENTO DE SUBIDA ---");

            try
            {
                if (dto.Archivo == null || dto.Archivo.Length == 0)
                    return BadRequest("Debes subir un archivo.");

                var userId = User.FindFirstValue("uid");
                var estudiante = await _context.Estudiantes.FirstOrDefaultAsync(e => e.UsuarioId == userId);

                if (estudiante == null) return BadRequest("Estudiante no encontrado.");

                var tarea = await _context.Tareas.Include(t => t.Curso).FirstOrDefaultAsync(t => t.Id == dto.TareaId);
                if (tarea == null) return BadRequest("Tarea no encontrada.");

                string rutaRaiz = _env.WebRootPath ?? _env.ContentRootPath;
                var carpeta = Path.Combine(rutaRaiz, "entregas");
                if (!Directory.Exists(carpeta)) Directory.CreateDirectory(carpeta);

                var nombreArchivo = $"{Guid.NewGuid()}{Path.GetExtension(dto.Archivo.FileName)}";
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

                return Ok(new { mensaje = "Tarea entregada correctamente" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR FATAL: {ex.Message}");
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        [HttpGet("MisEntregas/{tareaId}")]
        [Authorize(Roles = "Estudiantil")]
        public async Task<ActionResult<IEnumerable<EntregaDto>>> GetMisEntregas(int tareaId)
        {
            var userId = User.FindFirstValue("uid");
            var estudiante = await _context.Estudiantes.FirstOrDefaultAsync(e => e.UsuarioId == userId);

            if (estudiante == null) return Unauthorized("Estudiante no encontrado.");

            var entregas = await _context.Entregas
                .Where(e => e.TareaId == tareaId && e.EstudianteId == estudiante.Id)
                .OrderByDescending(e => e.FechaEnvio)
                .Select(e => new EntregaDto
                {
                    Id = e.Id,
                    EstudianteNombre = "Yo",
                    FechaEnvio = e.FechaEnvio.ToString("dd/MM/yyyy HH:mm"),
                    UrlArchivo = $"{Request.Scheme}://{Request.Host}/{e.RutaArchivo}",
                    Calificacion = e.Calificacion,
                    Comentarios = e.ComentariosDocente
                })
                .ToListAsync();

            return Ok(entregas);
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