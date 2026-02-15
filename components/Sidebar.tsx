"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Users, Tags, Home } from "lucide-react";

const navItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/livros", label: "Livros", icon: BookOpen },
  { href: "/autores", label: "Autores", icon: Users },
  { href: "/categorias", label: "Categorias", icon: Tags },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <BookOpen size={28} />
        <h1>Biblioteca</h1>
      </div>
      <nav className="sidebar-nav">
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
    </aside>
  );
}
