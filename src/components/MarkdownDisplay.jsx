import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

const MarkdownDisplay = ({ content }) => {
  const customComponents = {
    h1: ({ node, ...props }) => (
      <h1 className="text-3xl font-bold text-sql-blue-light mb-4 mt-6 border-b-2 border-sql-blue-light pb-3" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-2xl font-bold text-sql-blue-light mb-3 mt-5 border-b border-sql-blue-light/50 pb-2" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="text-xl font-semibold text-white mb-2 mt-4" {...props} />
    ),
    p: ({ node, ...props }) => (
      <p className="text-white/90 mb-3 leading-relaxed text-base" {...props} />
    ),
    ul: ({ node, ...props }) => (
      <ul className="list-disc list-inside text-white/90 mb-4 space-y-2" {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className="list-decimal list-inside text-white/90 mb-4 space-y-2" {...props} />
    ),
    li: ({ node, ...props }) => (
      <li className="text-white/90 ml-2" {...props} />
    ),
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "sql";

      if (inline) {
        return (
          <code
            className="bg-white/10 text-sql-blue-light px-2 py-1 rounded font-mono text-sm"
            {...props}
          >
            {children}
          </code>
        );
      }

      return (
        <div className="my-4 rounded-lg overflow-hidden border border-white/10">
          <SyntaxHighlighter
            language={language}
            style={dracula}
            customStyle={{
              margin: 0,
              padding: "16px",
              fontSize: "12px",
              lineHeight: "1.5",
            }}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        </div>
      );
    },
    blockquote: ({ node, ...props }) => (
      <blockquote
        className="border-l-4 border-sql-blue-light bg-sql-blue-light/10 pl-4 py-2 my-4 text-white/80 italic"
        {...props}
      />
    ),
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto my-4 rounded-lg border border-white/10">
        <table className="w-full text-xs text-white" {...props} />
      </div>
    ),
    thead: ({ node, ...props }) => (
      <thead className="bg-sql-blue-light/20 border-b border-white/10" {...props} />
    ),
    tbody: ({ node, ...props }) => (
      <tbody className="divide-y divide-white/10" {...props} />
    ),
    tr: ({ node, ...props }) => (
      <tr className="hover:bg-white/5 transition-colors" {...props} />
    ),
    th: ({ node, ...props }) => (
      <th className="px-4 py-2 text-left font-semibold text-sql-blue-light" {...props} />
    ),
    td: ({ node, ...props }) => (
      <td className="px-4 py-2 text-white/80" {...props} />
    ),
    strong: ({ node, ...props }) => (
      <strong className="font-bold text-sql-blue-light" {...props} />
    ),
    em: ({ node, ...props }) => (
      <em className="italic text-white/80" {...props} />
    ),
  };

  return (
    <div className="prose prose-invert max-w-none text-white prose-headings:text-white prose-a:text-sql-blue-light">
      <ReactMarkdown
        components={customComponents}
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownDisplay;
