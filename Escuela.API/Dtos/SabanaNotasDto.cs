namespace Escuela.API.Dtos
{
    public class SabanaResponseDto
    {
        public List<PeriodoHeaderDto> Estructura { get; set; } = new();
        public List<AlumnoSabanaDto> Alumnos { get; set; } = new();
    }

    public class PeriodoHeaderDto
    {
        public int NumeroPeriodo { get; set; } 
        public string Nombre { get; set; } = string.Empty; 
        public List<CriterioDto> Criterios { get; set; } = new();
    }

    public class AlumnoSabanaDto
    {
        public int MatriculaId { get; set; }
        public string EstudianteNombre { get; set; } = string.Empty;

        public List<NotaRegistroDto> Notas { get; set; } = new();

        public Dictionary<int, decimal> PromediosPorPeriodo { get; set; } = new();
        public decimal PromedioFinalAnual { get; set; }
    }
}