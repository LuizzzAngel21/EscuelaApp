using System.ComponentModel.DataAnnotations;

namespace Escuela.Core.Entities
{
    public class Curso
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "El nombre es obligatorio")]
        [StringLength(50)]
        public string Nombre { get; set; } = string.Empty;

        public string? Descripcion { get; set; }

        public bool Activo { get; set; } = true;

        public int? DocenteId { get; set; }
        public Docente? Docente { get; set; }

        public int GradoId { get; set; }
        public Grado? Grado { get; set; }
    }
}