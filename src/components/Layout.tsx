import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui';

const links = [
  { to: '/', label: 'Ranking' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/enviar', label: 'Enviar evidência' },
  { to: '/perfil', label: 'Perfil' },
  { to: '/hall-da-fama', label: 'Hall da Fama' },
];

export default function Layout() {
  const { profile, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const items = isAdmin ? [...links, { to: '/admin', label: 'Admin' }] : links;
  const cls = ({ isActive }: { isActive: boolean }) =>
    `block rounded px-3 py-2 font-display text-sm uppercase tracking-wider ${isActive ? 'bg-blood-600/50 text-gold-200' : 'text-gold-400 hover:text-gold-200'}`;

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pb-16">
      <header className="py-6 text-center">
        <h1 className="text-3xl font-black tracking-[0.25em] text-gold-300 drop-shadow sm:text-5xl">CANELA QUEBRADA</h1>
        <p className="mt-1 font-body text-lg italic text-parch/70">Ranking Oficial da Liga</p>
        <div className="divider mx-auto mt-4 max-w-md" />
      </header>

      <nav className="panel mb-6 flex flex-wrap items-center justify-between gap-2 p-2">
        <button className="btn btn-ghost sm:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open}>☰ Menu</button>
        <ul className={`${open ? 'flex' : 'hidden'} w-full flex-col gap-1 sm:flex sm:w-auto sm:flex-row`}>
          {items.map((l) => (
            <li key={l.to}><NavLink to={l.to} end={l.to === '/'} className={cls} onClick={() => setOpen(false)}>{l.label}</NavLink></li>
          ))}
        </ul>
        {profile && (
          <div className="ml-auto flex items-center gap-2">
            <Avatar src={profile.avatar_url} name={profile.discord_name} />
            <span className="hidden font-ui text-sm text-gold-200 sm:inline">{profile.discord_name}</span>
            <button className="btn btn-ghost !px-2 !py-1 text-xs" onClick={() => void signOut()}>Sair</button>
          </div>
        )}
      </nav>
      <main><Outlet /></main>
    </div>
  );
}
