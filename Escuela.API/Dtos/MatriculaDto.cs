namespace Escuela.API.Dtos
{
    public class MatriculaDto
    {
        public int Id { get; set; }
        public string Estudiante { get; set; } = string.Empty; 
        public string Grado { get; set; } = string.Empty;    
        public string Seccion { get; set; } = string.Empty;  
        public string Periodo { get; set; } = string.Empty;   
        public DateTime Fecha { get; set; }
    }
}
