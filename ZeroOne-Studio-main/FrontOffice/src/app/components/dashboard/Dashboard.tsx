import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Employees } from '../views/Employees';
import { Skills } from '../views/Skills';
import { Activities } from '../views/Activities';
import { Recommendations } from '../views/Recommendations';
import { Analytics } from '../views/Analytics';
import { Profile } from '../views/Profile';
import { Settings } from '../views/Settings';
import { Departments } from '../views/Departments';
import type { User } from '../../lib/types';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export type ViewType = 'employees' | 'skills' | 'activities' | 'recommendations' | 'analytics' | 'profile' | 'settings' | 'departments';

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [currentView, setCurrentView] = useState<ViewType>('activities');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'employees': return <Employees userRole={user.role} />;
      case 'skills': return <Skills userRole={user.role} />;
      case 'activities': return <Activities userRole={user.role} user={user} />;
      case 'recommendations': return <Recommendations userRole={user.role} user={user} />;
      case 'analytics': return <Analytics userRole={user.role} />;
      case 'profile': return <Profile user={user} />;
      case 'settings': return <Settings user={user} onLogout={onLogout} />;
      case 'departments': return <Departments userRole={user.role} user={user} />;
      default: return <Activities userRole={user.role} user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-secondary overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        userRole={user.role} 
        userName={user.name} 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      <main className={`flex-1 overflow-auto transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>{renderView()}</main>
    </div>
  );
}
