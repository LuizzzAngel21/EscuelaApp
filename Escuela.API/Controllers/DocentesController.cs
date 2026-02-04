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
    public class DocentesController : ControllerBase
    {
        private readonly EscuelaDbContext _context;

        public DocentesController(EscuelaDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DocenteDto>>> GetDocentes()
        {
            var docentes = await _context.Docentes
                .Select(d => new DocenteDto
                {
                    Id = d.Id,
                    NombreCompleto = $"{d.Nombres} {d.Apellidos}",
                    Dni = d.Dni,
                    Especialidad = d.Especialidad ?? "General",
                    Activo = d.Activo
                })
                .ToListAsync();

            return Ok(docentes);
        }

        [HttpPost]
        [Authorize(Roles = "Administrativo")]
        public async Task<ActionResult<DocenteDto>> PostDocente(CrearDocenteDto dto)
        {
            if (await _context.Docentes.AnyAsync(d => d.Dni == dto.Dni))
                return BadRequest("Ya existe un docente con este DNI.");

            var nuevoDocente = new Docente
            {
                Nombres = dto.Nombres,
                Apellidos = dto.Apellidos,
                Dni = dto.Dni,
                Especialidad = dto.Especialidad,
                UsuarioId = dto.UsuarioId,
                Activo = true
            };

            _context.Docentes.Add(nuevoDocente);
            await _context.SaveChangesAsync();

            var respuesta = new DocenteDto
            {
                Id = nuevoDocente.Id,
                NombreCompleto = $"{nuevoDocente.Nombres} {nuevoDocente.Apellidos}",
                Dni = nuevoDocente.Dni,
                Especialidad = nuevoDocente.Especialidad ?? "General",
                Activo = nuevoDocente.Activo
            };

            return CreatedAtAction(nameof(GetDocentes), new { id = respuesta.Id }, respuesta);
        }
    }
}