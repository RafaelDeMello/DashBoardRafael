"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, ChevronDown, FileText, GripVertical, Plus, Trash2, Undo2, X } from "lucide-react";
import {
  addItem,
  addSection,
  renameSection,
  reorderItems,
  reorderSections,
  setItemDeleted,
  setSectionDeleted,
  toggleItem,
  updateItem,
} from "@/app/actions";
import type { DayData, ItemData, SectionData } from "@/lib/days";

// ---------- Estado otimista ----------
// A tela muda na hora (sem esperar o servidor). Quando a resposta chega, o React
// troca este estado "previsto" pelos dados reais vindos do servidor.

type Op =
  | { type: "toggle"; itemId: string; done: boolean }
  | { type: "addItem"; sectionId: string; id: string; title: string }
  | { type: "updateItem"; itemId: string; title: string; description: string | null }
  | { type: "removeItem"; itemId: string }
  | { type: "reorderItems"; sectionId: string; ids: string[] }
  | { type: "addSection"; id: string; title: string }
  | { type: "renameSection"; sectionId: string; title: string }
  | { type: "removeSection"; sectionId: string }
  | { type: "reorderSections"; ids: string[] };

const mapItems = (day: DayData, fn: (items: ItemData[], s: SectionData) => ItemData[]): DayData => ({
  ...day,
  sections: day.sections.map((s) => ({ ...s, items: fn(s.items, s) })),
});

function reduce(day: DayData, op: Op): DayData {
  switch (op.type) {
    case "toggle":
      return mapItems(day, (items) =>
        items.map((i) => (i.id === op.itemId ? { ...i, done: op.done } : i)),
      );
    case "addItem":
      return mapItems(day, (items, s) =>
        s.id === op.sectionId
          ? [...items, { id: op.id, title: op.title, description: null, done: false }]
          : items,
      );
    case "updateItem":
      return mapItems(day, (items) =>
        items.map((i) =>
          i.id === op.itemId ? { ...i, title: op.title, description: op.description } : i,
        ),
      );
    case "removeItem":
      return mapItems(day, (items) => items.filter((i) => i.id !== op.itemId));
    case "reorderItems":
      return mapItems(day, (items, s) =>
        s.id === op.sectionId
          ? op.ids.flatMap((id) => items.find((i) => i.id === id) ?? [])
          : items,
      );
    case "addSection":
      return { ...day, sections: [...day.sections, { id: op.id, title: op.title, items: [] }] };
    case "renameSection":
      return {
        ...day,
        sections: day.sections.map((s) => (s.id === op.sectionId ? { ...s, title: op.title } : s)),
      };
    case "removeSection":
      return { ...day, sections: day.sections.filter((s) => s.id !== op.sectionId) };
    case "reorderSections":
      return {
        ...day,
        sections: op.ids.flatMap((id) => day.sections.find((s) => s.id === id) ?? []),
      };
  }
}

// Itens/seções recém-criados usam um id provisório até o servidor responder
const tempId = () => `tmp-${crypto.randomUUID()}`;
const isTemp = (id: string) => id.startsWith("tmp-");

type Run = (op: Op, action: () => Promise<void>) => void;
type Toast = { key: number; label: string; undo: () => Promise<void> };

// ---------- Peças pequenas ----------

function ProgressStrip({ done, total, className }: { done: number; total: number; className: string }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div
      className={`mb-4 flex items-center gap-2.5 rounded-[10px] bg-[#f7f7f5] px-4 py-3 text-xs text-[#787774] ${className}`}
    >
      <div className="h-2 flex-1 rounded bg-[#e6e5e2]">
        <div className="h-2 rounded bg-[#2f6a96] transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[15px] text-[#2f2f2c]">{pct}%</span>
      <span>
        {done} de {total}
      </span>
    </div>
  );
}

function ScopeToggle({ permanent, onChange }: { permanent: boolean; onChange: (v: boolean) => void }) {
  const option = (value: boolean, label: string, hint: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={permanent === value}
      aria-label={label}
      title={hint}
      onClick={() => onChange(value)}
      className={`rounded px-2.5 py-1 transition-colors ${
        permanent === value ? "bg-[#2f6a96] text-white" : "text-[#787774] hover:bg-[#f1f1ef]"
      }`}
    >
      {label}
    </button>
  );
  return (
    <div className="mb-3 flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-xs text-[#787774]">
      {permanent && <span>Mudanças também vão para o modelo dos próximos dias.</span>}
      <span>Alterações valem</span>
      <div role="radiogroup" aria-label="Alcance das alterações" className="flex rounded-md border border-[#e3e2df] p-0.5">
        {option(false, "Só hoje", "Muda apenas este dia.")}
        {option(true, "Sempre", "Muda também o modelo usado para criar os próximos dias.")}
      </div>
    </div>
  );
}

function AddInput({ placeholder, onAdd }: { placeholder: string; onAdd: (title: string) => void }) {
  return (
    <form
      className="flex items-center gap-2.5 py-1"
      onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.elements.namedItem("title") as HTMLInputElement;
        const value = input.value.trim();
        if (!value) return;
        input.value = "";
        onAdd(value);
      }}
    >
      <Plus size={18} className="flex-none text-[#b8b7b4]" />
      <input
        name="title"
        maxLength={200}
        autoComplete="off"
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-transparent text-sm text-[#37352f] outline-none placeholder:text-[#b8b7b4] focus:placeholder:text-[#9b9a97]"
      />
    </form>
  );
}

function ItemEditor({
  item,
  onSave,
  onCancel,
}: {
  item: ItemData;
  onSave: (title: string, description: string | null) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  return (
    <form
      className="mb-2 ml-7 mt-1 flex flex-col gap-2 rounded-lg bg-[#f7f7f5] p-3"
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
      onSubmit={(e) => {
        e.preventDefault();
        if (title.trim()) onSave(title.trim(), description.trim() || null);
      }}
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        aria-label="Título do item"
        className="rounded border border-[#dcdbd8] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[#2f6a96]"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder="Descrição (opcional)"
        aria-label="Descrição do item"
        className="resize-y rounded border border-[#dcdbd8] bg-white px-2.5 py-1.5 text-sm outline-none placeholder:text-[#b8b7b4] focus:border-[#2f6a96]"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!title.trim()}
          className="rounded-md bg-[#2f6a96] px-3 py-1.5 text-xs text-white hover:bg-[#285a80] disabled:opacity-50"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-[#dcdbd8] px-3 py-1.5 text-xs hover:bg-[#f1f1ef]"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// Alça de arrastar: fica na margem esquerda; aparece ao passar o mouse (sempre no toque)
const gripClass =
  "-ml-5 flex h-5 w-4 flex-none cursor-grab touch-none items-center justify-center rounded text-[#c4c3c0] hover:text-[#787774] active:cursor-grabbing md:opacity-0 md:focus-visible:opacity-100";

// ---------- Item ----------

function ItemRow({
  item,
  editing,
  onEdit,
  onToggle,
  onSave,
  onRemove,
}: {
  item: ItemData;
  editing: boolean;
  onEdit: (open: boolean) => void;
  onToggle: () => void;
  onSave: (title: string, description: string | null) => void;
  onRemove: () => void;
}) {
  const pending = isTemp(item.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: pending,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group/i ${isDragging ? "relative z-10 opacity-60" : ""} ${pending ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-2.5 py-1 text-sm">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Arrastar: ${item.title}`}
          className={`${gripClass} md:group-hover/i:opacity-100`}
        >
          <GripVertical size={14} />
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onToggle}
          aria-pressed={item.done}
          aria-label={item.done ? `Desmarcar: ${item.title}` : `Marcar como feito: ${item.title}`}
          className={`-ml-1.5 flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[5px] border-[1.5px] transition-colors ${
            item.done
              ? "border-[#2f6a96] bg-[#2f6a96] text-white"
              : "border-[#9b9a97] hover:border-[#2f6a96]"
          }`}
        >
          {item.done && <Check size={12} strokeWidth={3} />}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => onEdit(!editing)}
          aria-label={`Editar: ${item.title}`}
          aria-expanded={editing}
          title="Editar item e descrição"
          className={`min-w-0 flex-1 truncate text-left ${item.done ? "text-[#9b9a97] line-through" : ""}`}
        >
          {item.title}
        </button>
        {item.description && (
          <FileText size={14} className="flex-none text-[#b8b7b4]" aria-label="Tem descrição" />
        )}
        <button
          type="button"
          disabled={pending}
          onClick={onRemove}
          aria-label={`Remover: ${item.title}`}
          className="flex-none rounded p-0.5 text-[#b8b7b4] hover:bg-[#f1f1ef] hover:text-[#c0392b] md:opacity-0 md:focus-visible:opacity-100 md:group-hover/i:opacity-100"
        >
          <X size={14} />
        </button>
      </div>
      {editing && <ItemEditor item={item} onSave={onSave} onCancel={() => onEdit(false)} />}
    </li>
  );
}

// ---------- Seção ----------

function SectionBlock({
  section,
  collapsed,
  onToggleCollapsed,
  permanent,
  run,
  notify,
  editingId,
  setEditingId,
}: {
  section: SectionData;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  permanent: boolean;
  run: Run;
  notify: (label: string, undo: () => Promise<void>) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
}) {
  const pending = isTemp(section.id);
  const [renaming, setRenaming] = useState(false);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    disabled: pending,
  });

  const done = section.items.filter((i) => i.done).length;
  const itemIds = section.items.map((i) => i.id);

  const onItemsDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || itemIds.some(isTemp)) return;
    const from = itemIds.indexOf(String(active.id));
    const to = itemIds.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    const ids = arrayMove(itemIds, from, to);
    run({ type: "reorderItems", sectionId: section.id, ids }, () =>
      reorderItems({ sectionId: section.id, ids, permanent }),
    );
  };

  const saveName = (value: string) => {
    setRenaming(false);
    const next = value.trim();
    if (!next || next === section.title) return;
    run({ type: "renameSection", sectionId: section.id, title: next }, () =>
      renameSection({ sectionId: section.id, title: next, permanent }),
    );
  };

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`mt-3 first:mt-0 ${isDragging ? "relative z-10 opacity-60" : ""} ${pending ? "opacity-60" : ""}`}
    >
      <div className="group/h flex items-center gap-1 py-0.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Arrastar seção: ${section.title}`}
          className={`${gripClass} md:group-hover/h:opacity-100`}
        >
          <GripVertical size={14} />
        </button>
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? `Expandir ${section.title}` : `Recolher ${section.title}`}
          className="rounded p-0.5 text-[#9b9a97] hover:bg-[#f1f1ef]"
        >
          <ChevronDown size={14} className={`transition-transform ${collapsed ? "-rotate-90" : ""}`} />
        </button>

        {renaming ? (
          <input
            autoFocus
            defaultValue={section.title}
            maxLength={200}
            aria-label="Nome da seção"
            onBlur={(e) => saveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName(e.currentTarget.value);
              if (e.key === "Escape") setRenaming(false);
            }}
            className="min-w-0 flex-1 rounded border border-[#2f6a96] px-1.5 text-[15px] font-medium outline-none"
          />
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => setRenaming(true)}
            aria-label={`Renomear seção: ${section.title}`}
            title="Renomear seção"
            className="min-w-0 flex-1 truncate text-left text-[15px] font-medium"
          >
            {section.title}
          </button>
        )}

        <span className="flex-none text-xs text-[#9b9a97]">
          {done} de {section.items.length}
        </span>
        <button
          type="button"
          disabled={pending}
          aria-label={`Remover seção: ${section.title}`}
          onClick={() => {
            const scope = permanent;
            run({ type: "removeSection", sectionId: section.id }, () =>
              setSectionDeleted({ sectionId: section.id, deleted: true, permanent: scope }),
            );
            notify(`Seção “${section.title}” removida`, () =>
              setSectionDeleted({ sectionId: section.id, deleted: false, permanent: scope }),
            );
          }}
          className="flex-none rounded p-0.5 text-[#b8b7b4] hover:bg-[#f1f1ef] hover:text-[#c0392b] md:opacity-0 md:focus-visible:opacity-100 md:group-hover/h:opacity-100"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {!collapsed && (
        <>
          <DndContext
            id={`itens-${section.id}`}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onItemsDragEnd}
          >
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
              <ul>
                {section.items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    editing={editingId === item.id}
                    onEdit={(open) => setEditingId(open ? item.id : null)}
                    onToggle={() =>
                      run({ type: "toggle", itemId: item.id, done: !item.done }, () =>
                        toggleItem({ itemId: item.id, done: !item.done }),
                      )
                    }
                    onSave={(title, description) => {
                      setEditingId(null);
                      run({ type: "updateItem", itemId: item.id, title, description }, () =>
                        updateItem({ itemId: item.id, title, description, permanent }),
                      );
                    }}
                    onRemove={() => {
                      const scope = permanent;
                      run({ type: "removeItem", itemId: item.id }, () =>
                        setItemDeleted({ itemId: item.id, deleted: true, permanent: scope }),
                      );
                      notify(`“${item.title}” removido`, () =>
                        setItemDeleted({ itemId: item.id, deleted: false, permanent: scope }),
                      );
                    }}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>

          {!pending && (
            <AddInput
              placeholder="Novo item"
              onAdd={(title) =>
                run({ type: "addItem", sectionId: section.id, id: tempId(), title }, () =>
                  addItem({ sectionId: section.id, title, permanent }),
                )
              }
            />
          )}
        </>
      )}
    </section>
  );
}

// ---------- Quadro do dia ----------

export function DayBoard({
  day,
  initialPermanent,
  stripClassName,
}: {
  day: DayData;
  initialPermanent: boolean;
  stripClassName: string;
}) {
  const [optimistic, apply] = useOptimistic(day, reduce);
  const [, startTransition] = useTransition();
  const [permanent, setPermanent] = useState(initialPermanent);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [toast, setToast] = useState<Toast | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const run: Run = (op, action) =>
    startTransition(async () => {
      apply(op);
      await action();
    });

  // O aviso de "Desfazer" some sozinho depois de alguns segundos
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(timer);
  }, [toast]);

  const changeScope = (value: boolean) => {
    setPermanent(value);
    // Preferência de interface (não é segredo): o servidor lê para abrir já no modo certo
    document.cookie = `scope=${value ? "permanent" : "today"}; path=/; max-age=31536000; samesite=lax`;
  };

  const sectionIds = optimistic.sections.map((s) => s.id);
  const allItems = optimistic.sections.flatMap((s) => s.items);

  const onSectionsDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || sectionIds.some(isTemp)) return;
    const from = sectionIds.indexOf(String(active.id));
    const to = sectionIds.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    const ids = arrayMove(sectionIds, from, to);
    run({ type: "reorderSections", ids }, () => reorderSections({ listId: day.id, ids, permanent }));
  };

  return (
    <>
      <ScopeToggle permanent={permanent} onChange={changeScope} />
      <ProgressStrip
        done={allItems.filter((i) => i.done).length}
        total={allItems.length}
        className={stripClassName}
      />

      {optimistic.sections.length === 0 && (
        <p className="mb-3 text-sm text-[#9b9a97]">Comece adicionando uma seção, por exemplo “Manhã”.</p>
      )}

      <DndContext
        id="secoes"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onSectionsDragEnd}
      >
        <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
          {optimistic.sections.map((section) => (
            <SectionBlock
              key={section.id}
              section={section}
              collapsed={collapsed.has(section.id)}
              onToggleCollapsed={() =>
                setCollapsed((prev) => {
                  const next = new Set(prev);
                  if (!next.delete(section.id)) next.add(section.id);
                  return next;
                })
              }
              permanent={permanent}
              run={run}
              notify={(label, undo) => setToast({ key: Date.now(), label, undo })}
              editingId={editingId}
              setEditingId={setEditingId}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div className="mt-5 border-t border-[#ededeb] pt-2">
        <AddInput
          placeholder="Nova seção (ex.: Manhã)"
          onAdd={(title) =>
            run({ type: "addSection", id: tempId(), title }, () =>
              addSection({ listId: day.id, title, permanent }),
            )
          }
        />
      </div>

      {toast && (
        <div
          key={toast.key}
          role="status"
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-lg bg-[#2f2f2c] px-4 py-2.5 text-sm text-white shadow-lg"
        >
          <span className="max-w-[60vw] truncate">{toast.label}</span>
          <button
            type="button"
            onClick={() => {
              const { undo } = toast;
              setToast(null);
              startTransition(async () => {
                await undo();
              });
            }}
            className="flex items-center gap-1.5 font-medium text-[#9ccaf0] hover:text-white"
          >
            <Undo2 size={15} />
            Desfazer
          </button>
        </div>
      )}
    </>
  );
}
