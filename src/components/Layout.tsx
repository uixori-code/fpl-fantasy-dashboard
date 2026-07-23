import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

const links = [
  { to: '/', label: 'Overview' },
  { to: '/my-team', label: 'My Team' },
  { to: '/statistics', label: 'Statistics' },
  { to: '/fixtures', label: 'Fixtures' },
  { to: '/top-managers', label: 'Top Managers' },
  { to: '/settings', label: 'Settings' },
];

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="bg-pitch border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-accent">FPL Fantasy Dashboard</h1>
        </div>
        <nav className="max-w-6xl mx-auto px-4 pb-2 flex flex-wrap gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-accent text-pitch' : 'text-slate-200 hover:bg-white/10'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
