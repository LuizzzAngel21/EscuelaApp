using System;

namespace Escuela.Core.Entities
{
    public class Psicologo
    {
        public int Id { get; set; }
        public string Nombres { get; set; } = string.Empty;
        public string Apellidos { get; set; } = string.Empty;
        public string Dni { get; set; } = string.Empty;
        public string Cpsp { get; set; } = string.Empty;
        public string Especialidad { get; set; } = "Psicología Educativa";
        public bool Activo { get; set; } = true;
        public string UsuarioId { get; set; } = string.Empty;
    }
}