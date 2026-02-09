namespace Escuela.API.Dtos
{
    public class NotificacionDto
    {
        public string Titulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public string Fecha { get; set; } = string.Empty;
        public DateTime FechaOrden { get; set; }
        public string Tipo { get; set; } = string.Empty;
        public string UrlDestino { get; set; } = string.Empty;
        public bool EsPrioritario { get; set; }
    }
}