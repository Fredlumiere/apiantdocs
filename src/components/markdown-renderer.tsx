import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { CodeBlock } from "@/components/code-block";
import type { ComponentPropsWithoutRef } from "react";

function PreBlock({ children, ...props }: ComponentPropsWithoutRef<"pre">) {
  // Check if children is a <code> element with a language class
  if (
    children &&
    typeof children === "object" &&
    "props" in children &&
    children.props
  ) {
    const codeProps = children.props as {
      className?: string;
      children?: React.ReactNode;
    };
    const className = codeProps.className || "";
    const match = className.match(/language-(\w+)/);
    const language = match ? match[1] : null;

    return (
      <CodeBlock language={language}>
        <code {...props} className={className}>
          {codeProps.children}
        </code>
      </CodeBlock>
    );
  }

  // Fallback for pre blocks without a code child
  return (
    <CodeBlock language={null}>
      <code>{children}</code>
    </CodeBlock>
  );
}

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-code:before:content-none prose-code:after:content-none prose-code:bg-zinc-100 prose-code:dark:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeHighlight,
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
        ]}
        components={{
          pre: PreBlock,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
