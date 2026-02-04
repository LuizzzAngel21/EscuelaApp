using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Escuela.Core.Entities
{
    public class Seccion
    {
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Nombre { get; set; } = string.Empty;

        public int Capacidad { get; set; } = 30;

        public int GradoId { get; set; }

        [JsonIgnore]
        public Grado? Grado { get; set; }

        public ICollection<Matricula> Matriculas { get; set; } = new List<Matricula>();
    }
}