using Microsoft.AspNetCore.Identity;

namespace BrainBurst.Server.Extentions;
public class RoleInitializer
{
    public static async Task InitializeAsync(UserManager<IdentityUser> userManager)
    {
        string adminEmail = "asad13@gmail.com";
        string adminPassword = "FKJNasdf123As@d";
        
        IdentityUser user = await userManager.FindByNameAsync(adminEmail);
        if (user == null)
        {
            user = new IdentityUser { NormalizedUserName = "", Email = adminEmail, UserName = adminEmail, EmailConfirmed = false, PhoneNumberConfirmed = false, TwoFactorEnabled = false, AccessFailedCount = 0, LockoutEnabled = true };
            IdentityResult result = await userManager.CreateAsync(user, adminPassword);            
        }
    }
}
