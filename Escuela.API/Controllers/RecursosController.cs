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
    public class RecursosController : ControllerBase
    {
        private readonly EscuelaDbContext _context;
        private readonly IWebHostEnvironment _env;

        public RecursosController(EscuelaDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet("Curso/{cursoId}")]
        public async Task<ActionResult<IEnumerable<RecursoDto>>> GetRecursosPorCurso(int cursoId)
        {
            var recursos = await _context.Recursos
                .Include(r => r.Curso)
                .Where(r => r.CursoId == cursoId)
                .Select(r => new RecursoDto
                {
                    Id = r.Id,
                    Titulo = r.Titulo,
                    UrlDescarga = $"{Request.Scheme}://{Request.Host}/{r.RutaArchivo}",
                    Fecha = r.FechaSubida.ToShortDateString(),
                    Curso = r.Curso != null ? r.Curso.Nombre : "Desconocido"
                })
                .ToListAsync();

            return Ok(recursos);
        }

        [HttpPost("Subir")]
        [Authorize(Roles = "Administrativo,Academico")]
        public async Task<ActionResult> SubirMaterial([FromForm] CrearRecursoDto dto)
        {
            if (dto.Archivo == null || dto.Archivo.Length == 0)
                return BadRequest("No has subido ningún archivo.");

            string rutaRaiz = _env.WebRootPath ?? _env.ContentRootPath;
            var carpetaDestino = Path.Combine(rutaRaiz, "uploads");

            if (!Directory.Exists(carpetaDestino)) Directory.CreateDirectory(carpetaDestino);

            var extension = Path.GetExtension(dto.Archivo.FileName);
            var nombreArchivo = $"{Guid.NewGuid()}{extension}";
            var rutaCompleta = Path.Combine(carpetaDestino, nombreArchivo);

            using (var stream = new FileStream(rutaCompleta, FileMode.Create))
            {
                await dto.Archivo.CopyToAsync(stream);
            }

            var nuevoRecurso = new Recurso
            {
                Titulo = dto.Titulo,
                CursoId = dto.CursoId,
                FechaSubida = DateTime.Now,
                RutaArchivo = $"uploads/{nombreArchivo}"
            };

            _context.Recursos.Add(nuevoRecurso);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Archivo subido exitosamente" });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Academico,Administrativo")]
        public async Task<IActionResult> DeleteRecurso(int id)
        {
            var recurso = await _context.Recursos.FindAsync(id);
            if (recurso == null) return NotFound();

            if (!string.IsNullOrEmpty(recurso.RutaArchivo))
            {
                string rutaRaiz = _env.WebRootPath ?? _env.ContentRootPath;
                var rutaArchivo = Path.Combine(rutaRaiz, recurso.RutaArchivo.TrimStart('/', '\\'));
                if (System.IO.File.Exists(rutaArchivo))
                {
                    System.IO.File.Delete(rutaArchivo);
                }
            }

            _context.Recursos.Remove(recurso);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}