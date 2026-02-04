using System;
using System.ComponentModel.DataAnnotations;

namespace Escuela.Core.Entities
{
    public class SolicitudMatricula
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(8)]
        public string Dni { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Nombres { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Apellidos { get; set; } = string.Empty;

        public DateTime FechaNacimiento { get; set; }

        [MaxLength(15)]
        public string TelefonoApoderado { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string EmailPersonal { get; set; } = string.Empty;

        public int GradoId { get; set; }
        public Grado? Grado { get; set; }


        public Guid TokenSeguimiento { get; set; } 

        public string? UrlFotoDni { get; set; }        
        public string? UrlConstanciaNotas { get; set; } 
        public string? UrlSeguroMedico { get; set; }    

        public bool PagoRealizado { get; set; } = false;
        public string? CodigoOperacion { get; set; }   

        public string? Observaciones { get; set; }     

        public EstadoSolicitud Estado { get; set; } = EstadoSolicitud.Recibido;

        public DateTime FechaSolicitud { get; set; } = DateTime.Now;
    }
}