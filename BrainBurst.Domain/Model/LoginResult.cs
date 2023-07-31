using System.Diagnostics.CodeAnalysis;

namespace BrainBurst.Domain.Model;
public class LoginResult
{
    public bool Successful { get; set; }
    [AllowNull]
    public string? Error { get; set; }
    public string Token { get; set; }
}
