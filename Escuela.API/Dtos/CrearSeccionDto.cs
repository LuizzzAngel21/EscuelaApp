using System.ComponentModel.DataAnnotations;

namespace Escuela.API.Dtos
{
    public class CrearSeccionDto
    {
        [Required]
        [StringLength(50)]
        public string Nombre { get; set; } = string.Empty;

        [Required]
        public int GradoId { get; set; }

        public int Capacidad { get; set; } = 30;
    }
}