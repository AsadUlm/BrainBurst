using Blazored.LocalStorage;
using BrainBurst.Client;
using BrainBurst.Client.Handlers;
using BrainBurst.Client.Providers;
using BrainBurst.Service.Logics;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;


var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

//builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
builder.Services.AddHttpClient("API", options => {
    options.BaseAddress = new Uri("https://localhost:7011/");
})
.AddHttpMessageHandler<CookieHandler>();
builder.Services.AddScoped<AuthenticationStateProvider, CustomAuthStateProvider>();
builder.Services.AddScoped<CookieHandler>();

builder.Services.AddScoped<IApiLogic, ApiLogic>();

builder.Services.AddOptions();
builder.Services.AddAuthorizationCore();
builder.Services.AddBlazoredLocalStorage();

await builder.Build().RunAsync();
