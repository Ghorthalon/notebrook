import JSZip from 'jszip'
import type { Channel, ExtendedMessage } from '@/types'

export type ExportFormat = 'markdown' | 'html-single' | 'html-individual'

interface Exporter {
  export(channels: Channel[], messages: Record<number, ExtendedMessage[]>): Promise<Blob>
  filename: string
  mimeType: string
}

function getDateString(): string {
  return new Date().toISOString().split('T')[0] ?? 'export'
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatTimestamp(dateString: string): string {
  return new Date(dateString).toLocaleString()
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim() || 'untitled'
}

// ============ Markdown Exporter ============

class MarkdownExporter implements Exporter {
  get filename(): string {
    return `notebrook-export-${getDateString()}.zip`
  }

  get mimeType(): string {
    return 'application/zip'
  }

  async export(channels: Channel[], messages: Record<number, ExtendedMessage[]>): Promise<Blob> {
    const zip = new JSZip()

    for (const channel of channels) {
      const channelMessages = messages[channel.id] || []
      const content = this.formatChannel(channel, channelMessages)
      const filename = `${sanitizeFilename(channel.name)}.md`
      zip.file(filename, content)
    }

    return zip.generateAsync({ type: 'blob' })
  }

  private formatChannel(channel: Channel, messages: ExtendedMessage[]): string {
    const lines: string[] = []
    lines.push(`# ${channel.name}`)
    lines.push('')

    for (const msg of messages) {
      const timestamp = formatTimestamp(msg.created_at)
      lines.push(`## ${timestamp}`)
      lines.push('')
      lines.push(`### ${msg.content}`)
      lines.push('')
    }

    return lines.join('\n')
  }
}

// ============ HTML Single Exporter ============

class HtmlSingleExporter implements Exporter {
  get filename(): string {
    return `notebrook-export-${getDateString()}.html`
  }

  get mimeType(): string {
    return 'text/html'
  }

  async export(channels: Channel[], messages: Record<number, ExtendedMessage[]>): Promise<Blob> {
    const html = this.generateHtml(channels, messages)
    return new Blob([html], { type: this.mimeType })
  }

  private generateHtml(channels: Channel[], messages: Record<number, ExtendedMessage[]>): string {
    const body: string[] = []

    for (const channel of channels) {
      const channelMessages = messages[channel.id] || []
      body.push(`<h2>${escapeHtml(channel.name)}</h2>`)

      for (const msg of channelMessages) {
        const timestamp = formatTimestamp(msg.created_at)
        body.push(`<h3>${escapeHtml(timestamp)}</h3>`)
        body.push(`<h4>${escapeHtml(msg.content)}</h4>`)
      }
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notebrook Export</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    h1 { border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
    h2 { margin-top: 2rem; color: #2563eb; }
    h3 { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem; }
    h4 { margin-top: 0; font-weight: normal; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>Notebrook Export</h1>
  ${body.join('\n  ')}
</body>
</html>`
  }
}

// ============ HTML Individual Exporter ============

class HtmlIndividualExporter implements Exporter {
  get filename(): string {
    return `notebrook-export-${getDateString()}.zip`
  }

  get mimeType(): string {
    return 'application/zip'
  }

  async export(channels: Channel[], messages: Record<number, ExtendedMessage[]>): Promise<Blob> {
    const zip = new JSZip()

    for (const channel of channels) {
      const channelMessages = messages[channel.id] || []
      const html = this.generateChannelHtml(channel, channelMessages)
      const filename = `${sanitizeFilename(channel.name)}.html`
      zip.file(filename, html)
    }

    return zip.generateAsync({ type: 'blob' })
  }

  private generateChannelHtml(channel: Channel, messages: ExtendedMessage[]): string {
    const body: string[] = []

    for (const msg of messages) {
      const timestamp = formatTimestamp(msg.created_at)
      body.push(`<h2>${escapeHtml(timestamp)}</h2>`)
      body.push(`<h3>${escapeHtml(msg.content)}</h3>`)
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(channel.name)} - Notebrook Export</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    h1 { border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
    h2 { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem; }
    h3 { margin-top: 0; font-weight: normal; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>${escapeHtml(channel.name)}</h1>
  ${body.join('\n  ')}
</body>
</html>`
  }
}

// ============ Factory ============

const exporters: Record<ExportFormat, Exporter> = {
  'markdown': new MarkdownExporter(),
  'html-single': new HtmlSingleExporter(),
  'html-individual': new HtmlIndividualExporter()
}

export function getExporter(format: ExportFormat): Exporter {
  return exporters[format]
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
