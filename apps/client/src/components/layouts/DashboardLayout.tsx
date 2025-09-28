import { ReactNode } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-600">QuestKit Dashboard</h1>
          <p className="text-gray-600">Welcome to your family quest hub</p>
        </div>
        {children}
      </div>
    </div>
  )
}