namespace Escuela.API.Dtos
{
    public class ReportarIncidenciaHibridaDto
    {
        public int? EstudianteId { get; set; } 
        public string? UsuarioId { get; set; } 
        public string Titulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public string Nivel { get; set; } = string.Empty;
    }
}
