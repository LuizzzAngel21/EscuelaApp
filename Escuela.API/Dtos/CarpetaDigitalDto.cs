using System.ComponentModel.DataAnnotations;

namespace Escuela.API.Dtos
{
    public class CarpetaDigitalDto
    {
        [Required]
        public Guid Token { get; set; }

        public IFormFile? FotoDni { get; set; }

        public IFormFile? ConstanciaNotas { get; set; }

        public IFormFile? SeguroMedico { get; set; }
        [MaxLength(16)]
        public string? NumeroTarjeta { get; set; }

        public string? FechaVencimiento { get; set; }

        public string? Cvv { get; set; }
    }
}