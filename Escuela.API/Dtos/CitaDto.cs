namespace Escuela.API.Dtos
{
    public class CitaDto
    {
        public int Id { get; set; }
        public string Fecha { get; set; } = string.Empty;
        public string Hora { get; set; } = string.Empty;
        public string Motivo { get; set; } = string.Empty;

        public string Estado { get; set; } = string.Empty;
        public string NombreOrganizador { get; set; } = string.Empty;
        public string Cargo { get; set; } = string.Empty;

        public string NombreEstudiante { get; set; } = string.Empty;

        public string Modalidad { get; set; } = string.Empty;
        public string LinkODireccion { get; set; } = string.Empty;
    }
}