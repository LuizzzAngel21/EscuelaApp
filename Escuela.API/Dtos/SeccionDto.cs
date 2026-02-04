namespace Escuela.API.Dtos
{
    public class SeccionDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Grado { get; set; } = string.Empty;
        public int Capacidad { get; set; }
    }
}