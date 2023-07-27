using BrainBurst.Shared.DTO_s;
using Microsoft.AspNetCore.Identity;

namespace BrainBurst.Server.Mapper;
public static class MapperExtension
{
    public static IdentityUser ConvertToEntity(this RegistrationUserDTO registrationUserDTO)
    {
        if (registrationUserDTO == null)
            return null;
        return new IdentityUser()
        {
            UserName = registrationUserDTO.UserName,
            NormalizedUserName = registrationUserDTO.FullName,
            Email = registrationUserDTO.Email
        };
    }

    public static RegistrationUserDTO ConvertToDTO(this IdentityUser applicationUser)
    {
        if (applicationUser == null)
            return null;
        return new RegistrationUserDTO()
        {            
            Email = applicationUser.Email,
            FullName = applicationUser.NormalizedUserName,
            UserName = applicationUser.UserName
        };
    }
}
