using BrainBurst.Domain.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BrainBurst.Service.Logics;
public interface IApiLogic
{
    Task<string> LoginAsync(LoginModel login);
    Task<(string Message, UserProfileModel? UserProfile)> UserProfileAsync();
    Task<string> LogoutAsync();
}
