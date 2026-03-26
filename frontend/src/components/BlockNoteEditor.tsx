import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCallback, useRef } from "react";

interface BlockNoteEditorProps {
  initialContent: string;
  onChange: (markdown: string) => void;
  onEditorReady?: (editor: any) => void;
}

export function BlockNoteEditor({ initialContent, onChange, onEditorReady }: BlockNoteEditorProps) {
  const editor = useCreateBlockNote();
  const loaded = useRef(false);
  const notifiedReady = useRef(false);

  // Expose editor to parent
  if (!notifiedReady.current && onEditorReady) {
    notifiedReady.current = true;
    onEditorReady(editor);
  }

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
