import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeRaw from "rehype-raw";
import { CodeBlock } from "@/components/code-block";
import { ImageFrame } from "@/components/image-lightbox";
import type { ComponentPropsWithoutRef } from "react";

/** Sanitize iframe src to only allow known video providers */
function isAllowedVideoSrc(src: string | undefined): boolean {
  if (!src) return false;
  try {
    const url = new URL(src);
    const allowed = [
      "youtube.com",
      "www.youtube.com",
      "youtube-nocookie.com",
      "www.youtube-nocookie.com",
      "player.vimeo.com",
      "vimeo.com",
      "www.loom.com",
      "loom.com",
      "fast.wistia.net",
    ];
    return allowed.some((d) => url.hostname === d || url.hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

function VideoEmbed({ src, title }: { src: string; title?: string }) {
  return (
    <div className="video-embed" style={{
      position: "relative",
      width: "100%",
      paddingBottom: "56.25%",
      marginBottom: "var(--space-6)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      background: "var(--bg-tertiary)",
    }}>
      <iframe
        src={src}
        title={title || "Video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          border: "none",
        }}
      />
    </div>
  );
}

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
    <div className="prose prose-zinc dark:prose-invert max-w-[70ch] prose-headings:scroll-mt-20 prose-code:before:content-none prose-code:after:content-none prose-code:bg-zinc-100 prose-code:dark:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypeRaw, { passThrough: ["element"] }],
          rehypeHighlight,
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
        ]}
        components={{
          pre: PreBlock,
          img: ({ src, alt }) => (
            <ImageFrame src={typeof src === "string" ? src : undefined} alt={typeof alt === "string" ? alt : undefined} />
          ),
          table: ({ children, ...props }) => (
            <div style={{ overflowX: "auto", marginBottom: "var(--space-4)" }}>
              <table {...props}>{children}</table>
            </div>
          ),
          iframe: ({ src, title, ...props }: ComponentPropsWithoutRef<"iframe">) => {
            const srcStr = typeof src === "string" ? src : undefined;
            if (!isAllowedVideoSrc(srcStr)) {
              return null;
            }
            return <VideoEmbed src={srcStr!} title={typeof title === "string" ? title : undefined} />;
          },
          video: ({ src, children, ...props }: ComponentPropsWithoutRef<"video">) => (
            <div style={{
              marginBottom: "var(--space-6)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              background: "var(--bg-tertiary)",
            }}>
              <video
                src={typeof src === "string" ? src : undefined}
                controls
                style={{ width: "100%", display: "block" }}
                {...props}
              >
                {children}
              </video>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
