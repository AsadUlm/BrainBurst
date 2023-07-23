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
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace BrainBurst.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly BrainBrustDBContext _brainBrustDBContext;
    private readonly UserManager<IdentityUser> _userManager;

    public AuthController(IConfiguration configuration, BrainBrustDBContext brainBrustDBContext, UserManager<IdentityUser> userManager)
    {
        this._brainBrustDBContext = brainBrustDBContext;
        this._configuration = configuration;
        _userManager = userManager;
    }

    [HttpPost]
    public async Task<IActionResult> RegisterUser([FromBody] RegisterModel model)
    {
        var newUser = new IdentityUser { UserName = model.Email, Email = model.Email };

        var result = await _userManager.CreateAsync(newUser, model.Password);

        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(x => x.Description);
            return Ok(new RegisterResult { Successful = false, Errors = errors });
        }

        return Ok(new RegisterResult { Successful = true });
    }




    //private async Task RefreshExternalSignIn(User user)
    //{
    //    var claims = new List<Claim>
    //    {
    //        new Claim("userid", user.Id.ToString()),
    //        new Claim(ClaimTypes.Email, user.Email)
    //    };

    //    var claimsIdentity = new ClaimsIdentity(
    //        claims, CookieAuthenticationDefaults.AuthenticationScheme);

    //    var authProperties = new AuthenticationProperties();

    //    HttpContext.User.AddIdentity(claimsIdentity);

    //    await HttpContext.SignOutAsync();

    //    await HttpContext.SignInAsync(
    //        CookieAuthenticationDefaults.AuthenticationScheme,
    //        new ClaimsPrincipal(claimsIdentity),
    //        authProperties);
    //}

    //private async Task<User> ManageExternalLoginUser(string email, string firstName, string lastName, string externalLoginName)
    //{
    //    var user = await _brainBrustDBContext
    //    .User.Where(_ => _.Email.ToLower() == email.ToLower()
    //    && _.ExternalLoginName.ToLower() == externalLoginName.ToLower())
    //    .FirstOrDefaultAsync();

    //    if (user != null)
    //    {
    //        return user;
    //    }

    //    var newUser = new User
    //    {
    //        Email = email,
    //        ExternalLoginName = externalLoginName,
    //        FirstName = firstName,
    //        LastName = lastName
    //    };
    //    _brainBrustDBContext.User.Add(newUser);
    //    await _brainBrustDBContext.SaveChangesAsync();
    //    return newUser;
    //}

    //[HttpGet]
    //[Route("google-login")]
    //public IActionResult GoogleLogin(string returnURL)
    //{
    //    return Challenge(
    //        new AuthenticationProperties
    //        {
    //            RedirectUri = Url.Action(nameof(GoogleLoginCallBack), new { returnURL })
    //        },
    //        GoogleDefaults.AuthenticationScheme
    //    );
    //}

    //[HttpGet]
    //[Route("google-login-callback")]
    //public async Task<IActionResult> GoogleLoginCallBack(string returnURL)
    //{
    //    var authenticationResult = await HttpContext
    //    .AuthenticateAsync(GoogleDefaults.AuthenticationScheme);
    //    if (authenticationResult.Succeeded)
    //    {
    //        string email = HttpContext
    //        .User.Claims.Where(_ => _.Type == ClaimTypes.Email)
    //        .Select(_ => _.Value)
    //        .FirstOrDefault();

    //        string firstName = HttpContext
    //        .User.Claims.Where(_ => _.Type == ClaimTypes.GivenName)
    //        .Select(_ => _.Value)
    //        .FirstOrDefault();

    //        string lastName = HttpContext
    //        .User.Claims.Where(_ => _.Type == ClaimTypes.Surname)
    //        .Select(_ => _.Value)
    //        .FirstOrDefault();

    //        var user = await ManageExternalLoginUser(
    //            email,
    //            firstName,
    //            lastName,
    //            "Google"
    //        );

    //        await RefreshExternalSignIn(user);
    //        return Redirect($"{returnURL}?externalauth=true");
    //    }
    //    return Redirect($"{returnURL}?externalauth=false");
    //}
}
