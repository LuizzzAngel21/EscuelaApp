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
                .Select(s => new { s.Id, s.Nombre, s.Capacidad }) 
                .OrderBy(s => s.Nombre)
                .ToListAsync();

            return Ok(secciones);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrativo")]
        public async Task<IActionResult> PutSeccion(int id, [FromBody] CrearSeccionDto dto)
        {
            var seccion = await _context.Secciones.FindAsync(id);

            if (seccion == null)
                return NotFound("La sección no existe.");

            if (seccion.Nombre != dto.Nombre)
            {
                bool existeNombre = await _context.Secciones
                    .AnyAsync(s => s.GradoId == seccion.GradoId && s.Nombre == dto.Nombre);

                if (existeNombre)
                    return BadRequest($"Ya existe una sección '{dto.Nombre}' en este grado.");
            }

            seccion.Nombre = dto.Nombre;
            seccion.Capacidad = dto.Capacidad;

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { mensaje = "Sección actualizada correctamente." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error interno al actualizar.");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrativo")]
        public async Task<IActionResult> DeleteSeccion(int id)
        {
            var seccion = await _context.Secciones.FindAsync(id);

            if (seccion == null)
                return NotFound("La sección no existe.");

            bool tieneAlumnos = await _context.Matriculas.AnyAsync(m => m.SeccionId == id);
            if (tieneAlumnos)
            {
                return BadRequest("No se puede eliminar: Esta sección tiene alumnos matriculados. Primero debe moverlos o anular sus matrículas.");
            }

            bool tieneHorarios = await _context.Horarios.AnyAsync(h => h.SeccionId == id);
            if (tieneHorarios)
            {
                return BadRequest("No se puede eliminar: Hay horarios de clase configurados para esta sección. Elimine los horarios primero.");
            }

            _context.Secciones.Remove(seccion);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Sección eliminada correctamente." });
        }
    }
}