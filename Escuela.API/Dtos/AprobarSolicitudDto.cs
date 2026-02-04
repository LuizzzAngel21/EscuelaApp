using System.ComponentModel.DataAnnotations;

namespace Escuela.API.Dtos
{
    public class AprobarSolicitudDto
    {
        [Required]
        public int SolicitudId { get; set; }

        [Required(ErrorMessage = "Debe asignar una sección.")]
        public int SeccionId { get; set; }

        [Required(ErrorMessage = "Debe asignar un periodo.")]
        public int PeriodoId { get; set; }
    }
}