using Escuela.Core.Entities;
using Escuela.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Escuela.API.Data
{
    public static class DbSeeder
    {
        public static async Task Seed(IServiceProvider serviceProvider)
        {
            var context = serviceProvider.GetService<EscuelaDbContext>();
            var userManager = serviceProvider.GetService<UserManager<IdentityUser>>();
            var roleManager = serviceProvider.GetService<RoleManager<IdentityRole>>();

            if (await context.Estudiantes.AnyAsync()) return;

            try
            {
                var periodo = new Periodo
                {
                    Nombre = "Año Escolar 2026",
                    FechaInicio = new DateTime(2026, 3, 1),
                    FechaFin = new DateTime(2026, 12, 20),
                    Activo = true
                };
                context.Periodos.Add(periodo);
                await context.SaveChangesAsync();

                string[] nombresGrados = { "1ro Secundaria", "2do Secundaria", "3ro Secundaria", "4to Secundaria", "5to Secundaria" };
                var gradosEntidades = new List<Grado>();
                var seccionesTotales = new List<Seccion>();

                foreach (var nombre in nombresGrados)
                {
                    var grado = new Grado { Nombre = nombre, Nivel = "Secundaria" };
                    context.Grados.Add(grado);
                    await context.SaveChangesAsync();
                    gradosEntidades.Add(grado);

                    var secA = new Seccion { Nombre = "A", Capacidad = 30, GradoId = grado.Id };
                    var secB = new Seccion { Nombre = "B", Capacidad = 30, GradoId = grado.Id };
                    context.Secciones.AddRange(secA, secB);
                    seccionesTotales.Add(secA);
                    seccionesTotales.Add(secB);
                }
                await context.SaveChangesAsync();

                string[] roles = { "Administrativo", "Academico", "Estudiantil", "Psicologo" };
                foreach (var rol in roles)
                {
                    if (!await roleManager.RoleExistsAsync(rol))
                        await roleManager.CreateAsync(new IdentityRole(rol));
                }

                await CrearUsuario(userManager, "m.montiel@escuela.com", "Admin123!", "Administrativo");
                var pUser = await CrearUsuario(userManager, "r.sanchez@escuela.com", "Salud123!", "Psicologo");
                context.Psicologos.Add(new Psicologo { Nombres = "Ricardo", Apellidos = "Sanchez", UsuarioId = pUser.Id, Dni = "10203040", Cpsp = "12345", Especialidad = "Clinica", Activo = true });

                var listaDocentes = new List<(string Email, string Nombre, string Apellido, string Especialidad)>
                {
                    ("a.turing@escuela.com", "Alan", "Turing", "Matematicas"),
                    ("g.mistral@escuela.com", "Gabriela", "Mistral", "Comunicacion"),
                    ("a.einstein@escuela.com", "Albert", "Einstein", "Ciencia"),
                    ("j.basadre@escuela.com", "Jorge", "Basadre", "Historia"),
                    ("w.shakespeare@escuela.com", "William", "Shakespeare", "Ingles"),
                    ("f.kahlo@escuela.com", "Frida", "Kahlo", "Arte"),
                    ("u.bolt@escuela.com", "Usain", "Bolt", "Educacion Fisica")
                };

                var docentes = new List<Docente>();
                foreach (var d in listaDocentes)
                {
                    var user = await CrearUsuario(userManager, d.Email, "Profe123!", "Academico");
                    var docente = new Docente { Nombres = d.Nombre, Apellidos = d.Apellido, Dni = GenerarDniRandom(), Especialidad = d.Especialidad, UsuarioId = user.Id, Activo = true };
                    context.Docentes.Add(docente);
                    docentes.Add(docente);
                }
                await context.SaveChangesAsync();

                var cursosGlobales = new List<Curso>();
                foreach (var grado in gradosEntidades)
                {
                    for (int i = 0; i < listaDocentes.Count; i++)
                    {
                        var curso = new Curso
                        {
                            Nombre = listaDocentes[i].Especialidad,
                            GradoId = grado.Id,
                            DocenteId = docentes[i].Id,
                            Activo = true
                        };
                        context.Cursos.Add(curso);
                        cursosGlobales.Add(curso);
                    }
                }
                await context.SaveChangesAsync();

                var bloques = new List<(TimeSpan I, TimeSpan F)> {
                    (new TimeSpan(8, 0, 0), new TimeSpan(9, 30, 0)),
                    (new TimeSpan(9, 45, 0), new TimeSpan(11, 15, 0)),
                    (new TimeSpan(11, 30, 0), new TimeSpan(13, 0, 0))
                };
                string[] dias = { "Lunes", "Martes", "Miercoles", "Jueves", "Viernes" };
                var agendaDocentes = new HashSet<string>();

                foreach (var seccion in seccionesTotales)
                {
                    var cursosDeEsteGrado = cursosGlobales.Where(c => c.GradoId == seccion.GradoId).ToList();
                    int cIdx = 0;

                    foreach (var dia in dias)
                    {
                        foreach (var bloque in bloques)
                        {
                            if (cIdx >= cursosDeEsteGrado.Count) break;

                            var curso = cursosDeEsteGrado[cIdx];
                            string slot = $"{dia}-{bloque.I}-{curso.DocenteId}";

                            if (!agendaDocentes.Contains(slot))
                            {
                                context.Horarios.Add(new Horario
                                {
                                    CursoId = curso.Id,
                                    SeccionId = seccion.Id,
                                    DiaSemana = dia,
                                    HoraInicio = bloque.I,
                                    HoraFin = bloque.F
                                });
                                agendaDocentes.Add(slot);
                                cIdx++;
                            }
                        }
                    }
                }

                string[] nEst = { "Miguel", "Luis", "Carlos", "Sofia", "Elena", "Diego", "Lucia", "Juan", "Ana", "Roberto" };
                string[] aEst = { "Montiel", "Guillen", "Vargas", "Mendoza", "Paredes", "Soto", "Zevallos", "Rojas", "Bustamante", "Farfan" };

                foreach (var sec in seccionesTotales)
                {
                    for (int i = 0; i < 10; i++)
                    {
                        string email = $"est.{sec.Id}.{i}@escuela.com";
                        var uEst = await CrearUsuario(userManager, email, "Estudiante123!", "Estudiantil");
                        var estudiante = new Estudiante
                        {
                            Nombres = nEst[i],
                            Apellidos = aEst[i],
                            Dni = GenerarDniRandom(),
                            Email = email,
                            UsuarioId = uEst.Id,
                            FechaNacimiento = new DateTime(2010, 1, 1),
                            TelefonoApoderado = "900000000"
                        };
                        context.Estudiantes.Add(estudiante);
                        await context.SaveChangesAsync();

                        context.Matriculas.Add(new Matricula
                        {
                            EstudianteId = estudiante.Id,
                            GradoId = sec.GradoId,
                            SeccionId = sec.Id,
                            PeriodoId = periodo.Id,
                            FechaMatricula = DateTime.Now
                        });
                    }
                }
                await context.SaveChangesAsync();
                Console.WriteLine("✨ SIMULACION CARGADA EXITOSAMENTE ✨");
            }
            catch (Exception ex) { Console.WriteLine($"Error: {ex.Message}"); }
        }

        private static async Task<IdentityUser> CrearUsuario(UserManager<IdentityUser> um, string email, string password, string rol)
        {
            var user = await um.FindByEmailAsync(email);
            if (user == null)
            {
                user = new IdentityUser { UserName = email, Email = email, EmailConfirmed = true };
                await um.CreateAsync(user, password);
                await um.AddToRoleAsync(user, rol);
            }
            return user;
        }

        private static string GenerarDniRandom() => new Random().Next(70000000, 79999999).ToString();
    }
}