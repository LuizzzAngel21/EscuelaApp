using System.ComponentModel.DataAnnotations;

namespace Escuela.API.Dtos
{
    public class CrearTareaDto
    {
        [Required(ErrorMessage = "El título de la tarea es obligatorio.")]
        [StringLength(100, ErrorMessage = "El título es demasiado largo.")]
        public string Titulo { get; set; } = string.Empty;

        [Required(ErrorMessage = "La descripción es obligatoria.")]
        public string Descripcion { get; set; } = string.Empty;

        [Required(ErrorMessage = "La fecha limite es obligatoria.")]
        public DateTime FechaLimite { get; set; }

        [Required(ErrorMessage = "La tarea debe pertenecer a un curso.")]
        public int CursoId { get; set; }
    }
}