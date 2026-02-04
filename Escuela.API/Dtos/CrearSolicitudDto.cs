using System.ComponentModel.DataAnnotations;

namespace Escuela.API.Dtos
{
    public class CrearSolicitudDto
    {
        [Required(ErrorMessage = "El DNI es obligatorio.")]
        [StringLength(8, MinimumLength = 8, ErrorMessage = "El DNI debe tener exactamente 8 dígitos.")]
        public string Dni { get; set; } = string.Empty;

        [Required(ErrorMessage = "El nombre es obligatorio.")]
        public string Nombres { get; set; } = string.Empty;

        [Required(ErrorMessage = "El apellido es obligatorio.")]
        public string Apellidos { get; set; } = string.Empty;

        [Required(ErrorMessage = "La fecha de nacimiento es obligatoria.")]
        public DateTime FechaNacimiento { get; set; }

        public string? TelefonoApoderado { get; set; }

        [Required(ErrorMessage = "El correo personal es obligatorio.")]
        [EmailAddress(ErrorMessage = "Ingrese un correo válido.")]
        public string EmailPersonal { get; set; } = string.Empty;

        [Required(ErrorMessage = "Debe seleccionar un grado.")]
        public int GradoId { get; set; }
    }
}