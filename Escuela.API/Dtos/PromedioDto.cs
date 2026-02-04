namespace Escuela.API.Dtos
{
    public class PromedioDto
    {
        public string Curso { get; set; } = string.Empty;
        public decimal PromedioFinal { get; set; }
        public string Estado { get; set; } = string.Empty;
        public List<DetalleNotaDto> Detalles { get; set; } = new();
    }
}
