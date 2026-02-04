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
    public class ComunicadosController : ControllerBase
    {
        private readonly EscuelaDbContext _context;

        public ComunicadosController(EscuelaDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ComunicadoDto>>> GetComunicados()
        {
            var userId = User.FindFirstValue("uid");
            var esEstudiante = User.IsInRole("Estudiantil");
            var esDocente = User.IsInRole("Academico") || User.IsInRole("Docente");

            var query = _context.Comunicados.AsQueryable();

            if (esEstudiante)
            {
                var matricula = await _context.Matriculas
                    .OrderByDescending(m => m.Id)
                    .FirstOrDefaultAsync(m => m.Estudiante!.UsuarioId == userId);

                int? gradoIdAlumno = matricula?.GradoId;

                query = query.Where(c =>
                    (c.DestinatarioRol == "General" || c.DestinatarioRol == "Estudiantes") &&
                    (c.GradoId == null || c.GradoId == gradoIdAlumno)
                );
            }
            else if (esDocente)
            {
                query = query.Where(c => c.DestinatarioRol == "General" || c.DestinatarioRol == "Docentes");
            }

            var lista = await query.OrderByDescending(c => c.FechaPublicacion).ToListAsync();

            var resultado = lista.Select(c => new ComunicadoDto
            {
                Id = c.Id,
                Titulo = c.Titulo,
                Contenido = c.Contenido,
                Fecha = c.FechaPublicacion.ToString("dd/MM/yyyy HH:mm"),
                Autor = c.AutorNombre,
                EtiquetaDestino = c.GradoId == null ? "Todo el Colegio" : "Grado Específico"
            });

            return Ok(resultado);
        }

        [HttpPost]
        [Authorize(Roles = "Administrativo,Psicologo,Academico")]
        public async Task<ActionResult> PostComunicado(CrearComunicadoDto dto)
        {
            var autor = "Staff";
            if (User.IsInRole("Administrativo")) autor = "Dirección";
            if (User.IsInRole("Psicologo")) autor = "Dpto. Psicología";
            if (User.IsInRole("Academico")) autor = "Coordinación Académica";

            var nuevo = new Comunicado
            {
                Titulo = dto.Titulo,
                Contenido = dto.Contenido,
                GradoId = dto.GradoId,
                DestinatarioRol = dto.DestinatarioRol,
                FechaPublicacion = DateTime.Now,
                AutorNombre = autor
            };

            _context.Comunicados.Add(nuevo);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Comunicado publicado exitosamente" });
        }
    }
}