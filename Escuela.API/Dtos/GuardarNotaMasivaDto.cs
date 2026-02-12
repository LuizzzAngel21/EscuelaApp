namespace Escuela.API.Dtos
{
    public class GuardarNotaMasivaDto
    {
        public int MatriculaId { get; set; }
        public int CriterioId { get; set; }

        public decimal Valor { get; set; }
    }
}