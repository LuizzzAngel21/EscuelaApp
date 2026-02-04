using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Escuela.Core.Entities
{
    public class Comunicado
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Contenido { get; set; } = string.Empty;
        public DateTime FechaPublicacion { get; set; } = DateTime.Now;

        public int? GradoId { get; set; }
        [ForeignKey("GradoId")]
        public Grado? Grado { get; set; }

        public string DestinatarioRol { get; set; } = "General";

        public string AutorNombre { get; set; } = string.Empty;
    }
}