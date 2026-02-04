using System.ComponentModel.DataAnnotations;

namespace Escuela.API.Dtos
{
    public class CrearComunicadoDto
    {
        [Required]
        public string Titulo { get; set; } = string.Empty;
        [Required]
        public string Contenido { get; set; } = string.Empty;
        public int? GradoId { get; set; }
        public string DestinatarioRol { get; set; } = "General";
    }
}