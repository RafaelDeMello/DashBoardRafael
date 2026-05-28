import { useEffect, useMemo, useState } from "react";

export default function TransactionsPanel({ selectedMonth, selectedYear, theme }) {
    const user = useStore((s) => s.user);
    const transactions = useStore((s) => s.transactions);
    const categories = useStore((s) => s.categories);
    const creditCards = useStore((s) => s.creditCards);

    const addTransaction = useStore((s) => s.addTransaction);
    const updateTransaction = useStore((s) => s.updateTransaction);
    const deleteTransaction = useStore((s) => s.deleteTransaction);
    const loadTransactionsByPeriod = useStore((s) => s.loadTransactionsByPeriod);

    const todayISO = new Date().toISOString().slice(0, 10);
    const [form, setForm] = useState({
        type: 'expense',
        value: '',
        date: todayISO,
        category_id: '',
        credit_card_id: '',
        description: '',        
    })

    const filteredCategories = useMemo(() => {
        return categories.filter(c => c.type === form.type || !c.type);
    }, [categories, form.type]);
    
    useEffect(() => {
        if(!user?.id) return;
        loadTransactionsByPeriod(user.id, selectedMonth, selectedYear);
    }, [user?.id, selectedMonth, selectedYear, loadTransactionsByPeriod]);

    const handleTypeChange = (nextType) => {
        setForm((prev) => ({
            ...prev,
            type: nextType,
            category_id: "",
        }));
    };

    const resetForm = () => {
        setForm({
            type: "expense",
            value: "",
            date: new Date().toString().slice(0, 10),
            category_id: "",
            credit_card_id: "",
            description: "",
        });
    }

    const handleSubmit = async (e) => {
  e.preventDefault();

  if (!user?.id) return;

  const numericValue = Number(form.value);

  if (!form.type) {
    setMessage({ type: "error", text: "Tipo de lançamento é obrigatório." });
    return;
  }

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    setMessage({ type: "error", text: "Valor deve ser maior que zero." });
    return;
  }

  if (!form.date || Number.isNaN(new Date(form.date).getTime())) {
    setMessage({ type: "error", text: "Data inválida." });
    return;
  }

  try {
    setLoading(true);
    setMessage(null);

    const payload = {
      user_id: user.id,
      type: form.type,
      value: numericValue,
      date: form.date,
      description: form.description?.trim() || null,
      category_id: form.category_id ? form.category_id : null,
      category: form.category_id
        ? (categories.find((c) => c.id === form.category_id)?.name || "Sem categoria")
        : "Sem categoria",
      credit_card_id: form.credit_card_id || null,
    };

    await addTransaction(payload);
    await loadTransactionsByPeriod(user.id, selectedMonth, selectedYear);
    resetForm();

    setMessage({ type: "success", text: "Lançamento salvo com sucesso!" });
  } catch (err) {
    setMessage({
      type: "error",
      text: `Erro ao salvar lançamento: ${err.message}`,
    });
  } finally {
    setLoading(false);
  }
};
}