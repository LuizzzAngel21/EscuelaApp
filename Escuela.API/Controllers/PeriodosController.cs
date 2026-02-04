using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Escuela.Data;
using Escuela.Core.Entities;

namespace Escuela.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PeriodosController : ControllerBase
    {
        private readonly EscuelaDbContext _context;

        public PeriodosController(EscuelaDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Periodo>>> GetPeriodos()
        {
            return await _context.Periodos.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Periodo>> PostPeriodo(Periodo periodo)
        {
            _context.Periodos.Add(periodo);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetPeriodos", new { id = periodo.Id }, periodo);
        }
    }
}