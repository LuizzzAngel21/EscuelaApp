using Microsoft.AspNetCore.Mvc;

namespace Escuela.Web.Controllers
{
    public class PsicologoController : Controller
    {
        public IActionResult Inicio()
        {
            return View();
        }
        
    }
}
