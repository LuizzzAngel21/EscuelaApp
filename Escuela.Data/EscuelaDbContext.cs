using Escuela.Core.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;

namespace Escuela.Data
{
    public class EscuelaDbContext : IdentityDbContext
    {
        public EscuelaDbContext(DbContextOptions<EscuelaDbContext> options) : base(options)
        {
        }

        public DbSet<Curso> Cursos { get; set; }
        public DbSet<Grado> Grados { get; set; }
        public DbSet<Seccion> Secciones { get; set; }
        public DbSet<Periodo> Periodos { get; set; }
        public DbSet<Estudiante> Estudiantes { get; set; }
        public DbSet<Docente> Docentes { get; set; }
        public DbSet<Matricula> Matriculas { get; set; }
        public DbSet<Horario> Horarios { get; set; }
        public DbSet<Recurso> Recursos { get; set; }
        public DbSet<Tarea> Tareas { get; set; }
        public DbSet<Entrega> Entregas { get; set; }
        public DbSet<Nota> Notas { get; set; }
        public DbSet<CriterioEvaluacion> CriteriosEvaluacion { get; set; }
        public DbSet<Asistencia> Asistencias { get; set; }
        public DbSet<Psicologo> Psicologos { get; set; }
        public DbSet<Cita> Citas { get; set; }
        public DbSet<ExpedientePsicologico> ExpedientesPsicologicos { get; set; }
        public DbSet<Comunicado> Comunicados { get; set; }
        public DbSet<Mensaje> Mensajes { get; set; }
        public DbSet<SolicitudMatricula> SolicitudesMatricula { get; set; }
        public DbSet<Pension> Pensiones { get; set; }
        public DbSet<Incidencia> Incidencias { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<Nota>()
                .Property(p => p.Valor)
                .HasColumnType("decimal(4, 2)");

            builder.Entity<Curso>()
                .HasOne(c => c.Grado)
                .WithMany(g => g.Cursos)
                .HasForeignKey(c => c.GradoId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Entrega>()
                .Property(p => p.Calificacion)
                .HasColumnType("decimal(4, 2)");

            builder.Entity<CriterioEvaluacion>()
                .Property(c => c.Peso)
                .HasColumnType("decimal(5,2)");

            builder.Entity<Seccion>()
                .HasOne(s => s.Grado)            
                .WithMany(g => g.Secciones)     
                .HasForeignKey(s => s.GradoId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}