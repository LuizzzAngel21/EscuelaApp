namespace Escuela.API.Dtos
{
    public class CriterioDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public decimal Peso { get; set; }
        public string Curso { get; set; } = string.Empty;
    }
}
