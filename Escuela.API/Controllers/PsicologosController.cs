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
    [Authorize(Roles = "Administrativo")]
    public class PsicologosController : ControllerBase
    {
        private readonly EscuelaDbContext _context;

        public PsicologosController(EscuelaDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PsicologoDto>>> GetPsicologos()
        {
            var lista = await _context.Psicologos
                .Select(p => new PsicologoDto
                {
                    Id = p.Id,
                    NombreCompleto = $"{p.Nombres} {p.Apellidos}",
                    Dni = p.Dni,
                    Cpsp = p.Cpsp,
                    Especialidad = p.Especialidad,
                    Activo = p.Activo
                })
                .ToListAsync();

            return Ok(lista);
        }

        [HttpPost]
        public async Task<ActionResult<PsicologoDto>> PostPsicologo(CrearPsicologoDto dto)
        {
            if (await _context.Psicologos.AnyAsync(p => p.Dni == dto.Dni))
                return BadRequest("Ya existe un psicólogo con ese DNI.");

            var nuevo = new Psicologo
            {
                Nombres = dto.Nombres,
                Apellidos = dto.Apellidos,
                Dni = dto.Dni,
                Cpsp = dto.Cpsp,
                Especialidad = dto.Especialidad,
                UsuarioId = dto.UsuarioId,
                Activo = true
            };

            _context.Psicologos.Add(nuevo);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPsicologos), new { id = nuevo.Id }, new PsicologoDto
            {
                Id = nuevo.Id,
                NombreCompleto = $"{nuevo.Nombres} {nuevo.Apellidos}",
                Dni = nuevo.Dni,
                Cpsp = nuevo.Cpsp,
                Especialidad = nuevo.Especialidad,
                Activo = true
            });
        }
    }
}