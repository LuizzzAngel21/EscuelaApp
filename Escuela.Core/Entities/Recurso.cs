using System.ComponentModel.DataAnnotations;

namespace Escuela.Core.Entities
{
    public class Recurso
    {
        public int Id { get; set; }

        [Required]
        public string Titulo { get; set; }

        public string? RutaArchivo { get; set; } 
        public DateTime FechaSubida { get; set; } = DateTime.Now;

        public int CursoId { get; set; }
        public Curso? Curso { get; set; }
    }
}