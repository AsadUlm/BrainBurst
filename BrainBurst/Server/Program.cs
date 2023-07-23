using BrainBurst.Server.Repository;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Blazored.LocalStorage;
using BrainBurst.Client.Handlers;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using BrainBurst.Server.Extentions;

var builder = WebApplication.CreateBuilder(args);
IConfiguration configuration = new ConfigurationBuilder().AddJsonFile("appsettings.json").Build();
string CorsPolicyOrigins = "_CorsPolicyOrigins";
builder.Services.AddCors(options => options.AddPolicy(CorsPolicyOrigins, builder => builder.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader().Build()));
builder.Services.AddOptions();


builder.Services.AddControllers();
builder.Services.AddMySwaggerGen();
builder.Services.AddDbContext<BrainBrustDBContext>(option => option.UseNpgsql(configuration["ConnectionStrings:ConnectionString"]));
builder.Services.AddDefaultIdentity<IdentityUser>().AddEntityFrameworkStores<BrainBrustDBContext>();

//builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = configuration["JwtIssuer"],
        ValidAudience = configuration["JwtAudience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["JwtSecurityKey"]))
    };
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;

});

builder.Services.AddAuthentication(
    CookieAuthenticationDefaults.AuthenticationScheme
)
.AddCookie()
.AddGoogle(options =>
{
    options.ClientId = configuration["Authentication:Google:ClientId"];
    options.ClientSecret = configuration["Authentication:Google:ClientSecret"];
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsSpecs",
    builder =>
    {
        builder
            .AllowAnyHeader()
            .AllowAnyMethod()
            .SetIsOriginAllowed(options => true)
            .AllowCredentials();
    });
});



//builder.Services.AddHttpClient("API", options => {
//    options.BaseAddress = new Uri("https://localhost:7011/");
//})
//.AddHttpMessageHandler<CookieHandler>();

builder.Services.AddControllersWithViews();
builder.Services.AddRazorPages();


var app = builder.Build();


if (app.Environment.IsDevelopment())
{
    app.UseWebAssemblyDebugging();
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRoleInitializerMiddleware();

app.UseHttpsRedirection();

app.UseBlazorFrameworkFiles();
app.UseStaticFiles();

app.UseRouting();

app.UseCors("CorsSpecs");

app.UseAuthentication();
app.UseAuthorization();

app.MapRazorPages();
app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();
