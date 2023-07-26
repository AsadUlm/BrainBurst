using BrainBurst.Server.Mapper;
using BrainBurst.Server.Repository;
using BrainBurst.Shared.DTO_s;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace BrainBurst.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{    
    private readonly BrainBrustDBContext _brainBrustDBContext;
    private readonly UserManager<IdentityUser> _userManager;

    public UserController(BrainBrustDBContext brainBrustDBContext, UserManager<IdentityUser> userManager)
    {
        this._brainBrustDBContext = brainBrustDBContext;        
        _userManager = userManager;
    }

    [HttpPost]
    [Route("CreateUser")]
    public async Task<IActionResult> CreateUserAccount([FromBody] RegistrationUserDTO userDTO)
    {
        try
        {
            var user = userDTO.ConvertToEntity();
            var result = await _userManager.CreateAsync(user, userDTO.Password);
            if (!result.Succeeded)
                throw new BadHttpRequestException(result.Errors.Select(x => x.Description).ToString());

            return Ok(user.ConvertToDTO());
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet]
    [Route("GetUserByUserName/{UserName}")]
    public async Task<IActionResult> GetUserByUserName(string UserName)
    {
        var user = await _userManager.FindByNameAsync(UserName);
        if (user == null)
            return BadRequest();
        return Ok(user.ConvertToDTO());
    }

    [HttpPost]
    [Route("ResetPassword")]
    public async Task<IActionResult> ResetPassword(ResetPasswordDTO resetPassword)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(resetPassword.UserId);
            if (user == null)
                return NotFound("Object not found Id:" + resetPassword.UserId);

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, resetPassword.NewPassword);
            if (!result.Succeeded)
                return BadRequest(result.Errors.Select(x => x.Description).FirstOrDefault());
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

}
