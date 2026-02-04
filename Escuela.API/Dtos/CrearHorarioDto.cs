using System.ComponentModel.DataAnnotations;

namespace Escuela.API.Dtos
{
    public class CrearHorarioDto
    {
        [Required(ErrorMessage = "El curso es obligatorio.")]
        public int CursoId { get; set; }

        [Required(ErrorMessage = "El día de la semana es obligatorio.")]
        public string DiaSemana { get; set; } = string.Empty;

        [Required(ErrorMessage = "La hora de inicio es obligatoria.")]
        [RegularExpression(@"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$", ErrorMessage = "La hora inicio debe tener formato HH:mm (Ej: 08:00).")]
        public string HoraInicio { get; set; } = string.Empty;

        [Required(ErrorMessage = "La hora de fin es obligatoria.")]
        [RegularExpression(@"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$", ErrorMessage = "La hora fin debe tener formato HH:mm (Ej: 09:30).")]
        public string HoraFin { get; set; } = string.Empty;
    }
}
