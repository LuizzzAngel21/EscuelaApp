using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Escuela.Core.Entities
{
    public class Entrega
    {
        public int Id { get; set; }

        public DateTime FechaEnvio { get; set; } = DateTime.Now;

        public string? RutaArchivo { get; set; }

        [Column(TypeName = "decimal(4, 2)")]
        public decimal? Calificacion { get; set; }

        public string? ComentariosDocente { get; set; }

        public int TareaId { get; set; }
        public Tarea? Tarea { get; set; }

        public int EstudianteId { get; set; }
        public Estudiante? Estudiante { get; set; }
    }
}