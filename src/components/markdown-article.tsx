import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Markdown only: embedded HTML is deliberately not parsed or rendered. */
export function MarkdownArticle({ source }: { source: string }) {
  return <div className="space-y-6 text-[15px] leading-8 text-[#494641] sm:text-base">
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
      h1: ({ children }) => <h2 className="display-serif mb-4 mt-10 text-4xl leading-tight text-[#262522]">{children}</h2>,
      h2: ({ children }) => <h2 className="display-serif mb-4 mt-10 text-3xl leading-tight text-[#262522]">{children}</h2>,
      h3: ({ children }) => <h3 className="mb-3 mt-8 text-xl font-medium text-[#262522]">{children}</h3>,
      p: ({ children }) => <p className="my-5 leading-[1.95]">{children}</p>,
      a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="border-b border-[#867364] text-[#645041]">{children}</a>,
      blockquote: ({ children }) => <blockquote className="my-8 border-l-2 border-[#c3b5a6] py-1 pl-6 italic text-[#6b6056]">{children}</blockquote>,
      ul: ({ children }) => <ul className="my-6 list-disc space-y-2 pl-7">{children}</ul>,
      ol: ({ children }) => <ol className="my-6 list-decimal space-y-2 pl-7">{children}</ol>,
      img: ({ src, alt }) => <span className="my-8 block overflow-hidden bg-[#eee9e4]"><img src={typeof src === 'string' ? src : ''} alt={alt || ''} loading="lazy" className="h-auto w-full"/></span>,
      hr: () => <hr className="my-10 border-black/10" />,
      code: ({ children }) => <code className="rounded-sm bg-[#f2eee8] px-1.5 py-1 text-[.9em]">{children}</code>,
      table: ({ children }) => <div className="my-8 overflow-x-auto"><table className="w-full border-collapse text-sm">{children}</table></div>,
      th: ({ children }) => <th className="border-b border-black/20 p-3 text-left">{children}</th>,
      td: ({ children }) => <td className="border-b border-black/10 p-3">{children}</td>,
    }}>{source}</ReactMarkdown>
  </div>;
}
