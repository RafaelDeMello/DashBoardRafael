export default function TabContent({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">{title}</h2>
      {children}
    </div>
  )
}

