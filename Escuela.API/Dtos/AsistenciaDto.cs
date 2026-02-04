namespace Escuela.API.Dtos
{
    public class AsistenciaDto
    {
        public int Id { get; set; }
        public string Estudiante { get; set; } = string.Empty;
        public string Curso { get; set; } = string.Empty;
        public string Fecha { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;
        public string Observacion { get; set; } = string.Empty;
    }
}
