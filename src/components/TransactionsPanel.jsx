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
}