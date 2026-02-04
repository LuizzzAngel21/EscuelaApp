using System.ComponentModel.DataAnnotations;

namespace Escuela.API.Dtos
{
    public class CrearMensajeDto
    {
        [Required]
        public string DestinatarioId { get; set; } = string.Empty;

        [Required]
        public string Asunto { get; set; } = string.Empty;

        [Required]
        public string Contenido { get; set; } = string.Empty;

        public string? ArchivoAdjuntoUrl { get; set; }
    }
}