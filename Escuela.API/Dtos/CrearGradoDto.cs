using System.ComponentModel.DataAnnotations;

namespace Escuela.API.Dtos
{
    public class CrearGradoDto
    {
        [Required(ErrorMessage = "El nombre del grado es obligatorio.")]
        [StringLength(50, ErrorMessage = "El nombre del grado es muy largo.")]
        public string Nombre { get; set; } = string.Empty;

        [Required(ErrorMessage = "El nivel educativo es obligatorio.")]
        [StringLength(50, ErrorMessage = "El nivel es muy largo (Ej: Primaria, Secundaria).")]
        public string Nivel { get; set; } = string.Empty;
    }
}
