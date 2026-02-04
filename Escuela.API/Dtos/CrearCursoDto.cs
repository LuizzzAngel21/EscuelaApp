using System.ComponentModel.DataAnnotations;

namespace Escuela.API.Dtos
{
    public class CrearCursoDto
    {
        [Required(ErrorMessage = "El nombre del curso es obligatorio (Ej: Matemáticas).")]
        [StringLength(100, ErrorMessage = "El nombre no puede exceder los 100 caracteres.")]
        public string Nombre { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "La descripción es muy larga (máximo 500 caracteres).")]
        public string? Descripcion { get; set; }

        [Required(ErrorMessage = "Debes seleccionar un Grado.")]
        public int GradoId { get; set; }

        [Required(ErrorMessage = "Debes asignar un Docente responsable.")]
        public int DocenteId { get; set; }
    }
}