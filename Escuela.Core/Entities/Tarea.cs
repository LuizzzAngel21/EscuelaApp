using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Escuela.Core.Entities
{
    public class Tarea
    {
        public int Id { get; set; }

        [Required]
        public string Titulo { get; set; } = string.Empty;
        public string? Descripcion { get; set; }

        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        public DateTime FechaLimite { get; set; }

        public int CursoId { get; set; }
        [JsonIgnore]
        public Curso? Curso { get; set; } 

        [JsonIgnore]
        public ICollection<Entrega>? Entregas { get; set; }
    }
}