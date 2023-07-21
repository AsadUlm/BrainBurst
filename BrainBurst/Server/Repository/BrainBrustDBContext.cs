using BrainBurst.Domain.Model;
using Microsoft.EntityFrameworkCore;

namespace BrainBurst.Server.Repository
{
    public class BrainBrustDBContext : DbContext
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
