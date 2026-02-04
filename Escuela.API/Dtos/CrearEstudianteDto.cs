using System.ComponentModel.DataAnnotations;

namespace Escuela.API.Dtos
{
    public class CrearEstudianteDto
    {
        [Required(ErrorMessage = "El DNI es obligatorio.")]
        [StringLength(8, MinimumLength = 8, ErrorMessage = "El DNI debe tener exactamente 8 dígitos.")]
        [RegularExpression(@"^\d+$", ErrorMessage = "El DNI solo debe contener números.")]
        public string Dni { get; set; } = string.Empty;

        [Required(ErrorMessage = "Los nombres son obligatorios.")]
        public string Nombres { get; set; } = string.Empty;

        [Required(ErrorMessage = "Los apellidos son obligatorios.")]
        public string Apellidos { get; set; } = string.Empty;

        [Required(ErrorMessage = "La fecha de nacimiento es obligatoria.")]
        public DateTime FechaNacimiento { get; set; }

        public string? TelefonoApoderado { get; set; }

        [Required(ErrorMessage = "El correo electrónico es obligatorio.")]
        [EmailAddress(ErrorMessage = "El formato del correo no es válido.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "El ID de usuario es obligatorio.")]
        public string UsuarioId { get; set; } = string.Empty;
    }
}
