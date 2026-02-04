using System.ComponentModel.DataAnnotations;

namespace Escuela.Core.Entities
{
    public class Docente
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Nombres { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Apellidos { get; set; } = string.Empty;

        [StringLength(8)]
        public string Dni { get; set; } = string.Empty;

        public string? Especialidad { get; set; }

        public bool Activo { get; set; } = true;

        public string? UsuarioId { get; set; }
    }
}