using System.ComponentModel.DataAnnotations;

namespace Escuela.API.Dtos
{
    public class CrearDocenteDto
    {
        [Required(ErrorMessage = "Los nombres son obligatorios.")]
        [StringLength(100, ErrorMessage = "El nombre no puede exceder los 100 caracteres.")]
        public string Nombres { get; set; } = string.Empty;

        [Required(ErrorMessage = "Los apellidos son obligatorios.")]
        [StringLength(100, ErrorMessage = "El apellido no puede exceder los 100 caracteres.")]
        public string Apellidos { get; set; } = string.Empty;

        [Required(ErrorMessage = "El DNI es obligatorio.")]
        [StringLength(8, MinimumLength = 8, ErrorMessage = "El DNI debe tener exactamente 8 dígitos.")]
        [RegularExpression(@"^\d+$", ErrorMessage = "El DNI solo debe contener números.")]
        public string Dni { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "La especialidad es muy larga (máx 100 chars).")]
        public string? Especialidad { get; set; }

        [Required(ErrorMessage = "Es obligatorio asignar un Usuario ID al docente.")]
        public string UsuarioId { get; set; } = string.Empty;
    }
}
