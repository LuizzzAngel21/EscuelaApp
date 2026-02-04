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


            if (await context.Estudiantes.AnyAsync())
            {
                Console.WriteLine("si ves esto tu bd ya tiene datos, en caso quieras limpiar usa el drop-database :>");
                return;
            }

            try
            {
                Console.WriteLine("todo esto es la carga de datos como una simulación luego ya insertaremos todos los datos reales");

                Console.WriteLine("aqui toy creando los roles en la tabla ya");
                string[] roles = { "Administrativo", "Academico", "Estudiantil", "Psicologo" };
                foreach (var rol in roles)
                {
                    if (!await roleManager.RoleExistsAsync(rol))
                        await roleManager.CreateAsync(new IdentityRole(rol));
                }

                Console.WriteLine(" aqui toy creando los administradores, cuando ejecuten el programa por primera vez tendrían que ver como se registrar estos datos");
                await CrearUsuario(userManager, "director@escuela.com", "Admin123!", "Administrativo");
                await CrearUsuario(userManager, "secretaria@escuela.com", "Admin123!", "Administrativo");


                Console.WriteLine(" aqui toy creando los psicologos, cuando ejecuten el programa por primera vez tendrían que ver como se registrar estos datos");
                var psico1 = await CrearUsuario(userManager, "freud@escuela.com", "Salud123!", "Psicologo");
                if (!context.Psicologos.Any(p => p.UsuarioId == psico1.Id))
                    context.Psicologos.Add(new Psicologo { Nombres = "Sigmund", Apellidos = "Freud", UsuarioId = psico1.Id, Dni = "00000001", Cpsp = "12345", Especialidad = "Clínica", Activo = true });

                var psico2 = await CrearUsuario(userManager, "jung@escuela.com", "Salud123!", "Psicologo");
                if (!context.Psicologos.Any(p => p.UsuarioId == psico2.Id))
                    context.Psicologos.Add(new Psicologo { Nombres = "Carl", Apellidos = "Jung", UsuarioId = psico2.Id, Dni = "00000002", Cpsp = "67890", Especialidad = "Educativa", Activo = true });

                await context.SaveChangesAsync();


                Console.WriteLine(" aqui toy creando los docentes, cuando ejecuten el programa por primera vez tendrían que ver como se registrar estos datos");
                var listaDocentes = new List<(string Email, string Nombre, string Apellido, string Especialidad)>
                {
                    ("mate@escuela.com", "Alan", "Turing", "Matemáticas"),
                    ("lengua@escuela.com", "Gabriela", "Mistral", "Comunicación"),
                    ("ciencia@escuela.com", "Albert", "Einstein", "Ciencia y Tecnología"),
                    ("historia@escuela.com", "Jorge", "Basadre", "Ciencias Sociales"),
                    ("ingles@escuela.com", "William", "Shakespeare", "Inglés"),
                    ("arte@escuela.com", "Frida", "Kahlo", "Arte y Cultura"),
                    ("fisica@escuela.com", "Usain", "Bolt", "Educación Física")
                };

                var docentesEntidades = new List<Docente>();

                foreach (var datosProfe in listaDocentes)
                {
                    var userProfe = await CrearUsuario(userManager, datosProfe.Email, "Profe123!", "Academico");

                    var docente = new Docente
                    {
                        Nombres = datosProfe.Nombre,
                        Apellidos = datosProfe.Apellido,
                        Dni = GenerarDniRandom(),
                        Especialidad = datosProfe.Especialidad,
                        UsuarioId = userProfe.Id,
                        Activo = true
                    };
                    context.Docentes.Add(docente);
                    docentesEntidades.Add(docente);
                }
                await context.SaveChangesAsync();

              
                Console.WriteLine("aqui se crea las bases del cole");
                if (!context.Periodos.Any())
                {
                    context.Periodos.Add(new Periodo { Nombre = "Año Escolar 2026", FechaInicio = new DateTime(2026, 3, 1), FechaFin = new DateTime(2026, 12, 20), Activo = true });
                    await context.SaveChangesAsync();
                }
                var periodo = await context.Periodos.FirstAsync(p => p.Activo);

                string[] gradosNombres = { "1ro Secundaria", "2do Secundaria", "3ro Secundaria", "4to Secundaria", "5to Secundaria" };
                var gradosList = new List<Grado>();

                foreach (var nombre in gradosNombres)
                {
                    var grado = await context.Grados.FirstOrDefaultAsync(g => g.Nombre == nombre);
                    if (grado == null)
                    {
                        grado = new Grado { Nombre = nombre, Nivel = "Secundaria" };
                        context.Grados.Add(grado);
                        await context.SaveChangesAsync();
                    }
                    gradosList.Add(grado);

                    if (!context.Secciones.Any(s => s.GradoId == grado.Id && s.Nombre == "A"))
                        context.Secciones.Add(new Seccion { Nombre = "A", Capacidad = 30, GradoId = grado.Id });

                    if (!context.Secciones.Any(s => s.GradoId == grado.Id && s.Nombre == "B"))
                        context.Secciones.Add(new Seccion { Nombre = "B", Capacidad = 30, GradoId = grado.Id });

                    await context.SaveChangesAsync();
                }

                Console.WriteLine("aqui cursos y hoarios ");
                var bloquesHorarios = new List<(TimeSpan Inicio, TimeSpan Fin)>
                {
                    (new TimeSpan(7, 45, 0), new TimeSpan(9, 15, 0)),
                    (new TimeSpan(9, 30, 0), new TimeSpan(11, 0, 0)),
                    (new TimeSpan(11, 30, 0), new TimeSpan(13, 0, 0)),
                    (new TimeSpan(13, 0, 0), new TimeSpan(14, 30, 0))
                };
                string[] diasSemana = { "Lunes", "Martes", "Miércoles", "Jueves", "Viernes" };

                foreach (var grado in gradosList)
                {
                    if (!context.Cursos.Any(c => c.GradoId == grado.Id))
                    {
                        var cursosDelGrado = new List<Curso>();
                        var profeMate = docentesEntidades.FirstOrDefault(d => d.Especialidad == "Matemáticas") ?? docentesEntidades.First();
                        var profeComu = docentesEntidades.FirstOrDefault(d => d.Especialidad == "Comunicación") ?? docentesEntidades.First();
                        var profeCiencia = docentesEntidades.FirstOrDefault(d => d.Especialidad == "Ciencia y Tecnología") ?? docentesEntidades.First();
                        var profeSociales = docentesEntidades.FirstOrDefault(d => d.Especialidad == "Ciencias Sociales") ?? docentesEntidades.First();
                        var profeIngles = docentesEntidades.FirstOrDefault(d => d.Especialidad == "Inglés") ?? docentesEntidades.First();
                        var profeArte = docentesEntidades.FirstOrDefault(d => d.Especialidad == "Arte y Cultura") ?? docentesEntidades.First();
                        var profeFisica = docentesEntidades.FirstOrDefault(d => d.Especialidad == "Educación Física") ?? docentesEntidades.First();

                        cursosDelGrado.Add(CrearCurso(context, "Matemática", grado, profeMate));
                        cursosDelGrado.Add(CrearCurso(context, "Comunicación", grado, profeComu));
                        cursosDelGrado.Add(CrearCurso(context, "Ciencia y Tecnología", grado, profeCiencia));
                        cursosDelGrado.Add(CrearCurso(context, "Historia y Geografía", grado, profeSociales));
                        cursosDelGrado.Add(CrearCurso(context, "Inglés", grado, profeIngles));
                        cursosDelGrado.Add(CrearCurso(context, "Arte", grado, profeArte));
                        cursosDelGrado.Add(CrearCurso(context, "Educación Física", grado, profeFisica));

                        await context.SaveChangesAsync();

                        var colaCursos = new Queue<Curso>(cursosDelGrado);
                        while (colaCursos.Count < 25) 
                        {
                            foreach (var c in cursosDelGrado) colaCursos.Enqueue(c);
                        }

                        foreach (var dia in diasSemana)
                        {
                            foreach (var bloque in bloquesHorarios)
                            {
                                if (colaCursos.TryDequeue(out var cursoBloque))
                                {
                                    context.Horarios.Add(new Horario { CursoId = cursoBloque.Id, DiaSemana = dia, HoraInicio = bloque.Inicio, HoraFin = bloque.Fin });
                                }
                            }
                        }
                    }
                }
                await context.SaveChangesAsync();

                Console.WriteLine(" aqui toy creando los alumnos, cuando ejecuten el programa por primera vez tendrían que ver como se registrar estos datos");
                var secciones = await context.Secciones.ToListAsync();
                int contadorDni = 70000000;

                foreach (var seccion in secciones)
                {
                    var countAlumnos = await context.Matriculas.CountAsync(m => m.SeccionId == seccion.Id);
                    if (countAlumnos >= 10) continue;

                    var grado = gradosList.First(g => g.Id == seccion.GradoId);

                    for (int i = 1; i <= 10; i++)
                    {
                        contadorDni++;
                        string dniSeguro = contadorDni.ToString();
                        string email = $"est.{i}.g{grado.Id}s{seccion.Nombre}@escuela.com".ToLower().Replace(" ", "");

                        var userEstudiante = await CrearUsuario(userManager, email, "Estudiante123!", "Estudiantil");

                        if (!context.Estudiantes.Any(e => e.UsuarioId == userEstudiante.Id))
                        {
                            var estudiante = new Estudiante
                            {
                                Nombres = $"Estudiante {i}",
                                Apellidos = $"Del {grado.Nombre} - {seccion.Nombre}",
                                Dni = dniSeguro,
                                FechaNacimiento = new DateTime(2010, 1, 1),
                                TelefonoApoderado = "999888777",
                                Email = email,
                                UsuarioId = userEstudiante.Id
                            };
                            context.Estudiantes.Add(estudiante);
                            await context.SaveChangesAsync();

                            var matricula = new Matricula
                            {
                                EstudianteId = estudiante.Id,
                                GradoId = grado.Id,
                                SeccionId = seccion.Id,
                                PeriodoId = periodo.Id,
                                FechaMatricula = DateTime.Now
                            };
                            context.Matriculas.Add(matricula);
                        }
                    }
                    Console.Write("."); 
                }
                await context.SaveChangesAsync();
                Console.WriteLine("\n✨ ¡CARGA DE DATOS COMPLETADA EXITOSAMENTE! ✨");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"\n❌ ERROR CRÍTICO EN DBSEEDER: {ex.Message}");
                if (ex.InnerException != null) Console.WriteLine($"   Detalle: {ex.InnerException.Message}");
            }
        }

        private static async Task<IdentityUser> CrearUsuario(UserManager<IdentityUser> um, string email, string password, string rol)
        {
            var user = await um.FindByEmailAsync(email);
            if (user == null)
            {
                user = new IdentityUser { UserName = email, Email = email, EmailConfirmed = true };
                var result = await um.CreateAsync(user, password);
                if (result.Succeeded)
                {
                    await um.AddToRoleAsync(user, rol);
                }
            }
            return user;
        }

        private static Curso CrearCurso(EscuelaDbContext context, string materia, Grado grado, Docente docente)
        {
            var curso = new Curso { Nombre = $"{materia} - {grado.Nombre}", Descripcion = $"Materia de {materia}", GradoId = grado.Id, DocenteId = docente.Id, Activo = true };
            context.Cursos.Add(curso);
            return curso;
        }

        private static string GenerarDniRandom() => new Random().Next(10000000, 99999999).ToString();
    }
}