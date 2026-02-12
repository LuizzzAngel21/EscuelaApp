using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Escuela.Core.Entities
{
    public class CriterioEvaluacion
    {
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Nombre { get; set; } = string.Empty;

        [Range(0.0, 1.0)]
        public decimal Peso { get; set; } 

        [Range(1, 4, ErrorMessage = "El número de periodo debe ser entre 1 y 4")]
        public int NumeroPeriodo { get; set; } = 1;

        public int CursoId { get; set; }

        [JsonIgnore]
        public Curso? Curso { get; set; }
    }
}