using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Escuela.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _configuration;

        public AuthController(UserManager<IdentityUser> userManager,
                              RoleManager<IdentityRole> roleManager,
                              IConfiguration configuration)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
        }

        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest("Email y contraseña son obligatorios.");
            }

            var rolesValidos = new List<string> { "Administrativo", "Academico", "Estudiantil", "Psicologo" };
            if (!rolesValidos.Contains(request.Rol))
            {
                return BadRequest("El rol debe ser: Administrativo, Academico, Estudiantil o Psicologo");
            }

            var user = new IdentityUser { UserName = request.Email, Email = request.Email };
            var result = await _userManager.CreateAsync(user, request.Password);

            if (result.Succeeded)
            {
                if (!await _roleManager.RoleExistsAsync("Administrativo")) await _roleManager.CreateAsync(new IdentityRole("Administrativo"));
                if (!await _roleManager.RoleExistsAsync("Academico")) await _roleManager.CreateAsync(new IdentityRole("Academico"));
                if (!await _roleManager.RoleExistsAsync("Estudiantil")) await _roleManager.CreateAsync(new IdentityRole("Estudiantil"));
                if (!await _roleManager.RoleExistsAsync("Psicologo")) await _roleManager.CreateAsync(new IdentityRole("Psicologo"));

                await _userManager.AddToRoleAsync(user, request.Rol);

                return Ok(new
                {
                    message = $"Usuario registrado con rol {request.Rol} exitosamente",
                    userId = user.Id,
                    email = user.Email,
                    rol = request.Rol
                });
            }

            return BadRequest(result.Errors);
        }

        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest("El usuario y contraseña son obligatorios.");
            }
            var user = await _userManager.FindByNameAsync(request.Email);

            if (user != null && await _userManager.CheckPasswordAsync(user, request.Password))
            {
                var token = await GenerateJwtToken(user);
                return Ok(new { token });
            }

            return Unauthorized(new { message = "Credenciales incorrectas (Use su correo institucional)." });
        }

        private async Task<string> GenerateJwtToken(IdentityUser user)
        {
            var jwtSection = _configuration.GetSection("Jwt");
            var keyString = jwtSection["Key"];

            if (string.IsNullOrEmpty(keyString))
            {
                throw new InvalidOperationException("La configuración JWT:Key no está definida en appsettings.json");
            }

            var key = Encoding.ASCII.GetBytes(keyString);
            var userRoles = await _userManager.GetRolesAsync(user);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserName ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("uid", user.Id),
                new Claim(ClaimTypes.NameIdentifier, user.Id)
            };

            foreach (var role in userRoles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(2),
                Issuer = jwtSection["Issuer"],
                Audience = jwtSection["Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty;
    }
}