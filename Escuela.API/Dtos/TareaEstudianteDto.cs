namespace Escuela.API.Dtos
{
    public class TareaEstudianteDto
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public string FechaLimite { get; set; } = string.Empty;
        public string NombreCurso { get; set; } = string.Empty;
        public bool EstaVencida { get; set; }

        public string Estado { get; set; } = "Pendiente"; 
        public decimal? Nota { get; set; }
        public string? Comentarios { get; set; }
    }
}