import { GraduationCap, LayoutDashboard, CalendarClock } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const Header = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Home', icon: GraduationCap },
    { path: '/select-slot', label: 'Select Slots', icon: CalendarClock },
    { path: '/admin', label: 'Admin', icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight text-foreground">
              Academic Slot Portal
            </span>
            <span className="text-[10px] leading-tight text-muted-foreground">
              Department Allocation System
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                location.pathname === path
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
