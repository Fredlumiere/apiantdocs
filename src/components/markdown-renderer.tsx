import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

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
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
