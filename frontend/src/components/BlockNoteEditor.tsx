import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCallback, useRef } from "react";

interface BlockNoteEditorProps {
  initialContent: string;  // markdown string
  onChange: (markdown: string) => void;
}

export function BlockNoteEditor({ initialContent, onChange }: BlockNoteEditorProps) {
  const skipFirstChange = useRef(true);
  const contentRef = useRef(initialContent);

  const editor = useCreateBlockNote({
    // Use tryParseMarkdownToBlocks if content exists, otherwise empty paragraph
    initialContent: contentRef.current.trim()
      ? undefined
      : [{ type: "paragraph", content: "" }],
  });

  // Parse markdown to blocks and insert (done once after mount)
  const hasInitialized = useRef(false);
  if (!hasInitialized.current && contentRef.current.trim()) {
    hasInitialized.current = true;
    try {
      const blocks = editor.tryParseMarkdownToBlocks(contentRef.current);
      // Replace all content with parsed blocks
      editor.replaceBlocks(editor.document, blocks);
    } catch {
      // If parsing fails, just insert as plain text
      editor.replaceBlocks(editor.document, [
        { type: "paragraph", content: contentRef.current }
      ]);
    }
  }

  // Convert blocks to markdown on change
  const handleChange = useCallback(() => {
    // Skip the first change event (triggered by content insertion)
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
