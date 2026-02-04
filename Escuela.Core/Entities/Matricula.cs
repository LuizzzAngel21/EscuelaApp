using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Escuela.Core.Entities
{
    public class Matricula
    {
        public int Id { get; set; }
        public int EstudianteId { get; set; }
        public int GradoId { get; set; }
        public int SeccionId { get; set; }
        public int PeriodoId { get; set; }

        public DateTime FechaMatricula { get; set; } = DateTime.Now;

        public virtual Estudiante? Estudiante { get; set; }
        public virtual Grado? Grado { get; set; }
        public virtual Seccion? Seccion { get; set; }
        public virtual Periodo? Periodo { get; set; }
    }
}