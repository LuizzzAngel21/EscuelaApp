namespace Escuela.API.Dtos
{
    public class MensajeDto
    {
        public int Id { get; set; }
        public string Asunto { get; set; } = string.Empty;
        public string Contenido { get; set; } = string.Empty;
        public string Fecha { get; set; } = string.Empty;

        public bool Leido { get; set; }

        public string RemitenteNombre { get; set; } = string.Empty;
        public string DestinatarioNombre { get; set; } = string.Empty;

        public string? ArchivoUrl { get; set; }

        public bool YoSoyRemitente { get; set; }
    }
}