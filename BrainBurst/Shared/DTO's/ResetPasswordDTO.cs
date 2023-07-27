using System.ComponentModel.DataAnnotations;

namespace BrainBurst.Shared.DTO_s;
public class ResetPasswordDTO
{
    public string? UserId { get; set; }

    [Required]
    [StringLength(100, ErrorMessage = "Пароль должен содержать как минимум 6 символов", MinimumLength = 6)]
    [DataType(DataType.Password)]
    public string? NewPassword { get; set; }

    [DataType(DataType.Password)]
    [Display(Name = "Confirm password")]
    [Compare("NewPassword", ErrorMessage = "Пароли не совпадают")]
    public string? ConfirmPassword { get; set; }
}
