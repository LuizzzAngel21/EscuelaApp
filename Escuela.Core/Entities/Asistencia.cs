using System.ComponentModel.DataAnnotations;

namespace Escuela.Core.Entities
{
    public class Asistencia
    {
        public int Id { get; set; }
        public DateTime Fecha { get; set; } = DateTime.Now;
        public EstadoAsistencia Estado { get; set; }
        [StringLength(200)]
        public string? Observacion { get; set; }
        public int CursoId { get; set; }
        public Curso? Curso { get; set; }
        public int MatriculaId { get; set; }
        public Matricula? Matricula { get; set; }
    }
}