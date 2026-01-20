import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export function PieChartComponent({ transactions, categories }) {
  const data = categories
    .filter((cat) => transactions.some((t) => t.category === cat.name))
    .map((cat) => ({
      name: cat.name,
      value: transactions
        .filter((t) => t.category === cat.name)
        .reduce((sum, t) => sum + t.value, 0),
      color: cat.color,
    }))

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        Nenhuma despesa para exibir
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) =>
            `${name}: ${(percent * 100).toFixed(0)}%`
          }
          outerRadius={120}
          fill="#475569"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function LineChartComponent({ transactions }) {
  // Agrupar despesas por dia
  const dailyData = {}
  transactions.forEach((t) => {
    const date = t.date
    if (!dailyData[date]) {
      dailyData[date] = 0
    }
    dailyData[date] += t.value
  })

  const data = Object.entries(dailyData)
    .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
    .map(([date, value]) => ({
      date: new Date(date).toLocaleDateString('pt-BR'),
      value: parseFloat(value.toFixed(2)),
    }))

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        Nenhuma despesa para exibir
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#1e293b"
          strokeWidth={3}
          dot={{ fill: '#1e293b', r: 5 }}
          activeDot={{ r: 7 }}
          name="Despesa (R$)"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function BarChartComponent({ transactions, categories }) {
  const data = categories
    .filter((cat) => transactions.some((t) => t.category === cat.name))
    .map((cat) => ({
      name: cat.name,
      valor: parseFloat(
        transactions
          .filter((t) => t.category === cat.name)
          .reduce((sum, t) => sum + t.value, 0)
          .toFixed(2)
      ),
      color: cat.color,
    }))
    .sort((a, b) => b.valor - a.valor)

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        Nenhuma despesa para exibir
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
        <Legend />
        <Bar dataKey="valor" fill="#1e293b" name="Total Gasto (R$)">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function ChartsDashboard({ transactions, categories }) {
  return (
    <div className="space-y-6">
      {/* Pie Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Distribuição por Categoria
        </h3>
        <PieChartComponent transactions={transactions} categories={categories} />
      </div>

      {/* Line Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Despesas ao Longo do Tempo
        </h3>
        <LineChartComponent transactions={transactions} />
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Total por Categoria
        </h3>
        <BarChartComponent transactions={transactions} categories={categories} />
      </div>
    </div>
  )
}

