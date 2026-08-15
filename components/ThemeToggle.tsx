"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = document.documentElement.getAttribute("data-theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("mz-theme", next);
  }

  return (
    <button className="icon-btn" type="button" onClick={toggle} title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}>
      {theme === "dark" ? "○" : "●"}
    </button>
  );
}
