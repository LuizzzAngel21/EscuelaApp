using System.ComponentModel.DataAnnotations;

namespace Escuela.Core.Entities
{
    public class Incidencia
    {
        public int Id { get; set; }

        public int EstudianteId { get; set; }
        public Estudiante? Estudiante { get; set; }

        [Required]
        public string ReportadoPorId { get; set; } = string.Empty;

        [Required]
        public string NombreReportador { get; set; } = string.Empty; 

        public DateTime Fecha { get; set; } = DateTime.Now;

        [Required]
        [MaxLength(100)]
        public string Titulo { get; set; } = string.Empty; 

        [Required]
        public string Descripcion { get; set; } = string.Empty; 

        [Required]
        public string Nivel { get; set; } = "Leve";

        public string Estado { get; set; } = "Abierto"; 

        public string? DescargoAlumno { get; set; } 
    }
}