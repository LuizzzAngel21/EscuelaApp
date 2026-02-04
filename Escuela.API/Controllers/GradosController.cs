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
    public class GradosController : ControllerBase
    {
        private readonly EscuelaDbContext _context;

        public GradosController(EscuelaDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<GradoDto>>> GetGrados()
        {
            var grados = await _context.Grados
                .Select(g => new GradoDto
                {
                    Id = g.Id,
                    Nombre = g.Nombre,
                    Nivel = g.Nivel
                })
                .ToListAsync();

            return Ok(grados);
        }

        [HttpPost]
        [Authorize(Roles = "Administrativo")] 
        public async Task<ActionResult<GradoDto>> PostGrado(CrearGradoDto dto)
        {
            var nuevoGrado = new Grado
            {
                Nombre = dto.Nombre,
                Nivel = dto.Nivel
            };

            _context.Grados.Add(nuevoGrado);
            await _context.SaveChangesAsync();

            var respuesta = new GradoDto
            {
                Id = nuevoGrado.Id,
                Nombre = nuevoGrado.Nombre,
                Nivel = nuevoGrado.Nivel
            };

            return CreatedAtAction(nameof(GetGrados), new { id = respuesta.Id }, respuesta);
        }
    }
}