namespace Escuela.API.Dtos
{
    public class EntregaDto
    {
        public int Id { get; set; }
        public string EstudianteNombre { get; set; } = string.Empty;
        public string FechaEnvio { get; set; } = string.Empty;
        public string UrlArchivo { get; set; } = string.Empty;
        public decimal? Calificacion { get; set; }
        public string? Comentarios { get; set; }
    }
}
