using System.ComponentModel.DataAnnotations;

namespace Escuela.API.Dtos
{
    public class CrearPsicologoDto
    {
        [Required]
        public string Nombres { get; set; } = string.Empty;
        [Required]
        public string Apellidos { get; set; } = string.Empty;
        [Required]
        public string Dni { get; set; } = string.Empty;
        public string Cpsp { get; set; } = string.Empty;
        public string Especialidad { get; set; } = "Psicología Educativa";

        [Required]
        public string UsuarioId { get; set; } = string.Empty;
    }
}