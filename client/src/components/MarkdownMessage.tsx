import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownMessageProps {
  content: string;
  className?: string;
  isUser?: boolean;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({
  content,
  className = '',
  isUser = false,
}) => {
  if (isUser) {
    // For user messages, keep styling simple and high contrast on dark background
    return <div className={`whitespace-pre-wrap ${className}`}>{content}</div>;
  }

  return (
    <div className={`markdown-content text-[14px] leading-relaxed text-neutral-800 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-4 mb-2.5 pb-1 border-b border-neutral-200/80 text-lg font-bold tracking-tight text-neutral-950 font-heading">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-4 mb-2 text-base font-bold tracking-tight text-neutral-950 font-heading">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-3.5 mb-1.5 text-xs font-bold uppercase tracking-wider text-neutral-900 font-mono">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-3 mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-700 font-mono">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 leading-relaxed text-[14px] text-neutral-800 font-body">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 pl-5 list-disc space-y-1.5 text-[14px] leading-relaxed text-neutral-800 font-body">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 pl-5 list-decimal space-y-1.5 text-[14px] leading-relaxed text-neutral-800 font-body">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-neutral-950">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-neutral-800">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="my-2.5 border-l-2 border-neutral-300 pl-3.5 italic text-neutral-600">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-3.5 overflow-x-auto rounded-lg border border-neutral-200/90 bg-white shadow-2xs">
              <table className="min-w-full divide-y divide-neutral-200 text-left text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-neutral-50/90 font-mono text-[11px] font-semibold uppercase tracking-wider text-neutral-700">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-neutral-100 bg-white text-neutral-800">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="transition-colors hover:bg-neutral-50/50">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 font-semibold text-[11px] border-b border-neutral-200 text-neutral-700 font-mono">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2 text-neutral-700 font-normal align-top leading-relaxed text-[13px]">
              {children}
            </td>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const match = /language-(\w+)/.exec(codeClassName || '');
            const isInline = !codeClassName && !match;

            if (isInline) {
              return (
                <code
                  className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[12px] font-medium text-neutral-900 border border-neutral-200/80"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <pre className="my-3 overflow-x-auto rounded-lg bg-neutral-900 p-3.5 text-xs text-neutral-100 font-mono shadow-2xs">
                <code className={codeClassName} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          hr: () => <hr className="my-4 border-neutral-200" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
