namespace Escuela.API.Dtos
{
    public class HorarioDto
    {
        public int Id { get; set; }
        public string Dia { get; set; } = string.Empty;
        public string HoraInicio { get; set; } = string.Empty;
        public string HoraFin { get; set; } = string.Empty;
        public string Curso { get; set; } = string.Empty;
        public string Grado { get; set; } = string.Empty;
    }
}