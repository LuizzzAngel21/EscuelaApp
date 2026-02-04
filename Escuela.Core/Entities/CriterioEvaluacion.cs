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
        public int CursoId { get; set; }
        [JsonIgnore]
        public Curso? Curso { get; set; }
    }
}