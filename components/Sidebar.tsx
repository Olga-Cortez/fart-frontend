"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Users, Tags, Home, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/lib/authContext";

const publicNavItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/livros", label: "Livros", icon: BookOpen },
];

const adminNavItems = [
  ...publicNavItems,
  { href: "/autores", label: "Autores", icon: Users },
  { href: "/categorias", label: "Categorias", icon: Tags },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const navItems = user ? adminNavItems : publicNavItems;

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <Link href="/" className="top-nav-brand" aria-label="Ir para início">
        <BookOpen size={28} />
        <h1>Biblioteca</h1>
        </Link>
      <nav className="top-nav-links">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive ? "active" : ""}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="top-nav-actions">
        {user && (
          <span className="top-nav-user-email" title={user.email}>
            {user.email}
          </span>
        )}

        {user ? (
          <button
            type="button"
            className="btn-logout"
            onClick={signOut}
            aria-label="Sair"
          >
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        ) : (
          <Link href="/login" className="btn btn-secondary btn-sm">
            <LogIn size={16} />
            <span>Entrar</span>
          </Link>
        )}
      </div>
      </div>
    </header>
  );
}
