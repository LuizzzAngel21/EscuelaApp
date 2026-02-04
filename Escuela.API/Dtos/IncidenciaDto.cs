namespace Escuela.API.Dtos
{
    public class IncidenciaDto
    {
        public int Id { get; set; }
        public string Fecha { get; set; } = string.Empty;
        public string Titulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public string Nivel { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;

        public string NombreReportador { get; set; } = string.Empty;
        public string NombreEstudiante { get; set; } = string.Empty;
    }
}