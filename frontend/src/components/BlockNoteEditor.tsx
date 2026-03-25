import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCallback, useRef } from "react";

interface BlockNoteEditorProps {
  initialContent: string;  // markdown string
  onChange: (markdown: string) => void;
}

export function BlockNoteEditor({ initialContent, onChange }: BlockNoteEditorProps) {
  const contentRef = useRef(initialContent);
  const lastMarkdown = useRef(initialContent);
  const initialized = useRef(false);

  const editor = useCreateBlockNote();

  // Load initial content synchronously after first render
  if (!initialized.current) {
    initialized.current = true;
    if (contentRef.current.trim()) {
      try {
        const blocks = editor.tryParseMarkdownToBlocks(contentRef.current);
        editor.replaceBlocks(editor.document, blocks);
      } catch {
        editor.replaceBlocks(editor.document, [
          { type: "paragraph", content: contentRef.current }
        ]);
      }
    }
  }

  // Convert blocks to markdown on change — only fire if content actually changed
  const handleChange = useCallback(() => {
    const markdown = editor.blocksToMarkdownLossy(editor.document);
    if (markdown !== lastMarkdown.current) {
      lastMarkdown.current = markdown;
      onChange(markdown);
    }
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
