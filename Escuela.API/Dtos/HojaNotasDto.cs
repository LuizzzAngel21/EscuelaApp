namespace Escuela.API.Dtos
{
    public class HojaNotasResponseDto
    {
        public List<CriterioDto> Criterios { get; set; } = new();

        public List<FilaNotasDto> Alumnos { get; set; } = new();
    }

    public class FilaNotasDto
    {
        public int MatriculaId { get; set; }
        public string EstudianteNombre { get; set; } = string.Empty;

        public List<NotaRegistroDto> Notas { get; set; } = new();

        public decimal PromedioActual { get; set; }
    }

    public class NotaRegistroDto
    {
        public int CriterioId { get; set; }
        public decimal Valor { get; set; }
    }
}