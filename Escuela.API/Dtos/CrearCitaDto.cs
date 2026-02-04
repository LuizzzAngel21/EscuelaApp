using System.ComponentModel.DataAnnotations;

namespace Escuela.API.Dtos
{
    public class CrearCitaDto
    {
        [Required]
        public string DestinatarioId { get; set; } = string.Empty;

        [Required]
        public DateTime FechaHora { get; set; }

        [Required]
        public string Motivo { get; set; } = string.Empty;

        public bool EsVirtual { get; set; } = false;
    }
}