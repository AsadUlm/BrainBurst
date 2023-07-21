using BrainBurst.Server.Repository;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.Cookies;
using BrainBurst.Domain.Model;
using Microsoft.EntityFrameworkCore;
using BrainBurst.Shared.DTO_s;
using Microsoft.AspNetCore.Authorization;

namespace BrainBurst.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{    
    private readonly BrainBrustDBContext _brainBrustDBContext;
    
    public AuthController(BrainBrustDBContext brainBrustDBContext)
    {
        this._brainBrustDBContext = brainBrustDBContext;
    }

    [HttpPost]
    [Route("login")]
    public async Task<IActionResult> LoginAsync(LoginDTO login)
    {
        var user = await _brainBrustDBContext
        .User.Where(_ => _.Email.ToLower() == login.Email.ToLower() && _.Password == login.Password).FirstOrDefaultAsync();

        if (user == null)
        {
            return BadRequest("Invalid Credentials");
        }

        var claims = new List<Claim>
    {
        new Claim("userid", user.Id.ToString()),
        new Claim(ClaimTypes.Email, user.Email)
    };

        var claimsIdentity = new ClaimsIdentity(
            claims, CookieAuthenticationDefaults.AuthenticationScheme);

        var authProperties = new AuthenticationProperties();

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(claimsIdentity),
            authProperties);
        return Ok("Success");
    }


    [HttpPost]
    [Route("logout")]
    public async Task<IActionResult> LogoutAsync()
    {
        await HttpContext.SignOutAsync();
        return Ok("success");
    }

    [Authorize]
    [HttpGet]
    [Route("user-profile")]
    public async Task<IActionResult> UserProfileAsync()
    {
        int userId = HttpContext.User.Claims
        .Where(_ => _.Type == "userid")
        .Select(_ => Convert.ToInt32(_.Value))
        .First();

        var userProfile = await _brainBrustDBContext
        .User
        .Where(_ => _.Id == userId)
        .Select(_ => new UserProfileDTO
        {
            UserId = _.Id,
            Email = _.Email,
            FirstName = _.FirstName,
            LastName = _.LastName
        }).FirstOrDefaultAsync();

        return Ok(userProfile);
    }

    private async Task RefreshExternalSignIn(User user)
    {
        var claims = new List<Claim>
        {
            new Claim("userid", user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email)
        };

        var claimsIdentity = new ClaimsIdentity(
            claims, CookieAuthenticationDefaults.AuthenticationScheme);

        var authProperties = new AuthenticationProperties();

        HttpContext.User.AddIdentity(claimsIdentity);

        await HttpContext.SignOutAsync();

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(claimsIdentity),
            authProperties);
    }

    private async Task<User> ManageExternalLoginUser(string email, string firstName, string lastName, string externalLoginName)
    {
        var user = await _brainBrustDBContext
        .User.Where(_ => _.Email.ToLower() == email.ToLower()
        && _.ExternalLoginName.ToLower() == externalLoginName.ToLower())
        .FirstOrDefaultAsync();

        if (user != null)
        {
            return user;
        }

        var newUser = new User
        {
            Email = email,
            ExternalLoginName = externalLoginName,
            FirstName = firstName,
            LastName = lastName
        };
        _brainBrustDBContext.User.Add(newUser);
        await _brainBrustDBContext.SaveChangesAsync();
        return newUser;
    }

    [HttpGet]
    [Route("google-login")]
    public IActionResult GoogleLogin(string returnURL)
    {
        return Challenge(
            new AuthenticationProperties
            {
                RedirectUri = Url.Action(nameof(GoogleLoginCallBack), new { returnURL })
            },
            GoogleDefaults.AuthenticationScheme
        );
    }

    [HttpGet]
    [Route("google-login-callback")]
    public async Task<IActionResult> GoogleLoginCallBack(string returnURL)
    {
        var authenticationResult = await HttpContext
        .AuthenticateAsync(GoogleDefaults.AuthenticationScheme);
        if (authenticationResult.Succeeded)
        {
            string email = HttpContext
            .User.Claims.Where(_ => _.Type == ClaimTypes.Email)
            .Select(_ => _.Value)
            .FirstOrDefault();

            string firstName = HttpContext
            .User.Claims.Where(_ => _.Type == ClaimTypes.GivenName)
            .Select(_ => _.Value)
            .FirstOrDefault();

            string lastName = HttpContext
            .User.Claims.Where(_ => _.Type == ClaimTypes.Surname)
            .Select(_ => _.Value)
            .FirstOrDefault();

            var user = await ManageExternalLoginUser(
                email,
                firstName,
                lastName,
                "Google"
            );

            await RefreshExternalSignIn(user);
            return Redirect($"{returnURL}?externalauth=true");
        }
        return Redirect($"{returnURL}?externalauth=false");
    }
}
