'use client';

import React, { memo } from 'react';
import { parse, unparse } from 'papaparse';

type SheetEditorProps = {
  content: string;
  saveContent: (content: string, isCurrentVersion: boolean) => void;
  status: string;
  isCurrentVersion: boolean;
  currentVersionIndex: number;
};

// Lightweight CSV editor stub. The original used react-data-grid, but
// v7.0.0-beta.60 ships a broken bundled import that breaks the Next.js
// build. This stub keeps the chat artifact functional with a simple
// editable <textarea> until the dep is upgraded.
const PureSpreadsheetEditor = ({ content, saveContent }: SheetEditorProps) => {
  const rows = React.useMemo(() => {
    if (!content) return '';
    const result = parse<string[]>(content, { skipEmptyLines: true });
    return unparse(result.data);
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    saveContent(e.target.value, true);
  };

  return (
    <textarea
      value={rows}
      onChange={handleChange}
      className="h-full w-full resize-none border-0 bg-transparent p-4 font-mono text-sm focus:outline-none"
      spellCheck={false}
      placeholder="A,B,C\n1,2,3"
    />
  );
};

function areEqual(prevProps: SheetEditorProps, nextProps: SheetEditorProps) {
  return (
    prevProps.currentVersionIndex === nextProps.currentVersionIndex &&
    prevProps.isCurrentVersion === nextProps.isCurrentVersion &&
    !(prevProps.status === 'streaming' && nextProps.status === 'streaming') &&
    prevProps.content === nextProps.content &&
    prevProps.saveContent === nextProps.saveContent
  );
}

export const SpreadsheetEditor = memo(PureSpreadsheetEditor, areEqual);
