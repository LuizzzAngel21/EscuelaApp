using System.ComponentModel.DataAnnotations;

namespace Escuela.Core.Entities
{
    public class Periodo
    {
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Nombre { get; set; } = string.Empty;

        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }

        public bool Activo { get; set; } = true;
    }
}