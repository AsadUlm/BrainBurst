using Microsoft.AspNetCore.Identity;

namespace BrainBurst.Server.Extentions;
public static class MiddlewareExtensions
{
    public static async Task UseRoleInitializerMiddleware(this WebApplication app)
    {
        using (var scope = app.Services.CreateScope())
        {
            var services = scope.ServiceProvider;
            try
            {
                var userManager = services.GetRequiredService<UserManager<IdentityUser>>();
                //var rolesManager = services.GetRequiredService<RoleManager<IdentityRole>>();
                await RoleInitializer.InitializeAsync(userManager);
            }
            catch (Exception ex)
            {
                var logger = services.GetRequiredService<ILogger<Program>>();
                logger.LogError(ex, "An error occurred while seeding the database.");
            }
        }
    }
}
