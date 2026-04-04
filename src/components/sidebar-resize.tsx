"use client";

import { useCallback, useRef, useEffect, useState } from "react";

export function SidebarResize() {
  const [width, setWidth] = useState<number | null>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  useEffect(() => {
    // Load saved width from localStorage
    const saved = localStorage.getItem("sidebar-width");
    if (saved) {
      const w = parseInt(saved);
      if (w >= 180 && w <= 500) {
        setWidth(w);
        document.documentElement.style.setProperty("--sidebar-width", `${w}px`);
      }
    }
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;
    const sidebar = document.querySelector(".desktop-sidebar") as HTMLElement;
    startWidth.current = sidebar?.offsetWidth || 260;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.min(500, Math.max(180, startWidth.current + delta));
      setWidth(newWidth);
      document.documentElement.style.setProperty("--sidebar-width", `${newWidth}px`);
    }

    function onMouseUp() {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      // Save to localStorage
      const current = getComputedStyle(document.documentElement).getPropertyValue("--sidebar-width").trim();
      localStorage.setItem("sidebar-width", parseInt(current).toString());
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <>
      <div
        className="sidebar-resize-handle"
        onMouseDown={onMouseDown}
        title="Drag to resize sidebar"
      />
      <style>{`
        .sidebar-resize-handle {
          position: fixed;
          top: 52px;
          width: 6px;
          height: calc(100vh - 52px);
          cursor: col-resize;
          z-index: 10;
          transition: background 0.15s;
          left: calc(var(--sidebar-width) - 3px);
        }
        .sidebar-resize-handle:hover,
        .sidebar-resize-handle:active {
          background: var(--accent-primary);
          opacity: 0.4;
        }
      `}</style>
    </>
  );
}
