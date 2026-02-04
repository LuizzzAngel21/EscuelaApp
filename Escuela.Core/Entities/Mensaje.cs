using System;
using System.ComponentModel.DataAnnotations;

namespace Escuela.Core.Entities
{
    public class Mensaje
    {
        public int Id { get; set; }

        [Required]
        public string Asunto { get; set; } = string.Empty;

        [Required]
        public string Contenido { get; set; } = string.Empty;

        public DateTime FechaEnvio { get; set; } = DateTime.Now;

        public bool Leido { get; set; } = false;

        public string? ArchivoAdjuntoUrl { get; set; }


        public string RemitenteId { get; set; } = string.Empty;
        public string NombreRemitente { get; set; } = string.Empty;

        public string DestinatarioId { get; set; } = string.Empty;
        public bool EliminadoPorDestinatario { get; set; } = false;
        public bool EliminadoPorRemitente { get; set; } = false;
    }
}