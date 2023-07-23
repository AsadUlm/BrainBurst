using BrainBurst.Domain.Model;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace BrainBurst.Server.Repository
{
    public class BrainBrustDBContext : IdentityDbContext
    {
        public DbSet<User> User { get; set; }
        public BrainBrustDBContext(DbContextOptions<BrainBrustDBContext> options) : base(options)
        {
            Database.Migrate();
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
        }
    }
}
