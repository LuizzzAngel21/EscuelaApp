namespace Escuela.API.Dtos
{
    public class CarpetaEstadoDto
    {
        public string Nombres { get; set; } = string.Empty;
        public string Apellidos { get; set; } = string.Empty;
        public string Dni { get; set; } = string.Empty;

        public bool PagoRealizado { get; set; }
        public bool ExisteFotoDni { get; set; }
        public bool ExisteConstancia { get; set; }
        public bool ExisteSeguro { get; set; }

        public string? Observaciones { get; set; }

        public string Estado { get; set; } = string.Empty;
    }
}