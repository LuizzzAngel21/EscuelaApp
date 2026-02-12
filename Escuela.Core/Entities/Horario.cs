using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization; 

namespace Escuela.Core.Entities
{
    public class Horario
    {
        public int Id { get; set; }

        [Required]
        public string DiaSemana { get; set; } 

        [Required]
        public TimeSpan HoraInicio { get; set; } 

        [Required]
        public TimeSpan HoraFin { get; set; } 

        public int CursoId { get; set; }

        [JsonIgnore] 
        public Curso? Curso { get; set; }


        public int SeccionId { get; set; }
        public Seccion? Seccion { get; set; }
    }
}