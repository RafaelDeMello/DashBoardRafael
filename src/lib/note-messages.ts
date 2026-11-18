// Mensagens de erro de Notas (código puro: usado no servidor e na tela).
export const NOTE_ERRORS: Record<string, string> = {
  invalid_name: "Nome inválido. Use de 1 a 100 caracteres, sem barras.",
  exists: "Já existe um item com esse nome aqui.",
  limit: "Limite atingido. Apague algo antes de criar mais.",
  depth: "Pastas demais uma dentro da outra (máximo de 8 níveis).",
  not_found: "Não encontramos esse item. Ele pode ter sido apagado.",
  cycle: "Não dá para mover uma pasta para dentro dela mesma.",
  type_change: "Não dá trocar o tipo de um arquivo que já tem conteúdo.",
  too_large: "O arquivo é grande demais.",
  invalid_content: "O conteúdo não é válido.",
  invalid_icon: "Ícone inválido.",
  confirm: "Digite o nome exato para confirmar.",
  invalid: "Dados inválidos.",
};

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };
