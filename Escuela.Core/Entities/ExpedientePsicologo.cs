using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Escuela.Core.Entities
{
    public class ExpedientePsicologico
    {
        public int Id { get; set; }
        public int EstudianteId { get; set; }
        [ForeignKey("EstudianteId")]
        public Estudiante? Estudiante { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public string Recomendaciones { get; set; } = string.Empty;
        public DateTime FechaRegistro { get; set; } = DateTime.Now;
        public string PsicologoId { get; set; } = string.Empty;
    }
}