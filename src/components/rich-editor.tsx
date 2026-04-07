"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { common, createLowlight } from "lowlight";
import { useCallback, useEffect, useRef, useState } from "react";
import TurndownService from "turndown";
import Showdown from "showdown";

const lowlight = createLowlight(common);

// --- Markdown <-> HTML conversion ---

const showdownConverter = new Showdown.Converter({
  tables: true,
  ghCodeBlocks: true,
  tasklists: true,
  strikethrough: true,
  simpleLineBreaks: false,
  openLinksInNewWindow: false,
  literalMidWordUnderscores: true,
  simplifiedAutoLink: true,
  parseImgDimensions: true,
  backslashEscapesHTMLTags: false,
});

function markdownToHtml(md: string): string {
  // Showdown may strip style attributes from HTML img tags.
  // Pre-process: temporarily protect <img> tags with style attributes.
  let processed = md;
  const imgMap: Record<string, string> = {};
  let idx = 0;
  processed = processed.replace(/<img\s[^>]*style="[^"]*"[^>]*\/?>/gi, (match) => {
    const key = `__IMG_PRESERVE_${idx++}__`;
    imgMap[key] = match;
    return key;
  });

  let html = showdownConverter.makeHtml(processed);

  // Restore preserved img tags
  for (const [key, original] of Object.entries(imgMap)) {
    html = html.replace(key, original);
  }

  return html;
}

function htmlToMarkdown(html: string): string {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*",
    strongDelimiter: "**",
  });

  // GFM table support
  td.addRule("tableCell", {
    filter: ["th", "td"],
    replacement(content, node) {
      return ` ${content.trim().replace(/\n/g, " ")} |`;
    },
  });
  td.addRule("tableRow", {
    filter: "tr",
    replacement(content, node) {
      return `|${content}\n`;
    },
  });
  td.addRule("table", {
    filter: "table",
    replacement(content, node) {
      const rows = content.trim().split("\n").filter(Boolean);
      if (rows.length === 0) return "";
      const headerRow = rows[0];
      const cols = (headerRow.match(/\|/g) || []).length - 1;
      const separator = "|" + " --- |".repeat(cols);
      return "\n\n" + rows[0] + "\n" + separator + "\n" + rows.slice(1).join("\n") + "\n\n";
    },
  });
  td.addRule("thead", {
    filter: "thead",
    replacement(content) {
      return content;
    },
  });
  td.addRule("tbody", {
    filter: "tbody",
    replacement(content) {
      return content;
    },
  });

  // Strikethrough
  td.addRule("strikethrough", {
    filter: (node) =>
      node.nodeName === "S" ||
      node.nodeName === "DEL" ||
      (node.nodeName === "SPAN" &&
        (node as HTMLElement).style.textDecoration === "line-through"),
    replacement(content) {
      return `~~${content}~~`;
    },
  });

  // Highlight/mark
  td.addRule("highlight", {
    filter: "mark",
    replacement(content) {
      return `==${content}==`;
    },
  });

  // Underline — just pass through the text (no markdown equivalent)
  td.addRule("underline", {
    filter: "u",
    replacement(content) {
      return content;
    },
  });

  // Images with width — preserve as HTML img tag so width persists
  td.addRule("imageWithWidth", {
    filter: (node) => {
      if (node.nodeName !== "IMG") return false;
      const el = node as HTMLElement;
      return !!(el.style.width || el.getAttribute("data-width"));
    },
    replacement(_content, node) {
      const el = node as HTMLImageElement;
      const src = el.getAttribute("src") || "";
      const alt = el.getAttribute("alt") || "";
      const width = el.style.width || el.getAttribute("data-width") || "";
      return `<img src="${src}" alt="${alt}" style="width: ${width}; height: auto;" />`;
    },
  });

  return td.turndown(html);
}

// --- Code language selector data ---
const CODE_LANGUAGES = [
  { value: "", label: "Plain text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "json", label: "JSON" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "bash", label: "Bash" },
  { value: "sql", label: "SQL" },
  { value: "yaml", label: "YAML" },
  { value: "xml", label: "XML" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
];

// --- Toolbar button component ---
function ToolbarButton({
  onClick,
  active = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "30px",
        height: "30px",
        borderRadius: "var(--radius-sm)",
        border: "none",
        background: active ? "var(--accent-primary)" : "transparent",
        color: active ? "#fff" : disabled ? "var(--text-disabled)" : "var(--text-secondary)",
        cursor: disabled ? "default" : "pointer",
        transition: "background 0.1s, color 0.1s",
        fontSize: "13px",
        fontWeight: 600,
        fontFamily: "var(--font-geist-mono), monospace",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <div
      style={{
        width: "1px",
        height: "20px",
        background: "var(--border-primary)",
        margin: "0 4px",
        flexShrink: 0,
      }}
    />
  );
}

// --- SVG Icons ---
function BoldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  );
}

function UnderlineIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </svg>
  );
}

function StrikethroughIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4H9a3 3 0 0 0-3 3c0 2 1 3 3 3h6" />
      <path d="M8 20h7a3 3 0 0 0 3-3c0-2-1-3-3-3H5" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function ListBulletIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function ListOrderedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <path d="M4 6h1v4" />
      <path d="M4 10h2" />
      <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z" />
    </svg>
  );
}

function HrIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

function AlignLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="17" y1="10" x2="3" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="17" y1="18" x2="3" y2="18" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="10" x2="6" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="18" y1="18" x2="6" y2="18" />
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="21" y1="10" x2="7" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="21" y1="18" x2="7" y2="18" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function HighlightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 11-6 6v3h9l3-3" />
      <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
    </svg>
  );
}

// --- Image Properties Dialog ---

function ImagePropertiesDialog({
  src,
  alt,
  currentWidth,
  onApply,
  onClose,
}: {
  src: string;
  alt: string;
  currentWidth: string;
  onApply: (alt: string, width: string) => void;
  onClose: () => void;
}) {
  const [editAlt, setEditAlt] = useState(alt);
  const [editWidth, setEditWidth] = useState(currentWidth || "100%");

  return (
    <div
      className="image-props-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        className="image-props-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-primary)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
          minWidth: "360px",
          maxWidth: "480px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        }}
      >
        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "var(--text-primary)" }}>
          Image Properties
        </h3>

        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "var(--text-tertiary)", marginBottom: "4px" }}>
            Source
          </label>
          <input
            readOnly
            value={src}
            style={{
              width: "100%",
              padding: "6px 8px",
              fontSize: "12px",
              fontFamily: "var(--font-geist-mono), monospace",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-primary)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-tertiary)",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "var(--text-tertiary)", marginBottom: "4px" }}>
            Alt text
          </label>
          <input
            value={editAlt}
            onChange={(e) => setEditAlt(e.target.value)}
            placeholder="Describe the image..."
            style={{
              width: "100%",
              padding: "6px 8px",
              fontSize: "13px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-primary)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-primary)",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "var(--text-tertiary)", marginBottom: "8px" }}>
            Width
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            {["25%", "50%", "75%", "100%"].map((w) => (
              <button
                key={w}
                onClick={() => setEditWidth(w)}
                style={{
                  flex: 1,
                  padding: "6px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-primary)",
                  background: editWidth === w ? "var(--accent-primary)" : "var(--bg-surface)",
                  color: editWidth === w ? "#fff" : "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500,
                  transition: "all 0.1s",
                }}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "6px 16px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-primary)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onApply(editAlt, editWidth)}
            style={{
              padding: "6px 16px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: "var(--accent-primary)",
              color: "#fff",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Editor Component ---

interface RichEditorProps {
  initialContent: string; // markdown
  onChange: (markdown: string) => void;
  onSave?: () => void;
}

export function RichEditor({ initialContent, onChange, onSave }: RichEditorProps) {
  const isUpdatingRef = useRef(false);
  const initialHtml = useRef(markdownToHtml(initialContent));
  const [imageDialog, setImageDialog] = useState<{ src: string; alt: string; width: string } | null>(null);
  // Flush any DOM-only image widths into the markdown state
  const flushDomWidths = useCallback(() => {
    const ed = editorRef?.current;
    if (!ed) return;
    const html = ed.getHTML();
    const container = document.createElement("div");
    container.innerHTML = html;
    const liveImgs = document.querySelectorAll(".ProseMirror img");
    const htmlImgs = container.querySelectorAll("img");
    liveImgs.forEach((liveImg, i) => {
      const w = (liveImg as HTMLElement).style.width;
      if (w && htmlImgs[i]) {
        (htmlImgs[i] as HTMLElement).style.width = w;
        (htmlImgs[i] as HTMLElement).style.height = "auto";
      }
    });
    const md = htmlToMarkdown(container.innerHTML);
    onChange(md);
  }, [onChange]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false, // we use CodeBlockLowlight instead
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "editor-image",
        },
        allowBase64: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          spellcheck: "false",
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: {
          style: "width: 100%;",
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialHtml.current,
    onUpdate: ({ editor: ed }) => {
      if (isUpdatingRef.current) return;
      // Get HTML from Tiptap, then merge any DOM-only image widths
      const html = ed.getHTML();
      const container = document.createElement("div");
      container.innerHTML = html;
      // Check live DOM for resized images and inject their widths into the HTML copy
      const liveImgs = document.querySelectorAll(".ProseMirror img");
      const htmlImgs = container.querySelectorAll("img");
      liveImgs.forEach((liveImg, i) => {
        const w = (liveImg as HTMLElement).style.width;
        if (w && htmlImgs[i]) {
          (htmlImgs[i] as HTMLElement).style.width = w;
          (htmlImgs[i] as HTMLElement).style.height = "auto";
        }
      });
      const md = htmlToMarkdown(container.innerHTML);
      onChange(md);
    },
    editorProps: {
      handleKeyDown: (_view, event) => {
        // Cmd+S to save
        if ((event.metaKey || event.ctrlKey) && event.key === "s") {
          event.preventDefault();
          flushDomWidths();
          // Small delay so onChange propagates before save
          setTimeout(() => onSave?.(), 50);
          return true;
        }
        // Cmd+K to insert link
        if ((event.metaKey || event.ctrlKey) && event.key === "k") {
          event.preventDefault();
          insertLink();
          return true;
        }
        // Cmd+Shift+H to highlight
        if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === "H") {
          event.preventDefault();
          editorRef.current?.chain().focus().toggleHighlight().run();
          return true;
        }
        return false;
      },
    },
  });

  const editorRef = useRef(editor);
  editorRef.current = editor;

  // Double-click on image opens properties dialog
  useEffect(() => {
    function handleDblClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG" && target.closest(".ProseMirror")) {
        const imgEl = target as HTMLImageElement;
        setImageDialog({
          src: imgEl.src,
          alt: imgEl.alt || "",
          width: imgEl.style.width || "100%",
        });
      }
    }
    document.addEventListener("click", handleDblClick);
    return () => document.removeEventListener("click", handleDblClick);
  }, []);

  const handleImageApply = useCallback(
    (alt: string, width: string) => {
      if (!imageDialog) return;

      // Only modify the DOM — no onChange, no setContent, no re-renders.
      // The width will be captured by onUpdate when user makes any other edit,
      // or by the save flow which reads the live DOM.
      const proseMirror = document.querySelector(".ProseMirror");
      if (proseMirror) {
        const img = proseMirror.querySelector(`img[src="${CSS.escape(imageDialog.src)}"]`) as HTMLImageElement;
        if (img) {
          img.alt = alt;
          if (width && width !== "100%") {
            img.style.width = width;
            img.style.height = "auto";
          } else {
            img.style.removeProperty("width");
            img.style.removeProperty("height");
          }
        }
      }

      setImageDialog(null);
    },
    [imageDialog],
  );

  // Update editor content when initialContent changes externally (e.g., loading a doc)
  useEffect(() => {
    if (!editor) return;
    const newHtml = markdownToHtml(initialContent);
    if (newHtml !== initialHtml.current) {
      isUpdatingRef.current = true;
      initialHtml.current = newHtml;
      editor.commands.setContent(newHtml);
      isUpdatingRef.current = false;
    }
  }, [initialContent, editor]);

  const insertLink = useCallback(() => {
    if (!editorRef.current) return;
    const ed = editorRef.current;
    const previousUrl = ed.getAttributes("link").href || "";
    const url = window.prompt("Link URL:", previousUrl);
    if (url === null) return; // cancelled
    if (url === "") {
      ed.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    ed.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, []);

  const insertImage = useCallback(() => {
    if (!editorRef.current) return;
    const url = window.prompt("Image URL:");
    if (!url) return;
    editorRef.current.chain().focus().setImage({ src: url }).run();
  }, []);

  const insertTable = useCallback(() => {
    if (!editorRef.current) return;
    editorRef.current.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, []);

  if (!editor) return null;

  return (
    <div className="tiptap-editor" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {/* Toolbar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "2px",
          padding: "6px 12px",
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-primary)",
        }}
      >
        {/* Undo / Redo */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Cmd+Z)">
          <UndoIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Cmd+Shift+Z)">
          <RedoIcon />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Headings */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
          H1
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
          H2
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
          H3
        </ToolbarButton>

        <ToolbarDivider />

        {/* Text formatting */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (Cmd+B)">
          <BoldIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (Cmd+I)">
          <ItalicIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline (Cmd+U)">
          <UnderlineIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
          <StrikethroughIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
          <CodeIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="Highlight (Cmd+Shift+H)">
          <HighlightIcon />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
          <ListBulletIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
          <ListOrderedIcon />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Block elements */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
          <QuoteIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block">
          <span style={{ fontSize: "11px" }}>{"{}"}</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
          <HrIcon />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Link / Image / Table */}
        <ToolbarButton onClick={insertLink} active={editor.isActive("link")} title="Insert link (Cmd+K)">
          <LinkIcon />
        </ToolbarButton>
        <ToolbarButton onClick={insertImage} title="Insert image">
          <ImageIcon />
        </ToolbarButton>
        <ToolbarButton onClick={insertTable} title="Insert table">
          <TableIcon />
        </ToolbarButton>

        {/* Table sub-controls (visible when in a table) */}
        {editor.isActive("table") && (
          <>
            <ToolbarDivider />
            <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add column">
              <span style={{ fontSize: "10px" }}>+Col</span>
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Add row">
              <span style={{ fontSize: "10px" }}>+Row</span>
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete column">
              <span style={{ fontSize: "10px", color: "#ef4444" }}>-Col</span>
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().deleteRow().run()} title="Delete row">
              <span style={{ fontSize: "10px", color: "#ef4444" }}>-Row</span>
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} title="Delete table">
              <span style={{ fontSize: "10px", color: "#ef4444" }}>Del</span>
            </ToolbarButton>
          </>
        )}

        {/* Code block language selector (visible when in code block) */}
        {editor.isActive("codeBlock") && (
          <>
            <ToolbarDivider />
            <select
              value={editor.getAttributes("codeBlock").language || ""}
              onChange={(e) =>
                editor.chain().focus().updateAttributes("codeBlock", { language: e.target.value || null }).run()
              }
              style={{
                height: "30px",
                padding: "0 6px",
                fontSize: "11px",
                fontFamily: "var(--font-geist-mono), monospace",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-primary)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-secondary)",
                outline: "none",
              }}
              title="Code language"
            >
              {CODE_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </>
        )}

        <ToolbarDivider />

        {/* Text alignment */}
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align left">
          <AlignLeftIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align center">
          <AlignCenterIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align right">
          <AlignRightIcon />
        </ToolbarButton>
      </div>

      {/* Editor content area */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "var(--space-6)",
          background: "var(--bg-primary)",
        }}
      >
        <div style={{ maxWidth: "70ch", margin: "0 auto" }}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {imageDialog && (
        <ImagePropertiesDialog
          src={imageDialog.src}
          alt={imageDialog.alt}
          currentWidth={imageDialog.width}
          onApply={handleImageApply}
          onClose={() => setImageDialog(null)}
        />
      )}

      <style>{`
        .editor-image {
          max-width: 100%;
          height: auto;
          border-radius: var(--radius-md);
          cursor: pointer;
        }
        .editor-image.ProseMirror-selectednode {
          outline: 2px solid var(--accent-primary);
          outline-offset: 2px;
        }
      `}</style>

    </div>
  );
}
