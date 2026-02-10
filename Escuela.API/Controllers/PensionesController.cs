using Escuela.API.Dtos;
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
    public class PensionesController : ControllerBase
    {
        private readonly EscuelaDbContext _context;

        public PensionesController(EscuelaDbContext context)
        {
            _context = context;
        }

        [HttpGet("MisPagos")]
        public async Task<ActionResult<IEnumerable<PensionDto>>> GetMisPensiones()
        {
            var userId = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            var esEstudiante = User.IsInRole("Estudiantil");

            var matricula = await _context.Matriculas
                .Include(m => m.Estudiante)
                .Where(m => m.Estudiante!.UsuarioId == userId)
                .OrderByDescending(m => m.FechaMatricula)
                .FirstOrDefaultAsync();

            if (matricula == null && esEstudiante)
                return NotFound("No se encontró una matrícula activa para este usuario.");

            var pensiones = await _context.Pensiones
                .Where(p => p.MatriculaId == matricula!.Id)
                .OrderBy(p => p.NumeroMes)
                .ToListAsync();

            var resultado = new List<PensionDto>();
            var hoy = DateTime.Now;

            foreach (var p in pensiones)
            {
                string estado = "PROGRAMADO"; 
                string color = "#6c757d";
                decimal moraCalculada = p.Mora;

                if (p.Pagado)
                {
                    estado = "PAGADO";
                    color = "#198754"; 
                }
                else
                {
                    if (hoy.Date > p.FechaVencimiento.Date)
                    {
                        estado = "VENCIDO";
                        color = "#dc3545";
                        moraCalculada = 50.00m;
                    }
                    else if (hoy.Month == p.FechaVencimiento.Month && hoy.Year == p.FechaVencimiento.Year)
                    {
                        estado = "PENDIENTE";
                        color = "#ffc107"; 
                    }
                }

                resultado.Add(new PensionDto
                {
                    Id = p.Id,
                    Mes = p.Mes,
                    FechaVencimiento = p.FechaVencimiento.ToString("dd/MM/yyyy"),
                    MontoBase = p.Monto,
                    Mora = moraCalculada,
                    TotalAPagar = p.Monto + moraCalculada,
                    Estado = estado,
                    ColorEstado = color,
                    FechaPago = p.FechaPago?.ToString("dd/MM/yyyy HH:mm") ?? "-",
                    CodigoOperacion = p.CodigoOperacion ?? "-"
                });
            }

            return Ok(resultado);
        }

        [HttpPost("Pagar")]
        [Authorize(Roles = "Estudiantil")]
        public async Task<IActionResult> PagarPension([FromBody] PagarPensionDto dto)
        {
            var pension = await _context.Pensiones.FindAsync(dto.PensionId);
            if (pension == null) return NotFound("Pensión no encontrada");

            if (pension.Pagado)
                return BadRequest("Esta pensión ya está pagada.");

            string tarjetaLimpia = dto.NumeroTarjeta.Replace(" ", "").Trim();

            if (!tarjetaLimpia.StartsWith("4"))
            {
                return BadRequest("Pago Rechazado: Tarjeta inválida (debe iniciar con 4) o fondos insuficientes.");
            }

            if (DateTime.Now > pension.FechaVencimiento)
            {
                pension.Mora = 50.00m;
            }

            pension.Pagado = true;
            pension.FechaPago = DateTime.Now;
            pension.FormaPago = "Tarjeta";
            pension.CodigoOperacion = $"NIUBIZ-{new Random().Next(10000, 99999)}";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Pago exitoso",
                codigo = pension.CodigoOperacion,
                totalCobrado = pension.Monto + pension.Mora
            });
        }
    }
}