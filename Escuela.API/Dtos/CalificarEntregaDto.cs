using System.ComponentModel.DataAnnotations;

namespace Escuela.API.Dtos
{
    public class CalificarEntregaDto
    {
        [Required(ErrorMessage = "La nota es obligatoria.")]
        [Range(0, 20, ErrorMessage = "La nota debe estar entre 0 y 20.")]
        public decimal Nota { get; set; }

        public string? Comentarios { get; set; }
    }
}
