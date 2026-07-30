// Markdown ⇆ Notion blocks converter for Page Content editing.
//
// Notion stores a page body as ordered block children. We present that to the user as
// Markdown (chosen format) and translate back on save. Covers paragraphs, headings (1–3),
// lists (bulleted, numbered, to-do), toggle, quote, callout (with emoji), code, divider,
// table, image, video, file, bookmark, embed, equation, child_page, breadcrumb,
// table_of_contents, and inline formatting (bold, italic, strikethrough, code, links).
// Unsupported block types degrade to their plain text on read; unknown Markdown lines
// become paragraphs on write. Notion-only blocks (synced_block, column_list, template)
// are unwrapped / skipped on read. Full round-trip fidelity is not guaranteed.

type RichText = {
  type: 'text'
  text: { content: string; link?: { url: string } | null }
  annotations?: Partial<{
    bold: boolean
    italic: boolean
    strikethrough: boolean
    underline: boolean
    code: boolean
    color: string
  }>
  plain_text?: string
  href?: string | null
}

type Block = Record<string, unknown>

// ── Helpers ──────────────────────────────────────────────────────────────────

function richTextToMarkdown(rich: RichText[] | undefined): string {
  if (!rich || rich.length === 0) return ''
  return rich
    .map((rt) => {
      let text = rt.plain_text ?? rt.text?.content ?? ''
      if (!text) return ''
      const a = rt.annotations ?? {}
      if (a.code) text = '`' + text + '`'
      if (a.bold) text = `**${text}**`
      if (a.italic) text = `*${text}*`
      if (a.strikethrough) text = `~~${text}~~`
      const url = rt.href ?? rt.text?.link?.url ?? null
      if (url) text = `[${text}](${url})`
      return text
    })
    .join('')
}

function getRowCells(block: Block): RichText[][] {
  const row = block.table_row as { cells?: RichText[][] } | undefined
  return row?.cells ?? []
}

function richTextsToCellValues(cols: RichText[][]): string[] {
  return cols.map((rich) => richTextToMarkdown(rich))
}

function getFileUrl(block: Block, type: string): string | null {
  const data = block[type] as Record<string, any> | undefined
  if (!data) return null
  if (data.type === 'external' && data.external?.url) return data.external.url
  if (data.type === 'file' && data.file?.url) return data.file.url
  return null
}

function getFileName(block: Block, type: string): string {
  const data = block[type] as Record<string, any> | undefined
  if (!data) return ''
  if (data.caption && data.caption.length > 0) {
    return richTextToMarkdown(data.caption as RichText[])
  }
  if (data.name) return String(data.name)
  return type
}

// ── Notion blocks → Markdown ────────────────────────────────────────────────

/** Convert a page's top-level block children into Markdown. */
export function blocksToMarkdown(blocks: Block[]): string {
  const lines: string[] = []
  let prevType = ''
  let numberedCounter = 0

  const gap = (type: string): void => {
    const listTypes = new Set(['bulleted_list_item', 'numbered_list_item', 'to_do'])
    if (lines.length === 0) return
    if (listTypes.has(type) && type === prevType) return
    lines.push('')
  }

  for (const block of blocks) {
    const type = String(block.type ?? '')
    const data = (block[type] ?? {}) as {
      rich_text?: RichText[]; checked?: boolean; language?: string
    }
    const text = richTextToMarkdown(data.rich_text)

    if (type !== 'numbered_list_item') numberedCounter = 0

    switch (type) {
      case 'heading_1':
        gap(type); lines.push(`# ${text}`); break
      case 'heading_2':
        gap(type); lines.push(`## ${text}`); break
      case 'heading_3':
        gap(type); lines.push(`### ${text}`); break
      case 'bulleted_list_item':
        gap(type); lines.push(`- ${text}`); break
      case 'numbered_list_item':
        gap(type); numberedCounter += 1; lines.push(`${numberedCounter}. ${text}`); break
      case 'to_do':
        gap(type); lines.push(`- [${data.checked ? 'x' : ' '}] ${text}`); break
      case 'toggle':
        gap(type); lines.push(`- [toggle] ${text}`); break
      case 'quote':
        gap(type); lines.push(`> ${text}`); break
      case 'callout':
        gap(type)
        const calloutData = (block as Record<string, any>).callout ?? {}
        const calloutIcon = calloutData.icon?.emoji ?? ''
        lines.push(`> ${calloutIcon} ${text}`)
        break
      case 'divider':
        gap(type); lines.push('---'); break
      case 'code':
        gap(type)
        lines.push('```' + (data.language && data.language !== 'plain text' ? data.language : ''))
        lines.push(text)
        lines.push('```')
        break
      case 'table':
        gap(type)
        const tableData = (block as Record<string, any>).table ?? {}
        const colCount = tableData.table_width ?? 0
        const rows = (block as Record<string, any>)._rows as Block[] | undefined
        if (rows && rows.length > 0) {
          const hasHeader = tableData.has_column_header === true
          const headerRow = hasHeader ? rows[0] : null
          const dataRows = hasHeader ? rows.slice(1) : rows
          const headerCells = headerRow
            ? richTextsToCellValues(getRowCells(headerRow))
            : new Array(colCount).fill('')
          lines.push(`| ${headerCells.join(' | ')} |`)
          lines.push(`| ${new Array(colCount).fill('---').join(' | ')} |`)
          for (const row of dataRows) {
            const cells = richTextsToCellValues(getRowCells(row))
            lines.push(`| ${cells.join(' | ')} |`)
          }
        } else {
          lines.push(`_[Table: ${colCount} columns]_`)
        }
        break
      case 'image': {
        gap(type)
        const imgUrl = getFileUrl(block, 'image')
        const imgAlt = getFileName(block, 'image')
        lines.push(imgUrl ? `![${imgAlt}](${imgUrl})` : `_Image: ${imgAlt}_`)
        break
      }
      case 'video': {
        gap(type)
        const vidUrl = getFileUrl(block, 'video')
        const vidAlt = getFileName(block, 'video')
        lines.push(vidUrl ? `[${vidAlt}](${vidUrl})` : `_Video: ${vidAlt}_`)
        break
      }
      case 'file': {
        gap(type)
        const fileUrl = getFileUrl(block, 'file')
        const fileName = getFileName(block, 'file')
        lines.push(fileUrl ? `[${fileName}](${fileUrl})` : `_File: ${fileName}_`)
        break
      }
      case 'pdf': {
        gap(type)
        const pdfUrl = getFileUrl(block, 'pdf')
        const pdfName = getFileName(block, 'pdf')
        lines.push(pdfUrl ? `[${pdfName}](${pdfUrl})` : `_PDF: ${pdfName}_`)
        break
      }
      case 'bookmark':
      case 'link_preview': {
        gap(type)
        const linkData = block[type] as Record<string, any> | undefined
        const url = linkData?.url ?? ''
        const caption = linkData?.caption ? richTextToMarkdown(linkData.caption as RichText[]) : url
        lines.push(`[${caption}](${url})`)
        break
      }
      case 'embed': {
        gap(type)
        const embedData = block[type] as Record<string, any> | undefined
        const embedUrl = embedData?.url ?? ''
        lines.push(`[Embed](${embedUrl})`)
        break
      }
      case 'equation': {
        gap(type)
        const eqData = block[type] as Record<string, any> | undefined
        const latex = eqData?.expression ?? ''
        lines.push(`$${latex}$`)
        break
      }
      case 'child_page': {
        gap(type)
        const pageData = block[type] as Record<string, any> | undefined
        const pageTitle = pageData?.title ?? 'Untitled'
        lines.push(`# [[${pageTitle}]]`)
        break
      }
      case 'breadcrumb':
        gap(type); lines.push('_Breadcrumb_'); break
      case 'table_of_contents':
        gap(type); lines.push('_Table of Contents_'); break
      case 'synced_block':
        // Unwrap and render children inline if they were fetched
        const syncedChildren = (block as Record<string, any>)._children as Block[] | undefined
        if (syncedChildren) {
          // Recursively render children (simplified: just mark and continue)
          lines.push(blocksToMarkdown(syncedChildren))
        }
        break
      case 'column_list':
        // Column list children are columns; skip and let inner content through
        break
      case 'column':
        // Columns contain their own children; unwrap if fetched
        const colChildren = (block as Record<string, any>)._children as Block[] | undefined
        if (colChildren) {
          lines.push(blocksToMarkdown(colChildren))
        }
        break
      case 'template':
        gap(type); lines.push(`_Template: ${text}_`); break
      case 'paragraph':
      default:
        gap(type); lines.push(text); break
    }
    prevType = type
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

// ── Markdown → Notion blocks ────────────────────────────────────────────────

const INLINE_RE =
  /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(~~([^~]+)~~)|(`([^`]+)`)|(\*([^*]+)\*)/

/** Parse a single line of Markdown into Notion rich_text objects. */
function inlineToRichText(input: string): RichText[] {
  const out: RichText[] = []
  let rest = input
  const push = (content: string, ann?: RichText['annotations'], url?: string): void => {
    if (!content) return
    out.push({
      type: 'text',
      text: { content, ...(url ? { link: { url } } : {}) },
      ...(ann ? { annotations: ann } : {})
    })
  }
  while (rest.length > 0) {
    const m = INLINE_RE.exec(rest)
    if (!m || m.index === undefined) {
      push(rest)
      break
    }
    if (m.index > 0) push(rest.slice(0, m.index))
    if (m[1]) push(m[2], undefined, m[3]) // [text](url)
    else if (m[4]) push(m[5], { bold: true })
    else if (m[6]) push(m[7], { strikethrough: true })
    else if (m[8]) push(m[9], { code: true })
    else if (m[10]) push(m[11], { italic: true })
    rest = rest.slice(m.index + m[0].length)
  }
  return out.length > 0 ? out : [{ type: 'text', text: { content: '' } }]
}

const block = (type: string, payload: Record<string, unknown>): Block => ({
  object: 'block',
  type,
  [type]: payload
})

/** Convert Markdown into Notion block children ready for append. */
export function markdownToBlocks(markdown: string): Block[] {
  const src = (markdown ?? '').replace(/\r\n/g, '\n')
  const lines = src.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed === '') { i += 1; continue }

    // Fenced code block
    const fence = /^```(.*)$/.exec(trimmed)
    if (fence) {
      const language = fence[1].trim() || 'plain text'
      const body: string[] = []
      i += 1
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        body.push(lines[i])
        i += 1
      }
      i += 1 // consume closing fence
      blocks.push(block('code', {
        rich_text: [{ type: 'text', text: { content: body.join('\n') } }],
        language
      }))
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push(block('divider', {}))
      i += 1
      continue
    }

    let m: RegExpExecArray | null
    if ((m = /^(#{1,3})\s+(.*)$/.exec(trimmed))) {
      const level = m[1].length
      const type = level === 1 ? 'heading_1' : level === 2 ? 'heading_2' : 'heading_3'
      blocks.push(block(type, { rich_text: inlineToRichText(m[2]) }))
    } else if ((m = /^[-*]\s+\[([ xX])\]\s+(.*)$/.exec(trimmed))) {
      blocks.push(block('to_do', {
        rich_text: inlineToRichText(m[2]),
        checked: m[1].toLowerCase() === 'x'
      }))
    } else if ((m = /^[-*]\s+(.*)$/.exec(trimmed))) {
      blocks.push(block('bulleted_list_item', { rich_text: inlineToRichText(m[1]) }))
    } else if ((m = /^\d+\.\s+(.*)$/.exec(trimmed))) {
      blocks.push(block('numbered_list_item', { rich_text: inlineToRichText(m[1]) }))
    } else if ((m = /^>\s?(.*)$/.exec(trimmed))) {
      const content = m[1]
      // Detect callout: `> emoji text` where the content starts with an emoji
      const emojiMatch = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])\s?(.*)$/.exec(content)
      if (emojiMatch) {
        blocks.push(block('callout', {
          rich_text: inlineToRichText(emojiMatch[2] || ''),
          icon: { emoji: emojiMatch[1] }
        }))
      } else {
        blocks.push(block('quote', { rich_text: inlineToRichText(content) }))
      }
    } else if ((m = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(trimmed))) {
      blocks.push(block('image', {
        type: 'external',
        external: { url: m[2] },
        caption: [{ type: 'text', text: { content: m[1] } }]
      }))
    } else if ((m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(trimmed))) {
      // Plain link → bookmark block
      blocks.push(block('bookmark', { url: m[2], caption: [{ type: 'text', text: { content: m[1] } }] }))
    } else {
      blocks.push(block('paragraph', { rich_text: inlineToRichText(trimmed) }))
    }
    i += 1
  }

  return blocks
}
