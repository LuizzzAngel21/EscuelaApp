using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Escuela.Core.Entities
{
    public class Pension
    {
        public int Id { get; set; }

        public int MatriculaId { get; set; }
        public Matricula? Matricula { get; set; }

        [Required]
        [MaxLength(20)]
        public string Mes { get; set; } = string.Empty; 

        public int NumeroMes { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Monto { get; set; } 

        [Column(TypeName = "decimal(18,2)")]
        public decimal Mora { get; set; } = 0; 

        public DateTime FechaVencimiento { get; set; }

        public bool Pagado { get; set; } = false;

        public DateTime? FechaPago { get; set; } 

        [MaxLength(50)]
        public string? CodigoOperacion { get; set; } 

        [MaxLength(20)]
        public string? FormaPago { get; set; } 
    }
}