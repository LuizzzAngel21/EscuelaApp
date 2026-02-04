namespace Escuela.API.Dtos
{
    public class EstudianteDto
    {
        public int Id { get; set; }
        public string NombreCompleto { get; set; } = string.Empty;
        public string Dni { get; set; } = string.Empty;
        public string FechaNacimiento { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Telefono { get; set; }
        public int Edad { get; set; }
    }
}
