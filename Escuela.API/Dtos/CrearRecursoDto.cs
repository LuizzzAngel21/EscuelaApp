using System.ComponentModel.DataAnnotations;

namespace Escuela.API.Dtos
{
    public class CrearRecursoDto
    {
        [Required(ErrorMessage = "El nombre del recurso/archivo es obligatorio.")]
        public string Titulo { get; set; } = string.Empty;

        [Required(ErrorMessage = "El recurso debe estar asociado a un curso.")]
        public int CursoId { get; set; }

        [Required(ErrorMessage = "Debes seleccionar un archivo.")]
        public required IFormFile Archivo { get; set; }
    }
}