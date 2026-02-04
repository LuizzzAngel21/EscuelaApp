using System.Net;
using System.Net.Mail;

namespace Escuela.API.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string destinatario, string asunto, string mensajeHtml);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendEmailAsync(string destinatario, string asunto, string mensajeHtml)
        {
            var email = _config["EmailSettings:Email"];
            var password = _config["EmailSettings:Password"];
            var host = _config["EmailSettings:Host"];
            var port = int.Parse(_config["EmailSettings:Port"] ?? "587");

            var smtpClient = new SmtpClient(host, port)
            {
                EnableSsl = true,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(email, password)
            };

            var mensaje = new MailMessage(email!, destinatario, asunto, mensajeHtml)
            {
                IsBodyHtml = true
            };

            await smtpClient.SendMailAsync(mensaje);
        }
    }
}