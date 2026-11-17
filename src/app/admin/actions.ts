"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifyAdmin } from "@/lib/dal";
import { setAccountStatus } from "@/lib/admin";

// Só administrador libera ou bloqueia contas. verifyAdmin() vem SEMPRE primeiro.
const input = z.object({
  userId: z.uuid(),
  status: z.enum(["approved", "blocked"]),
});

export async function setAccountStatusAction(formData: FormData) {
  await verifyAdmin();
  const p = input.safeParse({ userId: formData.get("userId"), status: formData.get("status") });
  if (!p.success) return;
  await setAccountStatus(p.data.userId, p.data.status);
  revalidatePath("/admin");
}
