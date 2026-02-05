using Microsoft.AspNetCore.Mvc;

namespace prueba2_landing_page.Controllers
{
    public class AuthController : Controller
    {
        public IActionResult Login()
        {
            return View();
        }
    }
}
