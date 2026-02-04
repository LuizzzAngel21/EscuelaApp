using System.ComponentModel.DataAnnotations;

namespace Escuela.API.Dtos
{
    public class CrearCriterioDto
    {
        [Required(ErrorMessage = "El nombre de la evaluación es obligatorio (Ej: Examen Parcial).")]
        [StringLength(50, ErrorMessage = "El nombre es muy largo, máximo 50 caracteres.")]
        public string Nombre { get; set; } = string.Empty;

        [Required(ErrorMessage = "El peso es obligatorio.")]
        [Range(0.01, 1.0, ErrorMessage = "El peso debe ser un decimal entre 0.01 y 1.0 (Ej: 0.30 para 30%).")]
        public decimal Peso { get; set; }

        [Required(ErrorMessage = "El ID del curso es obligatorio.")]
        public int CursoId { get; set; }
    }
}
