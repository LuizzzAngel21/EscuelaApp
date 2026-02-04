using System.ComponentModel.DataAnnotations;

namespace Escuela.API.Dtos
{
    public class CrearNotaDto
    {
        [Required(ErrorMessage = "La matrícula del estudiante es obligatoria.")]
        public int MatriculaId { get; set; }

        [Required(ErrorMessage = "Debes seleccionar qué evaluación estás calificando (Ej: Parcial, Final).")]
        public int CriterioEvaluacionId { get; set; }

        [Required(ErrorMessage = "El valor de la nota es obligatorio.")]
        [Range(0, 20, ErrorMessage = "La nota debe estar entre 0 y 20.")]
        public decimal Valor { get; set; }
    }
}



