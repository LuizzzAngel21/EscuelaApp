namespace Escuela.API.Dtos
{
    public class RecursoDto
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string UrlDescarga { get; set; }  = string.Empty;
        public string Fecha { get; set; } = string.Empty;
        public string Curso { get; set; } = string.Empty;
    }
}