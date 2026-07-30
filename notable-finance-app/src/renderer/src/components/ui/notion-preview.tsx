import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";

const EMOJI_RE = /^(\p{Emoji}\uFE0F?|\p{Emoji})(\s*)(.*)$/su;

function preprocess(md: string): string {
  let result = md;
  // Toggle blocks
  result = result.replace(
    /^- \[toggle\] (.+)$/gim,
    '<div class="np-toggle"><details><summary class="np-toggle-summary">$1</summary></details></div>'
  );
  // Child pages
  result = result.replace(
    /^# \[\[(.+)\]\]$/gm,
    '<div class="np-child-page"><span class="np-child-page-icon">📄</span> $1</div>'
  );
  // Breadcrumb
  result = result.replace(
    /^_Breadcrumb_$/gm,
    '<div class="np-breadcrumb">📎 Breadcrumb</div>'
  );
  // Table of Contents
  result = result.replace(
    /^_Table of Contents_$/gm,
    '<div class="np-toc">📋 Table of Contents</div>'
  );
  // Callouts
  result = result.replace(
    /^> (\p{Emoji}\uFE0F?|\p{Emoji})(.*)$/gmu,
    (_match, emoji, _ws, rest) => {
      const text = rest ?? "";
      return `<div class="np-callout"><span class="np-callout-icon">${emoji}</span><span class="np-callout-text">${text.trim()}</span></div>`;
    }
  );
  return result;
}

function NotionPreview({ markdown }: { markdown: string }) {
  const processed = useMemo(() => preprocess(markdown), [markdown]);

  const components: Partial<Components> = {
    h1: ({ children, ...rest }) => (
      <h1 className="np-h1" {...rest}>{children}</h1>
    ),
    h2: ({ children, ...rest }) => (
      <h2 className="np-h2" {...rest}>{children}</h2>
    ),
    h3: ({ children, ...rest }) => (
      <h3 className="np-h3" {...rest}>{children}</h3>
    ),
    p: ({ children, ...rest }) => (
      <p className="np-p" {...rest}>{children}</p>
    ),
    ul: ({ children, ...rest }) => (
      <ul className="np-ul" {...rest}>{children}</ul>
    ),
    ol: ({ children, ...rest }) => (
      <ol className="np-ol" {...rest}>{children}</ol>
    ),
    li: ({ children, ...rest }) => (
      <li className="np-li" {...rest}>{children}</li>
    ),
    blockquote: ({ children, ...rest }) => (
      <blockquote className="np-blockquote" {...rest}>{children}</blockquote>
    ),
    code: ({ className, children, ...rest }) => {
      if (!className) {
        return <code className="np-inline-code" {...rest}>{children}</code>;
      }
      return (
        <div className="np-code-block">
          <div className="np-code-lang">{className.replace("language-", "")}</div>
          <pre><code className={className} {...rest}>{children}</code></pre>
        </div>
      );
    },
    pre: ({ children, ...rest }) => <>{children}</>,
    table: ({ children, ...rest }) => (
      <div className="np-table-wrap">
        <table className="np-table" {...rest}>{children}</table>
      </div>
    ),
    thead: ({ children, ...rest }) => (
      <thead className="np-thead" {...rest}>{children}</thead>
    ),
    tbody: ({ children, ...rest }) => (
      <tbody className="np-tbody" {...rest}>{children}</tbody>
    ),
    tr: ({ children, ...rest }) => (
      <tr className="np-tr" {...rest}>{children}</tr>
    ),
    th: ({ children, ...rest }) => (
      <th className="np-th" {...rest}>{children}</th>
    ),
    td: ({ children, ...rest }) => (
      <td className="np-td" {...rest}>{children}</td>
    ),
    hr: ({ ...rest }) => <hr className="np-hr" {...rest} />,
    img: ({ alt, src, ...rest }) => (
      <img className="np-img" alt={alt ?? ""} src={src} loading="lazy" {...rest} />
    ),
    a: ({ href, children, ...rest }) => (
      <a className="np-link" href={href} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>
    ),
    input: ({ ...rest }) => (
      <input className="np-checkbox" type="checkbox" {...rest} />
    ),
  };

  return (
    <div className="notion-preview">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}

export { NotionPreview };
