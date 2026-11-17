import { beforeEach, describe, expect, it, vi } from "vitest";

// Toda ação do servidor (src/app/actions.ts) é uma porta de entrada pública da internet.
// REGRA: sem sessão válida, NENHUMA ação pode chegar a tocar nos dados.

vi.mock("@/lib/dal", () => ({
  // Simula "sem sessão": o verifySession real redireciona; aqui ele lança um erro reconhecível
  verifySession: vi.fn(async () => {
    throw new Error("SEM_SESSAO");
  }),
  getCurrentUser: vi.fn(async () => null),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn(), headers: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
// Troca a camada de dados por espiões: qualquer chamada fica registrada
vi.mock("@/lib/days");

import * as actions from "@/app/actions";
import * as days from "@/lib/days";
import { verifySession } from "@/lib/dal";

const uuid = "11111111-1111-4111-8111-111111111111";
const form = (fields: Record<string, string> = {}) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};

const allActions = Object.entries(actions).filter(([, fn]) => typeof fn === "function");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sem sessão, nenhuma ação do servidor mexe nos dados", () => {
  it("encontra as ações exportadas (para o teste não ficar vazio por engano)", () => {
    expect(allActions.length).toBeGreaterThanOrEqual(14);
  });

  it.each(allActions)("%s exige sessão antes de qualquer coisa", async (_name, action) => {
    // Chamamos com entradas VÁLIDAS e "perigosas": se a checagem de sessão faltasse,
    // a ação seguiria adiante e chamaria a camada de dados.
    const call = action as (...args: unknown[]) => Promise<unknown>;
    await expect(
      call(
        // objeto para as ações que recebem dados, FormData para as de formulário
        { itemId: uuid, sectionId: uuid, listId: uuid, title: "x", done: true, permanent: true, deleted: true, ids: [uuid], description: null },
        form({ date: "2026-03-10", mode: "empty", from: "2026-03-10", to: "2026-03-11", expanded: "true", sectionId: uuid }),
      ),
    ).rejects.toThrow("SEM_SESSAO");

    expect(verifySession).toHaveBeenCalled();
    // Nenhuma função da camada de dados pode ter sido tocada
    for (const [name, fn] of Object.entries(days)) {
      if (typeof fn === "function") {
        expect(fn, `days.${name} foi chamada sem sessão`).not.toHaveBeenCalled();
      }
    }
  });
});
