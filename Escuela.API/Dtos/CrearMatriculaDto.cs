using System.ComponentModel.DataAnnotations;

namespace Escuela.API.Dtos
{
    public class CrearMatriculaDto
    {
        [Required(ErrorMessage = "El estudiante es obligatorio.")]
        public int EstudianteId { get; set; }

        [Required(ErrorMessage = "El grado es obligatorio.")]
        public int GradoId { get; set; }

        [Required(ErrorMessage = "El periodo es obligatorio.")]
        public int PeriodoId { get; set; }

        [Required(ErrorMessage = "La sección es obligatoria")]
        public int SeccionId { get; set; }
    }
}
