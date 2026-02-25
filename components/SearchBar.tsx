"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
}

export default function SearchBar({
  placeholder = "Pesquisar...",
  onSearch,
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch(query);
  }

  function handleClear() {
    setQuery("");
    onSearch("");
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <Search size={18} className="search-icon" />
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
        }}
      />
      {query && (
        <button
          type="button"
          className="search-clear"
          onClick={handleClear}
          aria-label="Limpar pesquisa"
        >
          <X size={16} />
        </button>
      )}
      <button type="submit" className="btn btn-primary btn-sm">
        Buscar
      </button>
    </form>
  );
}
