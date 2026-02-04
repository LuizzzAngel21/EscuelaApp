namespace Escuela.API.Dtos
{
    public class ExpedienteDto
    {
        public int Id { get; set; }
        public string Fecha { get; set; } = string.Empty;
        public string Titulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public string Recomendaciones { get; set; } = string.Empty;
        public string NombreEstudiante { get; set; } = string.Empty;
        public string NombrePsicologo { get; set; } = string.Empty;
    }
}