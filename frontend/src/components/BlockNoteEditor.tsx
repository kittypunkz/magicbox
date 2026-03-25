import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCallback, useRef } from "react";

interface BlockNoteEditorProps {
  initialContent: string;  // markdown string
  onChange: (markdown: string) => void;
}

export function BlockNoteEditor({ initialContent, onChange }: BlockNoteEditorProps) {
  const editor = useCreateBlockNote();
  const loaded = useRef(false);

  // Load initial content on first render
  if (!loaded.current && initialContent.trim()) {
    loaded.current = true;
    try {
      const blocks = editor.tryParseMarkdownToBlocks(initialContent);
      editor.replaceBlocks(editor.document, blocks);
    } catch {
      // If parsing fails, insert as plain text paragraph
    }
  }

  // Always fire onChange — parent handles dedup
  const handleChange = useCallback(() => {
    const markdown = editor.blocksToMarkdownLossy(editor.document);
    onChange(markdown);
  }, [editor, onChange]);

  return (
    <div className="blocknote-editor-wrapper" style={{ minHeight: "200px" }}>
      <BlockNoteView
        editor={editor}
        onChange={handleChange}
        theme="dark"
        slashMenu={true}
      />
    </div>
  );
}
