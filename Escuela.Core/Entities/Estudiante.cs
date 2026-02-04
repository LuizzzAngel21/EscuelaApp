using System.ComponentModel.DataAnnotations;

namespace Escuela.Core.Entities
{
    public class Estudiante
    {
        public int Id { get; set; }

        [Required]
        [StringLength(8)]
        public string Dni { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Nombres { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Apellidos { get; set; } = string.Empty;

        public DateTime FechaNacimiento { get; set; }

        [StringLength(15)]
        public string? TelefonoApoderado { get; set; }
          public string? Email { get; set; } 
        public string? UsuarioId { get; set; }
    }
}