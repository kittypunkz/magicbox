import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCallback, useEffect, useRef } from "react";

interface BlockNoteEditorProps {
  initialContent: string;  // markdown string
  onChange: (markdown: string) => void;
}

export function BlockNoteEditor({ initialContent, onChange }: BlockNoteEditorProps) {
  const editor = useCreateBlockNote();
  const skipFirstChange = useRef(true);

  // Load initial content on mount
  useEffect(() => {
    if (initialContent.trim()) {
      editor.pasteMarkdown(initialContent);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Convert blocks to markdown on change
  const handleChange = useCallback(() => {
    // Skip the first change event (triggered by pasteMarkdown)
    if (skipFirstChange.current) {
      skipFirstChange.current = false;
      return;
    }
    const markdown = editor.blocksToMarkdownLossy(editor.document);
    onChange(markdown);
  }, [editor, onChange]);

  return (
    <div
      className="blocknote-editor-wrapper"
      style={{ minHeight: "200px" }}
    >
      <BlockNoteView
        editor={editor}
        onChange={handleChange}
        theme="dark"
        slashMenu={true}
      />
    </div>
  );
}
