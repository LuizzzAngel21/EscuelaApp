namespace Escuela.API.Dtos
{
    public class DocenteDto
    {
        public int Id { get; set; }
        public string NombreCompleto { get; set; } = string.Empty;
        public string Dni { get; set; } = string.Empty;
        public string Especialidad { get; set; } = "Sin especialidad";
        public bool Activo { get; set; }
    }
}
