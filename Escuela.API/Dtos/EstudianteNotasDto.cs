namespace Escuela.API.Dtos
{
    public class EstudianteCursoDetalleDto
    {
        public string CursoNombre { get; set; } = string.Empty;
        public string DocenteNombre { get; set; } = string.Empty;

        public List<PeriodoAlumnoDto> Periodos { get; set; } = new();

        public decimal PromedioFinalAcumulado { get; set; }
        public string EstadoFinal { get; set; } = "En Curso"; 
    }

    public class PeriodoAlumnoDto
    {
        public int NumeroPeriodo { get; set; } 
        public string NombrePeriodo { get; set; } 
        public decimal PromedioPeriodo { get; set; } 
        public List<DetalleNotaAlumnoDto> Notas { get; set; } = new();
    }

    public class DetalleNotaAlumnoDto
    {
        public string Evaluacion { get; set; } = string.Empty; 
        public decimal Peso { get; set; } 
        public decimal? Valor { get; set; }
    }
}