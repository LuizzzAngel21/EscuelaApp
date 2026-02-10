using Escuela.API.Dtos; 
using Escuela.API.Services;
using Escuela.Core.Entities;
using Escuela.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Security.Claims;

namespace Escuela.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MatriculasController : ControllerBase
    {
        private readonly EscuelaDbContext _context;
        private readonly UserManager<IdentityUser> _userManager;
        private readonly IEmailService _emailService;

        public MatriculasController(EscuelaDbContext context, UserManager<IdentityUser> userManager, IEmailService emailService)
        {
            _context = context;
            _userManager = userManager;
            _emailService = emailService;
        }

        [HttpGet("Pendientes")]
        public async Task<IActionResult> GetSolicitudesPendientes()
        {
            var pendientes = await _context.SolicitudesMatricula
                .Where(s => s.Estado == EstadoSolicitud.EnRevision)
                .Select(s => new
                {
                    s.Id,
                    s.Dni,
                    NombreCompleto = $"{s.Nombres} {s.Apellidos}",
                    s.UrlFotoDni,
                    s.UrlConstanciaNotas,
                    Pago = s.PagoRealizado ? "OK" : "PENDIENTE",
                    Fecha = s.FechaSolicitud.ToShortDateString()
                })
                .ToListAsync();

            return Ok(pendientes);
        }

        [HttpGet]
        [Authorize(Roles = "Administrativo,Academico")]
        public async Task<ActionResult<IEnumerable<MatriculaDto>>> GetMatriculas([FromQuery] int anio = 2026)
        {
            var matriculados = await _context.Matriculas
                .Include(m => m.Estudiante)
                .Include(m => m.Grado)
                .Include(m => m.Seccion)
                .Include(m => m.Periodo)
                .Where(m => m.FechaMatricula.Year == anio)
                .Select(m => new MatriculaDto
                {
                    Id = m.Id,
                    Estudiante = $"{m.Estudiante!.Nombres} {m.Estudiante.Apellidos}",
                    Grado = m.Grado!.Nombre,
                    Seccion = m.Seccion != null ? m.Seccion.Nombre : "Sin Asignar",
                    Periodo = m.Periodo != null ? m.Periodo.Nombre : "Sin Periodo",
                    Fecha = m.FechaMatricula
                })
                .ToListAsync();

            return Ok(matriculados);
        }

        [HttpPost("Observar")]
        public async Task<IActionResult> ObservarSolicitud([FromBody] ObservacionDto dto)
        {
            var solicitud = await _context.SolicitudesMatricula.FindAsync(dto.SolicitudId);
            if (solicitud == null) return NotFound("Solicitud no encontrada");

            solicitud.Estado = EstadoSolicitud.Observado;
            solicitud.Observaciones = dto.MensajeError;
            await _context.SaveChangesAsync();

            string linkSubsanacion = $"http://localhost:5173/admision/carpeta?token={solicitud.TokenSeguimiento}";
            string mensajeWhatsapp = $"Estimado apoderado de {solicitud.Nombres}. Hemos revisado sus documentos y tenemos una observación: *{dto.MensajeError}*. Por favor, corrija los documentos ingresando aquí: {linkSubsanacion}";
            string urlWhatsapp = $"https://wa.me/51{solicitud.TelefonoApoderado}?text={Uri.EscapeDataString(mensajeWhatsapp)}";

            return Ok(new
            {
                mensaje = "Solicitud observada.",
                accion = "Abrir WhatsApp Web",
                linkWhatsapp = urlWhatsapp
            });
        }

        [HttpPost("Procesar")]
        public async Task<IActionResult> ProcesarMatricula([FromBody] AprobarSolicitudDto dto)
        {
            var solicitud = await _context.SolicitudesMatricula
                .FirstOrDefaultAsync(s => s.Id == dto.SolicitudId);

            if (solicitud == null) return NotFound("Solicitud no encontrada");

            if (!solicitud.PagoRealizado)
                return BadRequest("No se puede matricular: El pago no ha sido verificado.");

            if (solicitud.Estado == EstadoSolicitud.Matriculado)
                return BadRequest("El estudiante ya está matriculado.");

            string usuarioNombre = $"{solicitud.Nombres.Split(' ')[0].ToLower()}.{solicitud.Apellidos.Split(' ')[0].ToLower()}@escuela.com";
            string passwordInicial = solicitud.Dni;

            if (await _userManager.FindByNameAsync(usuarioNombre) == null)
            {
                var user = new IdentityUser
                {
                    UserName = usuarioNombre,
                    Email = solicitud.EmailPersonal,
                    EmailConfirmed = true
                };

                var result = await _userManager.CreateAsync(user, passwordInicial);
                if (!result.Succeeded)
                    return BadRequest($"Error Identity: {string.Join(", ", result.Errors.Select(e => e.Description))}");

                await _userManager.AddToRoleAsync(user, "Estudiantil");

                var estudiante = new Estudiante
                {
                    Nombres = solicitud.Nombres,
                    Apellidos = solicitud.Apellidos,
                    Dni = solicitud.Dni,
                    FechaNacimiento = solicitud.FechaNacimiento,
                    TelefonoApoderado = solicitud.TelefonoApoderado,
                    Email = usuarioNombre,
                    UsuarioId = user.Id
                };
                _context.Estudiantes.Add(estudiante);
                await _context.SaveChangesAsync();

                var matricula = new Matricula
                {
                    EstudianteId = estudiante.Id,
                    GradoId = solicitud.GradoId,
                    SeccionId = dto.SeccionId,
                    PeriodoId = dto.PeriodoId,
                    FechaMatricula = DateTime.Now
                };
                _context.Matriculas.Add(matricula);
                await _context.SaveChangesAsync();

                await GenerarPensionesAnuales(matricula.Id);
            }

            solicitud.Estado = EstadoSolicitud.Matriculado;
            await _context.SaveChangesAsync();

            await _emailService.SendEmailAsync(solicitud.EmailPersonal, "¡Bienvenido a la Institución Educativa Alfred Nobel! - Credenciales",
                $"<h1>Matrícula Aprobada</h1><p>Usuario: {usuarioNombre}</p><p>Clave: {passwordInicial}</p><p>Ya puede ingresar al intranet para ver sus pensiones.</p>");

            return Ok(new { mensaje = "Matrícula finalizada y cronograma de pagos generado." });
        }

        [HttpPost("Directa")]
        [Authorize(Roles = "Administrativo")]
        public async Task<IActionResult> MatriculaDirecta([FromBody] CrearMatriculaDto dto)
        {
            if (!await _context.Estudiantes.AnyAsync(e => e.Id == dto.EstudianteId)) return BadRequest("El estudiante no existe.");
            if (!await _context.Grados.AnyAsync(g => g.Id == dto.GradoId)) return BadRequest("El grado no existe.");
            if (!await _context.Secciones.AnyAsync(s => s.Id == dto.SeccionId)) return BadRequest("La sección no existe.");

            var existe = await _context.Matriculas
                .AnyAsync(m => m.EstudianteId == dto.EstudianteId && m.PeriodoId == dto.PeriodoId);

            if (existe) return BadRequest("El estudiante ya está matriculado en este periodo.");

            var matricula = new Matricula
            {
                EstudianteId = dto.EstudianteId,
                GradoId = dto.GradoId,
                SeccionId = dto.SeccionId,
                PeriodoId = dto.PeriodoId,
                FechaMatricula = DateTime.Now
            };

            _context.Matriculas.Add(matricula);
            await _context.SaveChangesAsync();

            await GenerarPensionesAnuales(matricula.Id);

            return Ok(new { mensaje = "Matrícula directa registrada exitosamente.", matriculaId = matricula.Id });
        }


        [HttpGet("MiMatriculaActual")]
        [Authorize(Roles = "Estudiantil")]
        public async Task<ActionResult<MatriculaDto>> GetMiMatriculaActual()
        {
            var userId = User.FindFirstValue("uid");

            var matricula = await _context.Matriculas
                .Include(m => m.Grado)
                .Where(m => m.Estudiante.UsuarioId == userId)
                .OrderByDescending(m => m.FechaMatricula) 
                .FirstOrDefaultAsync();

            if (matricula == null) return NotFound("No tienes matrícula activa.");

            return Ok(new
            {
                Id = matricula.Id,
                Grado = matricula.Grado?.Nombre,
                Fecha = matricula.FechaMatricula.ToShortDateString()
            });
        }

        [HttpGet("Ficha/{id}")]
        public async Task<IActionResult> DescargarFicha(int id)
        {
            var matricula = await _context.Matriculas
                .Include(m => m.Estudiante)
                .Include(m => m.Grado)
                .Include(m => m.Seccion)
                .Include(m => m.Periodo)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (matricula == null) return NotFound("Matrícula no encontrada.");

            var documento = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Arial"));

                    page.Header().Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text("COLEGIO PREUNIVERSITARIO - ALFRED NOBEL").Bold().FontSize(16).FontColor(Colors.Blue.Medium);
                            col.Item().Text("R.D. N° 1234-2025-UGEL04").FontSize(10);
                            col.Item().Text("Av. Universitaria 123, Lima").FontSize(10);
                        });
                        row.ConstantItem(100).AlignRight().Text($"Ficha N° {matricula.Id:D6}").SemiBold();
                    });

                    page.Content().PaddingVertical(1, Unit.Centimetre).Column(col =>
                    {
                        col.Item().AlignCenter().Text("FICHA ÚNICA DE MATRÍCULA 2026").Bold().FontSize(14).Underline();
                        col.Item().Height(1, Unit.Centimetre);

                        col.Item().Text("I. DATOS DEL ESTUDIANTE").Bold().BackgroundColor(Colors.Grey.Lighten3);
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns => { columns.ConstantColumn(100); columns.RelativeColumn(); });
                            table.Cell().Text("Código:"); table.Cell().Text(matricula.Estudiante!.UsuarioId ?? "Sin Usuario").Bold();
                            table.Cell().Text("Apellidos:"); table.Cell().Text(matricula.Estudiante.Apellidos);
                            table.Cell().Text("Nombres:"); table.Cell().Text(matricula.Estudiante.Nombres);
                            table.Cell().Text("DNI:"); table.Cell().Text(matricula.Estudiante.Dni);
                            table.Cell().Text("Fecha Nac.:"); table.Cell().Text(matricula.Estudiante.FechaNacimiento.ToString("dd/MM/yyyy"));
                        });

                        col.Item().Height(1, Unit.Centimetre);

                        col.Item().Text("II. UBICACIÓN ACADÉMICA").Bold().BackgroundColor(Colors.Grey.Lighten3);
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns => { columns.ConstantColumn(100); columns.RelativeColumn(); columns.ConstantColumn(100); columns.RelativeColumn(); });
                            table.Cell().Text("Nivel:"); table.Cell().Text(matricula.Grado!.Nivel);
                            table.Cell().Text("Grado:"); table.Cell().Text(matricula.Grado.Nombre);
                            table.Cell().Text("Sección:"); table.Cell().Text(matricula.Seccion?.Nombre ?? "Sin Asignar");
                            table.Cell().Text("Turno:"); table.Cell().Text("Mañana");
                        });

                        col.Item().Height(2, Unit.Centimetre);

                        col.Item().Background(Colors.Grey.Lighten4).Padding(10).Column(c =>
                        {
                            c.Item().Text("DECLARACIÓN JURADA").Bold();
                            c.Item().Text($"Yo, padre, madre, tutor con número de contacto +51 {matricula.Estudiante.TelefonoApoderado} me comprometo a respetar el reglamento interno de la institución y cumplir con el cronograma de pagos establecido.");
                        });

                        col.Item().Height(3, Unit.Centimetre);

                        col.Item().Row(row =>
                        {
                            row.RelativeItem().Column(c => { c.Item().AlignCenter().Text("_________________________"); c.Item().AlignCenter().Text("Firma del Apoderado"); });
                            row.ConstantItem(50);
                            row.RelativeItem().Column(c => { c.Item().AlignCenter().Text("_________________________"); c.Item().AlignCenter().Text("Secretaría General"); });
                        });
                    });

                    page.Footer().AlignCenter().Text(x =>
                    {
                        x.Span("Página "); x.CurrentPageNumber(); x.Span(" / "); x.TotalPages();
                    });
                });
            });

            byte[] pdfBytes = documento.GeneratePdf();
            return File(pdfBytes, "application/pdf", $"Ficha_Matricula_{matricula.Estudiante!.Dni}.pdf");
        }


        private async Task GenerarPensionesAnuales(int matriculaId)
        {
            var pensiones = new List<Pension>();
            int anioActual = DateTime.Now.Year;
            decimal montoMensual = 500.00m;

            for (int mes = 3; mes <= 12; mes++)
            {
                var ultimoDia = DateTime.DaysInMonth(anioActual, mes);
                var fechaVencimiento = new DateTime(anioActual, mes, ultimoDia);

                pensiones.Add(new Pension
                {
                    MatriculaId = matriculaId,
                    Mes = ObtenerNombreMes(mes),
                    NumeroMes = mes,
                    Monto = montoMensual,
                    Mora = 0,
                    FechaVencimiento = fechaVencimiento,
                    Pagado = false
                });
            }
            _context.Pensiones.AddRange(pensiones);
            await _context.SaveChangesAsync();
        }

        private string ObtenerNombreMes(int numeroMes)
        {
            return new DateTime(2024, numeroMes, 1).ToString("MMMM", new System.Globalization.CultureInfo("es-PE")).ToUpper();
        }
    }
    
}