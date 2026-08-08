// ADMIN_PANEL_SPEC.md §1 — "admin accounts are created directly in the
// database (or via a one-off seed script) by whoever runs the project, not
// through the public /register form."
//
// This is that script. It promotes an EXISTING account (register normally
// first, then run this) rather than creating one, so there is never a code
// path — not even an offline one — that writes a password for an admin.
//
//   npx tsx prisma/promote-admin.ts someone@silvero.925
//   npx tsx prisma/promote-admin.ts someone@silvero.925 --demote
//
// Deliberately not wired into package.json scripts: promoting an admin should
// be a thing you go and look up how to do, not something one keystroke away
// from `npm run dev`.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const [emailArg, ...flags] = process.argv.slice(2);
  const demote = flags.includes("--demote");

  if (!emailArg) {
    console.error("Usage: npx tsx prisma/promote-admin.ts <email> [--demote]");
    process.exit(1);
  }

  const email = emailArg.toLowerCase().trim();
  const user = await db.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`No account found for ${email}. Register at /account/register first, then re-run.`);
    process.exit(1);
  }

  // Demoting an admin who is also a Circle member must land on CIRCLE, not
  // CUSTOMER — otherwise this script silently revokes their membership
  // benefits while claiming only to have removed admin rights.
  let nextRole: "CUSTOMER" | "CIRCLE" | "ADMIN" = "ADMIN";
  if (demote) {
    const membership = await db.circleMembership.findUnique({ where: { userId: user.id } });
    nextRole = membership ? "CIRCLE" : "CUSTOMER";
  }

  if (user.role === nextRole) {
    console.log(`${email} is already ${nextRole}. Nothing to do.`);
    return;
  }

  await db.user.update({ where: { id: user.id }, data: { role: nextRole } });
  console.log(`${email}: ${user.role} → ${nextRole}`);

  // requireAdmin() reads the role from the database on every request, so this
  // takes effect immediately — no sign-out/sign-in needed either way.
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
