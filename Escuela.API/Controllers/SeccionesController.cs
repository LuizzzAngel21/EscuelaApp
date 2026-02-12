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
    [Authorize(Roles = "Administrativo,Academico")]
    public class SeccionesController : ControllerBase
    {
        private readonly EscuelaDbContext _context;

        public SeccionesController(EscuelaDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<SeccionDto>>> GetSecciones()
        {
            var secciones = await _context.Secciones
                .Include(s => s.Grado)
                .Select(s => new SeccionDto
                {
                    Id = s.Id,
                    Nombre = s.Nombre,
                    Capacidad = s.Capacidad,
                    Grado = s.Grado != null ? s.Grado.Nombre : "Sin Grado"
                })
                .ToListAsync();

            return Ok(secciones);
        }

        [HttpPost]
        [Authorize(Roles = "Administrativo")]
        public async Task<ActionResult<SeccionDto>> PostSeccion(CrearSeccionDto dto)
        {
            var gradoExiste = await _context.Grados.AnyAsync(g => g.Id == dto.GradoId);
            if (!gradoExiste) return BadRequest("El Grado especificado no existe.");

            var nuevaSeccion = new Seccion
            {
                Nombre = dto.Nombre,
                GradoId = dto.GradoId,
                Capacidad = dto.Capacidad
            };

            _context.Secciones.Add(nuevaSeccion);
            await _context.SaveChangesAsync();

            var seccionDb = await _context.Secciones
                .Include(s => s.Grado)
                .FirstOrDefaultAsync(s => s.Id == nuevaSeccion.Id);

            var respuesta = new SeccionDto
            {
                Id = seccionDb!.Id,
                Nombre = seccionDb.Nombre,
                Capacidad = seccionDb.Capacidad,
                Grado = seccionDb.Grado?.Nombre ?? "N/A"
            };

            return CreatedAtAction(nameof(GetSecciones), new { id = respuesta.Id }, respuesta);
        }


        [HttpGet("Grado/{gradoId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetSeccionesPorGrado(int gradoId)
        {
            var secciones = await _context.Secciones
                .Where(s => s.GradoId == gradoId)
                .Select(s => new { s.Id, s.Nombre }) 
                .OrderBy(s => s.Nombre)
                .ToListAsync();

            return Ok(secciones);
        }
    }
}