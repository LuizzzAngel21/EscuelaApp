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
    public class EstudiantesController : ControllerBase
    {
        private readonly EscuelaDbContext _context;

        public EstudiantesController(EscuelaDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult> GetEstudiantes(
            [FromQuery] string? busqueda,
            [FromQuery] int pagina = 1, 
            [FromQuery] int cantidad = 10 
        )
        {
            var query = _context.Estudiantes.AsQueryable();

            if (!string.IsNullOrEmpty(busqueda))
            {
                query = query.Where(e =>
                    e.Nombres.Contains(busqueda) ||
                    e.Apellidos.Contains(busqueda) ||
                    e.Dni.Contains(busqueda)
                );
            }

            var totalRegistros = await query.CountAsync();

            var estudiantes = await query
                .OrderBy(e => e.Apellidos)
                .Skip((pagina - 1) * cantidad)
                .Take(cantidad)
                .Select(e => new EstudianteDto
                {
                    Id = e.Id,
                    NombreCompleto = $"{e.Nombres} {e.Apellidos}",
                    Dni = e.Dni,
                    FechaNacimiento = e.FechaNacimiento.ToShortDateString(),
                    Email = e.Email,
                    Telefono = e.TelefonoApoderado,
                    Edad = DateTime.Now.Year - e.FechaNacimiento.Year 
                })
                .ToListAsync();

            return Ok(new
            {
                Total = totalRegistros,
                PaginaActual = pagina,
                TotalPaginas = (int)Math.Ceiling((double)totalRegistros / cantidad),
                Data = estudiantes
            });
        }

        [HttpPost]
        public async Task<ActionResult<EstudianteDto>> PostEstudiante(CrearEstudianteDto dto)
        {
            var nuevoEstudiante = new Estudiante
            {
                Dni = dto.Dni,
                Nombres = dto.Nombres,
                Apellidos = dto.Apellidos,
                FechaNacimiento = dto.FechaNacimiento,
                TelefonoApoderado = dto.TelefonoApoderado,
                Email = dto.Email,
                UsuarioId = dto.UsuarioId
            };

            _context.Estudiantes.Add(nuevoEstudiante);
            await _context.SaveChangesAsync();

            var respuesta = new EstudianteDto
            {
                Id = nuevoEstudiante.Id,
                NombreCompleto = $"{nuevoEstudiante.Nombres} {nuevoEstudiante.Apellidos}",
                Dni = nuevoEstudiante.Dni,
                FechaNacimiento = nuevoEstudiante.FechaNacimiento.ToShortDateString(),
                Email = nuevoEstudiante.Email,
                Telefono = nuevoEstudiante.TelefonoApoderado,
                Edad = DateTime.Now.Year - nuevoEstudiante.FechaNacimiento.Year
            };

            return CreatedAtAction(nameof(GetEstudiantes), new { id = respuesta.Id }, respuesta);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrativo")]
        public async Task<IActionResult> PutEstudiante(int id, CrearEstudianteDto dto)
        {
            var estudiante = await _context.Estudiantes.FindAsync(id);
            if (estudiante == null) return NotFound();

            estudiante.Nombres = dto.Nombres;
            estudiante.Apellidos = dto.Apellidos;
            estudiante.Dni = dto.Dni;
            estudiante.FechaNacimiento = dto.FechaNacimiento;
            estudiante.TelefonoApoderado = dto.TelefonoApoderado;
            estudiante.Email = dto.Email;

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Datos actualizados" });
        }
    }
}