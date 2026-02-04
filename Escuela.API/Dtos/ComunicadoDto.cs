namespace Escuela.API.Dtos
{
    public class ComunicadoDto
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Contenido { get; set; } = string.Empty;
        public string Fecha { get; set; } = string.Empty;
        public string Autor { get; set; } = string.Empty;
        public string EtiquetaDestino { get; set; } = string.Empty;
    }
}