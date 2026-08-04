import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";
import styles from "./notion-preview.module.css";

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
    (_match, emoji, rest) => {
      const text = (rest ?? "").trim();
      return `<div class="np-callout"><span class="np-callout-icon">${emoji}</span><span class="np-callout-text">${text}</span></div>`;
    }
  );
  return result;
}

function NotionPreview({ markdown }: { markdown: string }) {
  const processed = useMemo(() => preprocess(markdown), [markdown]);

  const components: Partial<Components> = {
    h1: ({ children, ...rest }) => (
      <h1 className={styles["np-h1"]} {...rest}>{children}</h1>
    ),
    h2: ({ children, ...rest }) => (
      <h2 className={styles["np-h2"]} {...rest}>{children}</h2>
    ),
    h3: ({ children, ...rest }) => (
      <h3 className={styles["np-h3"]} {...rest}>{children}</h3>
    ),
    p: ({ children, ...rest }) => (
      <p className={styles["np-p"]} {...rest}>{children}</p>
    ),
    ul: ({ children, ...rest }) => (
      <ul className={styles["np-ul"]} {...rest}>{children}</ul>
    ),
    ol: ({ children, ...rest }) => (
      <ol className={styles["np-ol"]} {...rest}>{children}</ol>
    ),
    li: ({ children, ...rest }) => (
      <li className={styles["np-li"]} {...rest}>{children}</li>
    ),
    blockquote: ({ children, ...rest }) => (
      <blockquote className={styles["np-blockquote"]} {...rest}>{children}</blockquote>
    ),
    code: ({ className, children, ...rest }) => {
      if (!className) {
        return <code className={styles["np-inline-code"]} {...rest}>{children}</code>;
      }
      return (
        <div className={styles["np-code-block"]}>
          <div className={styles["np-code-lang"]}>{className.replace("language-", "")}</div>
          <pre><code className={className} {...rest}>{children}</code></pre>
        </div>
      );
    },
    // react-markdown injects standard HTML attrs (node, key, …) into every renderer;
    // destructuring them out here just discards the ones this override doesn't forward.
    pre: ({ children, ..._rest }) => <>{children}</>,
    table: ({ children, ...rest }) => (
      <div className={styles["np-table-wrap"]}>
        <table className={styles["np-table"]} {...rest}>{children}</table>
      </div>
    ),
    thead: ({ children, ...rest }) => (
      <thead className="np-thead" {...rest}>{children}</thead>
    ),
    tbody: ({ children, ...rest }) => (
      <tbody className="np-tbody" {...rest}>{children}</tbody>
    ),
    tr: ({ children, ...rest }) => (
      <tr className={styles["np-tr"]} {...rest}>{children}</tr>
    ),
    th: ({ children, ...rest }) => (
      <th className={styles["np-th"]} {...rest}>{children}</th>
    ),
    td: ({ children, ...rest }) => (
      <td className={styles["np-td"]} {...rest}>{children}</td>
    ),
    hr: ({ ...rest }) => <hr className={styles["np-hr"]} {...rest} />,
    img: ({ alt, src, ...rest }) => (
      <img className={styles["np-img"]} alt={alt ?? ""} src={src} loading="lazy" {...rest} />
    ),
    a: ({ href, children, ...rest }) => (
      <a className={styles["np-link"]} href={href} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>
    ),
    input: ({ ...rest }) => (
      <input className={styles["np-checkbox"]} type="checkbox" {...rest} />
    ),
  };

  return (
    <div className={styles["notion-preview"]}>
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
