namespace Escuela.API.Dtos
{
    public class CursoDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public bool Activo { get; set; }
        public string NombreGrado { get; set; } = string.Empty;
        public string NombreDocente { get; set; } = string.Empty;


        public int GradoId { get; set; }
    }
}