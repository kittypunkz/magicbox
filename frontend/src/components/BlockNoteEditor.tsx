import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCallback, useRef } from "react";

interface BlockNoteEditorProps {
  initialContent: string;  // markdown string
  onChange: (markdown: string) => void;
}

export function BlockNoteEditor({ initialContent, onChange }: BlockNoteEditorProps) {
  const initialized = useRef(false);
  // Only skip the first onChange if we actually loaded initial content
  const skipNext = useRef(!!initialContent.trim());

  const editor = useCreateBlockNote();

  // Load initial content synchronously
  if (!initialized.current) {
    initialized.current = true;
    if (initialContent.trim()) {
      try {
        const blocks = editor.tryParseMarkdownToBlocks(initialContent);
        editor.replaceBlocks(editor.document, blocks);
      } catch {
        editor.replaceBlocks(editor.document, [
          { type: "paragraph", content: initialContent }
        ]);
      }
    }
  }

  // Fire onChange whenever blocks change
  const handleChange = useCallback(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
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
