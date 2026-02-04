using System.ComponentModel.DataAnnotations;

namespace Escuela.API.Dtos
{
    public class SubirEntregaDto
    {
        [Required(ErrorMessage = "El ID de la tarea es obligatorio.")]
        public int TareaId { get; set; }
        [Required(ErrorMessage = "Debes adjuntar un archivo.")]
        public IFormFile Archivo { get; set; } = null!;
    }
}
