
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function getActiveSuspension(userId: string) {
  const result = await sql`
    SELECT id, reason, created_at
    FROM member_suspensions
    WHERE user_id = ${userId}
      AND status = 'active'
    LIMIT 1
  `;

  return result[0] || null;
}

export async function isAccountSuspended(userId: string) {
  const suspension = await getActiveSuspension(userId);
  return suspension !== null;
}
