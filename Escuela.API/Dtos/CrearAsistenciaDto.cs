using Escuela.Core.Entities;
using System.ComponentModel.DataAnnotations;

namespace Escuela.API.Dtos
{
    public class CrearAsistenciaDto
    {
        [Required(ErrorMessage = "La matrícula del estudiante es obligatoria.")]
        public int MatriculaId { get; set; }

        [Required(ErrorMessage = "El curso es obligatorio para registrar la asistencia.")]
        public int CursoId { get; set; }

        [Required(ErrorMessage = "El estado de asistencia es obligatorio.")]
        [EnumDataType(typeof(EstadoAsistencia), ErrorMessage = "El estado enviado no es válido.")]
        public EstadoAsistencia Estado { get; set; }

        [StringLength(200, ErrorMessage = "La observación no puede superar los 200 caracteres.")]
        public string? Observacion { get; set; }

        public DateTime? Fecha { get; set; }
    }
}
