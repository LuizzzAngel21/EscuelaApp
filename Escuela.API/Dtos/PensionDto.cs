namespace Escuela.API.Dtos
{
    public class PensionDto
    {
        public int Id { get; set; }
        public string Mes { get; set; } = string.Empty;
        public string FechaVencimiento { get; set; } = string.Empty;

        public decimal MontoBase { get; set; }
        public decimal Mora { get; set; }
        public decimal TotalAPagar { get; set; }

        public string Estado { get; set; } = string.Empty;
        public string ColorEstado { get; set; } = string.Empty;
        public string? FechaPago { get; set; }
        public string? CodigoOperacion { get; set; }
    }
}