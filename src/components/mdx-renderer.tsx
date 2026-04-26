import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import {
  SkillCard,
  SkillGrid,
  WorkflowSection,
  ToolCard,
  CategoryIcon,
  CardGlyph,
  Callout,
  CardDetailProvider,
} from "./gallery";

// Server component. Compiles MDX at request time (cached by the surrounding
// page's ISR window) and renders it with the gallery components in scope.
export async function MdxRenderer({ content }: { content: string })
{
  const { content: rendered } = await compileMDX({
    source: content,
    components: {
      SkillCard,
      SkillGrid,
      WorkflowSection,
      ToolCard,
      CategoryIcon,
      CardGlyph,
      Callout,
    },
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
      },
    },
  });

  return <CardDetailProvider>{rendered}</CardDetailProvider>;
}
