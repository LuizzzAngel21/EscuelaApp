namespace Escuela.API.Dtos
{
    public class AsistenciaDiariaDto
    {
        public int MatriculaId { get; set; }
        public string EstudianteNombre { get; set; } = string.Empty;

        public int EstadoId { get; set; }

        public string? Observacion { get; set; }

        public bool YaRegistrado { get; set; }
    }
}