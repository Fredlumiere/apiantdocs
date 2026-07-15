interface ProductCtaProps {
  /** Marketing page on apiant.com. Comes from documents.metadata.product_url. */
  href: string;
  title: string;
  description?: string | null;
  /** Override for the button copy, from documents.metadata.product_cta_label. */
  label?: string | null;
}

export function ProductCta({ href, title, description, label }: ProductCtaProps) {
  return (
    <aside className="product-cta">
      <span className="product-cta-eyebrow">Powered by APIANT</span>
      <h2 className="product-cta-title">{title}</h2>
      {description && <p className="product-cta-desc">{description}</p>}
      <a
        className="product-cta-button"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {label || "Learn more about the product"}
        <span aria-hidden="true">→</span>
      </a>

      <style>{`
        .product-cta {
          position: relative;
          margin-top: var(--space-8);
          padding: var(--space-6);
          padding-left: calc(var(--space-6) + 4px);
          border: 1px solid rgba(192, 132, 252, 0.35);
          border-radius: var(--radius-md);
          background: linear-gradient(
            135deg,
            rgba(192, 132, 252, 0.10) 0%,
            rgba(192, 132, 252, 0.03) 100%
          );
          overflow: hidden;
        }
        .product-cta::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: 4px;
          background: var(--accent-purple);
        }
        .product-cta-eyebrow {
          display: block;
          font-family: var(--font-geist-mono), monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--accent-purple);
        }
        .product-cta-title {
          margin: var(--space-3) 0 0 0;
          font-size: 20px;
          font-weight: 600;
          line-height: 1.3;
          color: var(--text-primary);
        }
        .product-cta-desc {
          margin: var(--space-2) 0 0 0;
          font-size: 15px;
          line-height: 1.55;
          color: var(--text-secondary);
        }
        .product-cta-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: var(--space-5);
          padding: 10px 18px;
          border-radius: var(--radius-sm);
          background: var(--accent-purple);
          color: #1a0b2e;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.15s, transform 0.15s;
        }
        .product-cta-button:hover {
          background: #d8b4fe;
          color: #1a0b2e;
          transform: translateY(-1px);
        }
        .product-cta-button:focus-visible {
          outline: 2px solid var(--accent-purple);
          outline-offset: 2px;
        }
      `}</style>
    </aside>
  );
}
