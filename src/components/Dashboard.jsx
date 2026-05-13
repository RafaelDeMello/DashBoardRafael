import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import SummaryCards from "./SummaryCards";
import TabContent from "./TabContent";
import ChartsDashboard from "./Charts";
import CreditCardsManager from "./CreditCardsManager";
import InvoicesPanel from "./InvoicesPanel";
import Settings from "./Settings";
import useStore from "../storeSupabase";

const themeConfig = {
  slate: {
    bg: "bg-slate-50",
    sidebar: "from-slate-800 to-slate-900",
    accent: "slate",
    cardBg: "bg-slate-100",
    button: "bg-slate-700 hover:bg-slate-800",
    buttonAlt: "bg-slate-600 hover:bg-slate-700",
  },
  pink: {
    bg: "bg-pink-50",
    sidebar: "from-pink-700 to-pink-800",
    accent: "pink",
    cardBg: "bg-pink-100",
    button: "bg-pink-600 hover:bg-pink-700",
    buttonAlt: "bg-pink-500 hover:bg-pink-600",
  },
  blue: {
    bg: "bg-blue-50",
    sidebar: "from-blue-700 to-blue-800",
    accent: "blue",
    cardBg: "bg-blue-100",
    button: "bg-blue-600 hover:bg-blue-700",
    buttonAlt: "bg-blue-500 hover:bg-blue-600",
  },
  green: {
    bg: "bg-green-50",
    sidebar: "from-green-700 to-green-800",
    accent: "green",
    cardBg: "bg-green-100",
    button: "bg-green-600 hover:bg-green-700",
    buttonAlt: "bg-green-500 hover:bg-green-600",
  },
  purple: {
    bg: "bg-purple-50",
    sidebar: "from-purple-700 to-purple-800",
    accent: "purple",
    cardBg: "bg-purple-100",
    button: "bg-purple-600 hover:bg-purple-700",
    buttonAlt: "bg-purple-500 hover:bg-purple-600",
  },
  orange: {
    bg: "bg-amber-50",
    sidebar: "from-amber-700 to-amber-800",
    accent: "amber",
    cardBg: "bg-amber-100",
    button: "bg-amber-600 hover:bg-amber-700",
    buttonAlt: "bg-amber-500 hover:bg-amber-600",
  },
};

export default function Dashboard({
  user,
  avatarUrl,
  userName,
  userEmail,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const userProfile = useStore((state) => state.userProfile);

  const currentAvatarUrl = userProfile?.avatar_url || avatarUrl;
  const currentUserName = userProfile?.full_name || userName;
  const currentUserEmail = user?.email || userEmail;
  const currentThemeId = userProfile?.app_theme || "slate";

  const theme = themeConfig[currentThemeId] || themeConfig.slate;
  const bgColor = theme.bg;
  const sidebarBg = `bg-gradient-to-b ${theme.sidebar}`;

  const transactions = useStore((state) => state.transactions);
  const categories = useStore((state) => state.categories);
  const creditCards = useStore((state) => state.creditCards);
  const loadTransactionsByPeriod = useStore(
    (state) => state.loadTransactionsByPeriod,
  );
  const ensureMonthlyRecurringTransactions = useStore(
    (state) => state.ensureMonthlyRecurringTransactions,
  );
  const loadCategories = useStore((state) => state.loadCategories);
  const loadCreditCards = useStore((state) => state.loadCreditCards);
  const loadUserProfile = useStore((state) => state.loadUserProfile);

  const now = new Date();
  const [period, setPeriod] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const [periodLoading, setPeriodLoading] = useState(false);

  const handlePrevMonth = () => {
    setPeriod((prev) => {
      if (prev.month === 1) {
        return { month: 12, year: prev.year - 1 };
      }
      return { month: prev.month - 1, year: prev.year };
    });
  };

  const handleNextMonth = () => {
    setPeriod((prev) => {
      if (prev.month === 12) {
        return { month: 1, year: prev.year + 1 };
      }
      return { month: prev.month + 1, year: prev.year };
    });
  };

  const handleGoToCurrentMonth = () => {
    const current = new Date();
    setPeriod({ month: current.getMonth() + 1, year: current.getFullYear() });
  };

  const formatPeriodLabel = (month, year) => {
    return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  };

  // Carregar dados e perfil quando usuário muda
  useEffect(() => {
    if (!user?.id) return;

    const run = async () => {
      try {
        setPeriodLoading(true);
        await ensureMonthlyRecurringTransactions(
          user.id,
          period.month,
          period.year,
        );
        await loadTransactionsByPeriod(user.id, period.month, period.year);
        await loadCategories(user.id);
        await loadCreditCards(user.id);
        await loadUserProfile(user.id);
      } catch (err) {
        console.error("Erro ao carregar período:", err);
      } finally {
        setPeriodLoading(false);
      }
    };

    run();
  }, [
    user?.id,
    period.month,
    period.year,
    ensureMonthlyRecurringTransactions,
    loadTransactionsByPeriod,
    loadCategories,
    loadCreditCards,
    loadUserProfile,
  ]);

  return (
    <div className={`flex h-screen overflow-hidden ${bgColor}`}>
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={onLogout}
        sidebarBg={sidebarBg}
        avatarUrl={currentAvatarUrl}
        userName={currentUserName}
        userEmail={currentUserEmail}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto mt-16 md:mt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <>
              <h1 className="text-4xl font-bold text-gray-900 mb-8">
                Dashboard
              </h1>
              <div className="flex items-center justify-between mb-6 bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                  >
                    {"<"}
                  </button>
                  <span className="font-semibold capitalize">
                    {formatPeriodLabel(period.month, period.year)}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                  >
                    {">"}
                  </button>
                </div>

                <button
                  onClick={handleGoToCurrentMonth}
                  className="px-3 py-1 rounded bg-slate-700 text-white hover:bg-slate-800"
                >
                  Mês atual
                </button>
              </div>
              {periodLoading && (
                <p className="text-sm text-gray-500 mb-4">Atualizando período...</p>
              )}
              <SummaryCards
                transactions={transactions}
                categories={categories}
                theme={theme}
                creditCards={creditCards}
              />
               <ChartsDashboard
                transactions={transactions}
                categories={categories}
              />
        
            </>
          )}

          {/* Credit Cards Tab */}
          {activeTab === "credit_cards" && (
            <TabContent title="Gerenciar Cartões de Crédito">
              <CreditCardsManager theme={theme} />
            </TabContent>
          )}

          {/* Invoices Tab */}
          {activeTab === "invoices" && (
            <TabContent title="Faturas">
              <InvoicesPanel theme={theme} />
            </TabContent>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <TabContent title="Configurações">
              <Settings />
            </TabContent>
          )}
        </div>
      </main>
    </div>
  );
}
