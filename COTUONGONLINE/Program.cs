using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using COTUONGONLINE.Data;
using COTUONGONLINE.Areas.Identity.Data;
var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("COTUONGONLINEContextConnection") ?? throw new InvalidOperationException("Connection string 'COTUONGONLINEContextConnection' not found.");

builder.Services.AddDbContext<COTUONGONLINEContext>(options => options.UseSqlServer(connectionString));

builder.Services.AddDefaultIdentity<COTUONGONLINEUser>(options => options.SignIn.RequireConfirmedAccount = true).AddEntityFrameworkStores<COTUONGONLINEContext>();

// Add services to the container.
builder.Services.AddControllersWithViews();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
}
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.MapRazorPages();
app.Run();