import "server-only";
import { cookies } from "next/headers";
import { monthBounds, todayISO } from "@/lib/date";
import { getProgressRange } from "@/lib/days";

/** Dados que o menu lateral precisa em qualquer tela (estado do menu e calendário do mês). */
export async function loadShell(userId: string) {
  const today = todayISO();
  const expanded = (await cookies()).get("menu")?.value === "expanded";
  const { start, end } = monthBounds(today);
  // O calendário só existe com o menu expandido: não consulta à toa
  const progress = expanded ? await getProgressRange(userId, start, end) : {};
  return { today, expanded, progress };
}
