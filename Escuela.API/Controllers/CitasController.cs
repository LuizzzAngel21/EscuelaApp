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
    public class CitasController : ControllerBase
    {
        private readonly EscuelaDbContext _context;

        public CitasController(EscuelaDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CitaDto>>> GetMisCitas()
        {
            var userId = User.FindFirstValue("uid");
            var esEstudiante = User.IsInRole("Estudiantil");
            var esStaff = User.IsInRole("Academico") || User.IsInRole("Psicologo") || User.IsInRole("Administrativo");

            var query = _context.Citas
                .Include(c => c.Estudiante)
                .AsQueryable();

            if (esEstudiante)
                query = query.Where(c => c.Estudiante!.UsuarioId == userId);
            else if (esStaff)
                query = query.Where(c => c.OrganizadorId == userId);

            var citas = await query.OrderByDescending(c => c.FechaHora).ToListAsync();
            var citasDto = new List<CitaDto>();

            foreach (var c in citas)
            {
                var infoStaff = await ObtenerInfoStaff(c.OrganizadorId);

                citasDto.Add(new CitaDto
                {
                    Id = c.Id,
                    Fecha = c.FechaHora.ToString("dd/MM/yyyy"),
                    Hora = c.FechaHora.ToString("HH:mm"),
                    Motivo = c.Motivo,
                    Estado = ((EstadoCita)c.Estado).ToString(),
                    NombreOrganizador = infoStaff.Nombre,
                    Cargo = infoStaff.Cargo,
                    NombreEstudiante = $"{c.Estudiante?.Nombres} {c.Estudiante?.Apellidos}",
                    Modalidad = c.EsVirtual ? "Virtual" : "Presencial",
                    LinkODireccion = c.EsVirtual ? (c.LinkReunion ?? "Pendiente") : "Colegio - Sala de Reuniones"
                });
            }

            return Ok(citasDto);
        }

        [HttpPost]
        [Authorize(Roles = "Estudiantil")]
        public async Task<ActionResult<CitaDto>> SolicitarCita(CrearCitaDto dto)
        {
            var userId = User.FindFirstValue("uid");

            if (dto.FechaHora <= DateTime.Now)
                return BadRequest("La cita debe ser futura.");

            var estudiante = await _context.Estudiantes.FirstOrDefaultAsync(e => e.UsuarioId == userId);
            if (estudiante == null) return BadRequest("Perfil de estudiante no encontrado.");

            var errorDisponibilidad = await ValidarDisponibilidad(dto.DestinatarioId, dto.FechaHora);
            if (!string.IsNullOrEmpty(errorDisponibilidad))
                return BadRequest(errorDisponibilidad);

            var nuevaCita = new Cita
            {
                FechaHora = dto.FechaHora,
                Motivo = dto.Motivo,
                Estado = (int)EstadoCita.Pendiente,
                OrganizadorId = dto.DestinatarioId,
                EstudianteId = estudiante.Id,
                EsVirtual = dto.EsVirtual,
                FechaSolicitud = DateTime.Now
            };

            _context.Citas.Add(nuevaCita);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Solicitud enviada. Espera confirmación." });
        }

        [HttpPut("Gestionar/{id}")]
        [Authorize(Roles = "Academico,Psicologo,Administrativo")]
        public async Task<IActionResult> GestionarCita(int id, [FromBody] GestionarCitaDto dto)
        {
            var userId = User.FindFirstValue("uid");
            var cita = await _context.Citas.FindAsync(id);

            if (cita == null) return NotFound("Cita no encontrada.");
            if (cita.OrganizadorId != userId) return Forbid(); 

            if (dto.Accion == 1)
            {
                cita.Estado = (int)EstadoCita.Confirmada;
                if (!string.IsNullOrEmpty(dto.LinkReunion)) cita.LinkReunion = dto.LinkReunion;
            }
            else if (dto.Accion == 2)
            {
                cita.Estado = (int)EstadoCita.Rechazada;
            }
            else
            {
                return BadRequest("Acción inválida. 1=Confirmar, 2=Rechazar.");
            }

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Estado actualizado." });
        }


        private async Task<string?> ValidarDisponibilidad(string staffId, DateTime fecha)
        {
            if (fecha.Hour < 8 || fecha.Hour > 16) return "Atención de 08:00 a 16:00.";

            var ocupado = await _context.Citas.AnyAsync(c =>
                c.OrganizadorId == staffId &&
                c.Estado == (int)EstadoCita.Confirmada &&
                c.FechaHora.Date == fecha.Date &&
                c.FechaHora.Hour == fecha.Hour);

            if (ocupado) return "El especialista ya tiene cita a esa hora.";

            var esDocente = await _context.Docentes.AnyAsync(d => d.UsuarioId == staffId);
            if (esDocente)
            {
                var diaSemana = ObtenerDiaSemana(fecha.DayOfWeek);
                var hora = fecha.TimeOfDay;
                var tieneClase = await _context.Horarios.Include(h => h.Curso)
                    .AnyAsync(h => h.Curso!.Docente!.UsuarioId == staffId &&
                                   h.DiaSemana == diaSemana &&
                                   (hora >= h.HoraInicio && hora < h.HoraFin));

                if (tieneClase) return "El docente está dictando clase.";
            }

            return null;
        }

        private async Task<(string Nombre, string Cargo)> ObtenerInfoStaff(string userId)
        {
            var doc = await _context.Docentes.FirstOrDefaultAsync(d => d.UsuarioId == userId);
            if (doc != null) return ($"{doc.Nombres} {doc.Apellidos}", $"Docente ({doc.Especialidad})");

            var psi = await _context.Psicologos.FirstOrDefaultAsync(p => p.UsuarioId == userId);
            if (psi != null) return ($"{psi.Nombres} {psi.Apellidos}", "Psicólogo(a)");

            var adm = await _context.Users.FindAsync(userId);
            return (adm?.UserName ?? "Admin", "Administrativo");
        }

        private string ObtenerDiaSemana(DayOfWeek day) => day switch
        {
            DayOfWeek.Monday => "Lunes",
            DayOfWeek.Tuesday => "Martes",
            DayOfWeek.Wednesday => "Miércoles",
            DayOfWeek.Thursday => "Jueves",
            DayOfWeek.Friday => "Viernes",
            _ => "FinDeSemana"
        };

        public enum EstadoCita { Pendiente = 0, Confirmada = 1, Rechazada = 2, Realizada = 3 }
    }
}