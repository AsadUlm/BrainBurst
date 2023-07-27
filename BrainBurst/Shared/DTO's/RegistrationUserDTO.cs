using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BrainBurst.Shared.DTO_s;
public class RegistrationUserDTO
{    
    [Required]
    [StringLength(100, ErrorMessage = "Пароль должен содержать не менее 4 символов!")]
    public string? FullName { get; set; }
    [Required]
    public string? UserName { get; set; }
    [Required]
    [StringLength(100, ErrorMessage = "Пароль должен содержать не менее 6 символов!", MinimumLength = 6)]
    [DataType(DataType.Password)]
    public string? Password { get; set; }
    [DataType(DataType.Password)]
    [Display(Name = "Confirm password")]
    [Compare("Password", ErrorMessage = "Пароли не совпадают!")]
    public string? ConfirmPassword { get; set; }
    [Required(ErrorMessage = "Это поле обязательно к заполнению!")]
    [StringLength(50, ErrorMessage = "Фамилия превышает 50 символов!")]        
    public string? Email { get; set; }
}
