using System.ComponentModel.DataAnnotations;

namespace Escuela.API.Dtos
{
    public class PagarPensionDto
    {
        [Required]
        public int PensionId { get; set; }

        [Required]
        [MaxLength(16)]
        public string NumeroTarjeta { get; set; } = string.Empty;

        [Required]
        [MaxLength(5)]
        public string FechaVencimiento { get; set; } = string.Empty; 

        [Required]
        [MaxLength(3)]
        public string Cvv { get; set; } = string.Empty;
    }
}