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
    [Authorize(Roles = "Estudiantil")]
    public class NotificacionesController : ControllerBase
    {
        private readonly EscuelaDbContext _context;

        public NotificacionesController(EscuelaDbContext context)
        {
            _context = context;
        }

        [HttpGet("Resumen")]
        public async Task<ActionResult<IEnumerable<NotificacionDto>>> GetResumen()
        {
            var userId = User.FindFirstValue("uid");
            var listaNotificaciones = new List<NotificacionDto>();

            var estudiante = await _context.Estudiantes.FirstOrDefaultAsync(e => e.UsuarioId == userId);

            var mensajesSinLeer = await _context.Mensajes
                .Where(m => m.DestinatarioId == userId && !m.Leido)
                .OrderByDescending(m => m.FechaEnvio)
                .Select(m => new NotificacionDto
                {
                    Titulo = "Nuevo Mensaje",
                    Descripcion = $"De: {m.NombreRemitente} - {m.Asunto}",
                    Fecha = m.FechaEnvio.ToString("dd/MM HH:mm"),
                    FechaOrden = m.FechaEnvio,
                    Tipo = "Mensaje",
                    UrlDestino = "/Estudiante/Mensajes",
                    EsPrioritario = false
                })
                .ToListAsync();

            listaNotificaciones.AddRange(mensajesSinLeer);

            if (estudiante != null)
            {
                var fechaLimite = DateTime.Now.AddDays(-7);
                var incidenciasRecientes = await _context.Incidencias
                    .Where(i => i.EstudianteId == estudiante.Id && i.Fecha >= fechaLimite)
                    .Select(i => new NotificacionDto
                    {
                        Titulo = "Reporte de Conducta",
                        Descripcion = $"{i.Nivel}: {i.Titulo}",
                        Fecha = i.Fecha.ToString("dd/MM HH:mm"),
                        FechaOrden = i.Fecha,
                        Tipo = "Alerta",
                        UrlDestino = "/Estudiante/Incidencias",
                        EsPrioritario = i.Nivel.Contains("Grave")
                    })
                    .ToListAsync();

                listaNotificaciones.AddRange(incidenciasRecientes);

                var citasFuturas = await _context.Citas
                    .Where(c => c.EstudianteId == estudiante.Id && c.Estado == 1 && c.FechaHora > DateTime.Now)
                    .Select(c => new NotificacionDto
                    {
                        Titulo = "Cita Programada",
                        Descripcion = $"Bienestar - {c.FechaHora:HH:mm}",
                        Fecha = c.FechaHora.ToString("dd/MM"),
                        FechaOrden = c.FechaHora,
                        Tipo = "Cita",
                        UrlDestino = "/Estudiante/Bienestar",
                        EsPrioritario = true
                    })
                    .ToListAsync();

                listaNotificaciones.AddRange(citasFuturas);

                var fechaHoy = DateTime.Now;

                var pagosVencidos = await _context.Pensiones
                    .Include(p => p.Matricula)
                    .Where(p => p.Matricula.EstudianteId == estudiante.Id &&
                                !p.Pagado &&
                                p.FechaVencimiento < fechaHoy) 
                    .Select(p => new NotificacionDto
                    {
                        Titulo = "Pago Vencido",
                        Descripcion = $"Mes: {p.Mes}. Venció el {p.FechaVencimiento:dd/MM}.",
                        Fecha = fechaHoy.ToString("dd/MM"), 
                        FechaOrden = fechaHoy,
                        Tipo = "Pago",
                        UrlDestino = "/Estudiante/Pagos",
                        EsPrioritario = true
                    })
                    .ToListAsync();

                listaNotificaciones.AddRange(pagosVencidos);
            }

            return Ok(listaNotificaciones.OrderByDescending(n => n.FechaOrden).ToList());
        }
    }
}