using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Escuela.Core.Entities
{
    public class Cita
    {
        public int Id { get; set; }
        public DateTime FechaHora { get; set; }
        public string Motivo { get; set; } = string.Empty;
        public int Estado { get; set; }
        public string OrganizadorId { get; set; } = string.Empty;
        public int EstudianteId { get; set; }
        [ForeignKey("EstudianteId")]
        public Estudiante? Estudiante { get; set; }
        public bool EsVirtual { get; set; }
        public string? LinkReunion { get; set; }
        public DateTime FechaSolicitud { get; set; } = DateTime.Now;
    }
}