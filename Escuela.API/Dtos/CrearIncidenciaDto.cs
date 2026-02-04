using System.ComponentModel.DataAnnotations;

namespace Escuela.API.Dtos
{
    public class CrearIncidenciaDto
    {
        [Required]
        public int EstudianteId { get; set; }

        [Required]
        public string Titulo { get; set; } = string.Empty;

        [Required]
        public string Descripcion { get; set; } = string.Empty;

        [Required]
        public string Nivel { get; set; } = "Leve";
    }
}