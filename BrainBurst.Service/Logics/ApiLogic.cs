using BrainBurst.Domain.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace BrainBurst.Service.Logics;
public class ApiLogic : IApiLogic
{
    private readonly IHttpClientFactory _httpClientFactory;
    public ApiLogic(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    public async Task<string> LoginAsync(LoginModel login)
    {
        var client = _httpClientFactory.CreateClient("API");
        string payload = JsonSerializer.Serialize(login);
        var content = new StringContent(payload, Encoding.UTF8, "application/json");
        var response = await client.PostAsync("api/Auth/login", content);
        if (response.IsSuccessStatusCode)
        {
            return "Success";
        }
        else
        {
            return "failed";
        }
    }

    public async Task<(string Message, UserProfileModel? UserProfile)> UserProfileAsync()
    {
        var client = _httpClientFactory.CreateClient("API");
        var response = await client.GetAsync("api/Auth/user-profile");
        if (response.IsSuccessStatusCode)
        {
            return ("Success", await response.Content.ReadFromJsonAsync<UserProfileModel>());
        }
        else
        {
            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                return ("Unauthorized", null);
            }
            else
            {
                return ("Failed", null);
            }
        }
    }

    public async Task<string> LogoutAsync()
    {
        var client = _httpClientFactory.CreateClient("API");
        var response = await client.PostAsync("api/Auth/logout", null);
        if (response.IsSuccessStatusCode)
        {
            return "Success";
        }
        return "Failed";
    }
}
