import { memo } from 'react';

interface MarkdownRendererProps {
  content: string;
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const codeRegex = /(`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let partIdx = 0;

  while ((match = codeRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(
      <code key={`${keyPrefix}-code-${partIdx++}`} className="font-mono text-xs bg-electric-500/10 px-1.5 py-0.5 rounded">
        {match[2]}
      </code>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

function renderLine(line: string, idx: number): React.ReactNode {
  if (line.startsWith('### ')) {
    return <h3 key={idx} className="font-semibold text-primary mt-3 mb-1">{renderInline(line.slice(4), `h3-${idx}`)}</h3>;
  }
  if (line.startsWith('## ')) {
    return <h2 key={idx} className="font-semibold text-primary text-base mt-3 mb-1">{renderInline(line.slice(3), `h2-${idx}`)}</h2>;
  }
  if (line.startsWith('# ')) {
    return <h1 key={idx} className="font-bold text-primary text-lg mt-3 mb-1">{renderInline(line.slice(2), `h1-${idx}`)}</h1>;
  }
  if (line.startsWith('- ') || line.startsWith('* ')) {
    return (
      <div key={idx} className="flex gap-2 ml-2">
        <span className="text-electric-400">•</span>
        <span>{renderInline(line.slice(2), `li-${idx}`)}</span>
      </div>
    );
  }
  if (/^\d+\.\s/.test(line)) {
    const match = line.match(/^(\d+)\.\s(.+)/);
    if (match) {
      return (
        <div key={idx} className="flex gap-2 ml-2">
          <span className="text-electric-400 flex-shrink-0">{match[1]}.</span>
          <span>{renderInline(match[2], `ol-${idx}`)}</span>
        </div>
      );
    }
  }
  if (line.startsWith('> ')) {
    return <blockquote key={idx} className="border-l-2 border-electric-500 pl-3 text-secondary italic">{renderInline(line.slice(2), `bq-${idx}`)}</blockquote>;
  }
  if (line.trim() === '') {
    return <div key={idx} className="h-2" />;
  }
  return <p key={idx} className="mb-1.5">{renderInline(line, `p-${idx}`)}</p>;
}

function renderCodeBlock(content: string, lang: string, idx: number): React.ReactNode {
  return (
    <div key={`codeblock-${idx}`} className="my-2">
      <div className="bg-tertiary border border-subtle rounded-lg overflow-hidden">
        {lang && (
          <div className="px-3 py-1.5 border-b border-subtle text-xs text-tertiary font-mono">
            {lang}
          </div>
        )}
        <pre className="p-3 overflow-x-auto">
          <code className="font-mono text-xs text-primary">{content}</code>
        </pre>
      </div>
    </div>
  );
}

export const MarkdownRenderer = memo(({ content }: MarkdownRendererProps) => {
  const lines = content.split('\n');
  const nodes: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = '';
  let codeLang = '';
  let codeIdx = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        nodes.push(renderCodeBlock(codeContent, codeLang, codeIdx++));
        inCodeBlock = false;
        codeContent = '';
        codeLang = '';
      } else {
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += (codeContent ? '\n' : '') + line;
      continue;
    }

    nodes.push(renderLine(line, i));
  }

  if (inCodeBlock && codeContent) {
    nodes.push(renderCodeBlock(codeContent, codeLang, codeIdx++));
  }

  return <>{nodes}</>;
});
