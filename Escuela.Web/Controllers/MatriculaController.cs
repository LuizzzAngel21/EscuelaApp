using Microsoft.AspNetCore.Mvc;

namespace Escuela.Web.Controllers
{
    public class MatriculaController : Controller
    {
        public IActionResult SolicitarAdmision()
        {
            return View();
        }
    }
}
