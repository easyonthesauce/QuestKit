export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-2">Active Quests</h3>
          <p className="text-3xl font-bold text-primary-600">12</p>
          <p className="text-sm text-gray-500">Quests available</p>
        </div>
        
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-2">XP Earned</h3>
          <p className="text-3xl font-bold text-secondary-600">2,540</p>
          <p className="text-sm text-gray-500">Total experience</p>
        </div>
        
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-2">Current Streak</h3>
          <p className="text-3xl font-bold text-success-600">7</p>
          <p className="text-sm text-gray-500">Days in a row</p>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-gray-600">Welcome to QuestKit! Your family quest dashboard is being built...</p>
      </div>
    </div>
  )
}