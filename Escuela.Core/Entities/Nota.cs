using System.ComponentModel.DataAnnotations;

namespace Escuela.Core.Entities
{
    public class Nota
    {
        public int Id { get; set; }

        [Range(0, 20, ErrorMessage = "La nota debe estar entre 0 y 20")]
        public decimal Valor { get; set; }
        public int MatriculaId { get; set; }
        public Matricula? Matricula { get; set; }

        public int CriterioEvaluacionId { get; set; }
        public CriterioEvaluacion? CriterioEvaluacion { get; set; }
    }
}