import {
  Users,
  Brain,
  Activity,
  Target,
  BarChart3,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  LogOut,
  Sparkles,
  ClipboardCheck,
} from 'lucide-react';
import { ViewType } from './Dashboard';

type UserRole = 'HR' | 'Manager' | 'Employee';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  userRole: UserRole;
  userName: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

interface MenuItem {
  id: ViewType;
  label: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

export function Sidebar({
  currentView,
  onViewChange,
  userRole,
  userName,
  isCollapsed,
  onToggleCollapse,
  onLogout,
}: SidebarProps) {
  const menuItems: MenuItem[] = [
    {
      id: 'employees',
      label: 'Employees',
      icon: <Users className="w-5 h-5" />,
      roles: ['HR', 'Manager'],
    },
    {
      id: 'skills',
      label: 'Skills',
      icon: <Brain className="w-5 h-5" />,
      roles: ['HR', 'Manager', 'Employee'],
    },
    {
      id: 'departments',
      label: 'Departments',
      icon: <Building2 className="w-5 h-5" />,
      roles: ['HR', 'Manager'],
    },
    {
      id: 'activities',
      label: 'Activities',
      icon: <Activity className="w-5 h-5" />,
      roles: ['HR', 'Manager', 'Employee'],
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      icon: <Target className="w-5 h-5" />,
      roles: ['HR', 'Manager'],
    },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: <ClipboardCheck className="w-5 h-5" />,
      roles: ['Manager'],
    },
    {
      id: 'job-matching',
      label: 'Job Matching',
      icon: <Sparkles className="w-5 h-5" />,
      roles: ['HR', 'Manager'],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      roles: ['HR', 'Manager'],
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="w-5 h-5" />,
      roles: ['HR', 'Manager', 'Employee'],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      roles: ['HR', 'Manager', 'Employee'],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 z-50 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="bg-white rounded-lg p-2">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="font-semibold text-lg">HRBrain</h1>
                  <p className="text-xs text-sidebar-foreground/70">{userRole}</p>
                </div>
              </div>
            )}
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* User Info */}
        {!isCollapsed && (
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
                <span className="text-sm font-semibold">
                  {userName.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{userName}</p>
                <p className="text-xs text-sidebar-foreground/70 truncate">
                  {userRole} Account
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {filteredMenuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    currentView === item.id
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'hover:bg-sidebar-accent text-sidebar-foreground'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!isCollapsed && <span className="flex-1 text-left">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-sidebar-accent text-sidebar-foreground"
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="flex-1 text-left">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
