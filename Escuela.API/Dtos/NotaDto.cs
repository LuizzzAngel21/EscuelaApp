namespace Escuela.API.Dtos
{
    public class NotaDto
    {
        public int Id { get; set; }
        public string Estudiante { get; set; } = string.Empty;
        public string Evaluacion { get; set; } = string.Empty;
        public decimal Valor { get; set; }
    }
}