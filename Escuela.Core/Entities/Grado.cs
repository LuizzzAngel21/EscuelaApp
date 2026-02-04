using System.ComponentModel.DataAnnotations; 
using System.Text.Json.Serialization; 

namespace Escuela.Core.Entities
{
    public class Grado
    {
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Nombre { get; set; } = string.Empty;
        public string Nivel { get; set; } = string.Empty;

        [JsonIgnore]
        public ICollection<Matricula>? Matriculas { get; set; }

        [JsonIgnore]
        public ICollection<Curso>? Cursos { get; set; }

        [JsonIgnore]
        public ICollection<Seccion>? Secciones { get; set; }
    }
}