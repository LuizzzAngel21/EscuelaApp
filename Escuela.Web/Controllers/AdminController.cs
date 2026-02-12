using Microsoft.AspNetCore.Mvc;

namespace Escuela.Web.Controllers
{
    public class AdminController : Controller
    {
        public IActionResult Inicio()
        {
            return View();
        }

        public IActionResult Solicitudes()
        {
            return View();
        }

        public IActionResult Matriculas()
        {
            return View(); 
        }

        public IActionResult Estudiantes()
        {
            return View(); 
        }

        public IActionResult Periodos()
        {
            return View(); 
        }

        public IActionResult GradosSecciones()
        {
            return View(); 
        }

        public IActionResult Cursos()
        {
            return View(); 
        }

        public IActionResult Horarios()
        {
            return View();
        }

        public IActionResult Docentes()
        {
            return View(); 
        }

        public IActionResult Psicologos()
        {
            return View(); 
        }

        public IActionResult Comunicados()
        {
            return View(); 
        }

    }
}