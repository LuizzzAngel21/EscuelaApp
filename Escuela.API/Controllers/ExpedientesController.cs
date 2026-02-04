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
    public class ExpedientesController : ControllerBase
    {
        private readonly EscuelaDbContext _context;

        public ExpedientesController(EscuelaDbContext context)
        {
            _context = context;
        }

        [HttpGet("Estudiante/{estudianteId}")]
        public async Task<ActionResult<IEnumerable<ExpedienteDto>>> GetPorEstudiante(int estudianteId)
        {
            var userId = User.FindFirstValue("uid");
            var rol = User.FindFirstValue(ClaimTypes.Role);

            if (rol == "Estudiantil")
            {
                var estudiante = await _context.Estudiantes.FirstOrDefaultAsync(e => e.UsuarioId == userId);
                if (estudiante == null || estudiante.Id != estudianteId)
                    return Forbid();
            }

            var expedientes = await _context.ExpedientesPsicologicos
                .Include(e => e.Estudiante)
                .Where(e => e.EstudianteId == estudianteId)
                .OrderByDescending(e => e.FechaRegistro)
                .ToListAsync();

            var psicologosIds = expedientes.Select(e => e.PsicologoId).Distinct().ToList();
            var psicologos = await _context.Psicologos
                .Where(p => psicologosIds.Contains(p.UsuarioId))
                .ToDictionaryAsync(p => p.UsuarioId, p => $"{p.Nombres} {p.Apellidos}");

            var resultado = new List<ExpedienteDto>();
            bool tienePermisoTotal = (rol == "Psicologo" || rol == "Administrativo");

            foreach (var item in expedientes)
            {
                var nombrePsico = psicologos.ContainsKey(item.PsicologoId) ? psicologos[item.PsicologoId] : "Desconocido";

                resultado.Add(new ExpedienteDto
                {
                    Id = item.Id,
                    Fecha = item.FechaRegistro.ToString("dd/MM/yyyy"),
                    Titulo = item.Titulo,
                    Descripcion = tienePermisoTotal ? item.Descripcion : "[CONFIDENCIAL - Solo Psicología]",
                    Recomendaciones = item.Recomendaciones,
                    NombreEstudiante = $"{item.Estudiante?.Nombres} {item.Estudiante?.Apellidos}",
                    NombrePsicologo = nombrePsico
                });
            }

            return Ok(resultado);
        }

        [HttpPost]
        [Authorize(Roles = "Psicologo")]
        public async Task<ActionResult> PostExpediente(CrearExpedienteDto dto)
        {
            var userId = User.FindFirstValue("uid");

            if (!await _context.Estudiantes.AnyAsync(e => e.Id == dto.EstudianteId))
                return BadRequest("El estudiante no existe.");

            var nuevoExpediente = new ExpedientePsicologico
            {
                EstudianteId = dto.EstudianteId,
                Titulo = dto.Titulo,
                Descripcion = dto.Descripcion,
                Recomendaciones = dto.Recomendaciones,
                FechaRegistro = DateTime.Now,
                PsicologoId = userId 
            };

            _context.ExpedientesPsicologicos.Add(nuevoExpediente);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Ficha psicológica registrada correctamente." });
        }
    }
}