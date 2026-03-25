import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCallback, useRef } from "react";

interface BlockNoteEditorProps {
  initialContent: string;  // markdown string
  onChange: (markdown: string) => void;
}

export function BlockNoteEditor({ initialContent, onChange }: BlockNoteEditorProps) {
  const editor = useCreateBlockNote({
    initialContent: initialContent.trim()
      ? undefined  // Will be set via pasteMarkdown below
      : [{ type: "paragraph", content: "" }],
  });

  const isInitialLoad = useRef(true);

  // Load initial markdown content
  const handleEditorReady = useCallback(() => {
    if (isInitialLoad.current && initialContent.trim()) {
      isInitialLoad.current = false;
      editor.pasteMarkdown(initialContent);
    }
  }, [editor, initialContent]);

  // Convert blocks to markdown on change
  const handleChange = useCallback(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    const markdown = editor.blocksToMarkdownLossy(editor.document);
    onChange(markdown);
  }, [editor, onChange]);

  return (
    <div
      className="blocknote-editor-wrapper"
      onClick={handleEditorReady}
      onFocus={handleEditorReady}
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
