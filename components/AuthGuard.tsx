"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import Sidebar from "./Sidebar";
import Loading from "./Loading";

/**
 * AuthGuard lida com 2 coisas:
 * 1. Redireciona usuários autenticados que acessam /login para /livros
 * 2. Bloqueia rotas administrativas para usuários anônimos
 * 3. Renderiza layout com menu superior para páginas públicas e admin
 */
export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const isAdminRoute =
    pathname === "/autores" ||
    pathname === "/categorias" ||
    pathname === "/livros/novo" ||
    /^\/livros\/\d+\/editar$/.test(pathname);

  useEffect(() => {
    if (loading) return;

    if (session && isLoginPage) {
      router.replace("/livros");
      return;
    }

    if (!session && !isLoginPage && isAdminRoute) {
      router.replace("/login");
    }
  }, [session, loading, isLoginPage, isAdminRoute, router]);

  // Mostra loading enquanto verifica a sessão
  if (loading) {
    return (
      <div className="auth-loading">
        <Loading />
      </div>
    );
  }

  // Página de login — sem menu superior
  if (isLoginPage) {
    if (session) return null; // redirecionando
    return <>{children}</>;
  }

  // Redirecionando anônimo para rota protegida
  if (!session && isAdminRoute) {
    return (
      <div className="auth-loading">
        <Loading />
      </div>
    );
  }

  // Layout padrão (público/admin) com menu superior
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}
