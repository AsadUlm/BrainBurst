using Microsoft.OpenApi.Models;

namespace BrainBurst.Server.Extentions
{
    public static class ServiceExtension
    {
        public static IServiceCollection AddMySwaggerGen(this IServiceCollection Services)
        {
            Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo
                {
                    Version = "v1",
                    Title = "UZCSD Statistic API",
                    Description = "ASP.NET 6 Web API",
                    TermsOfService = new Uri("https://deponet.uz/terms"),
                    Contact = new OpenApiContact { Name = "Ulmasov Asadbek", Email = string.Empty, Url = new Uri("https://twitter.com/@orppsarva") },
                    License = new OpenApiLicense { Name = "Use under UZCSD", Url = new Uri("https://deponet.uz/license") }
                });
                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.ApiKey,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "JWT Authorization header using the Bearer scheme."
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    }, new string[] { }
                }
            });

            });
            return Services;
        }
    }
}
