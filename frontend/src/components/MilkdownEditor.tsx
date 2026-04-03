import { useEffect, useRef, useState } from 'react';
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core';
import { Crepe } from '@milkdown/crepe';
import { listener, listenerCtx } from '@milkdown/plugin-listener';

interface MilkdownEditorProps {
  initialContent: string;
  onChange: (markdown: string) => void;
  onEditorReady?: (editor: any) => void;
}

// Custom dark theme matching MagicBox palette
const editorStyles = `
  .milkdown-editor {
    --md-bg: #191919;
    --md-text: #e6e6e6;
    --md-border: #2f2f2f;
    --md-hover: #2a2a2a;
    --md-gray: #6b6b6b;
  }
  
  .milkdown-editor .editor {
    background-color: transparent !important;
    color: #e6e6e6 !important;
    min-height: 300px;
    padding: 0;
  }
  
  .milkdown-editor .milkdown {
    background-color: transparent !important;
  }
  
  .milkdown-editor .milkdown .editor {
    background-color: transparent !important;
  }
  
  .milkdown-editor .milkdown .ProseMirror {
    outline: none;
    min-height: 300px;
  }
  
  .milkdown-editor .milkdown .ProseMirror p {
    margin: 0.5em 0;
    line-height: 1.8;
    color: #e6e6e6;
  }
  
  .milkdown-editor .milkdown .ProseMirror h1 {
    font-size: 2em;
    font-weight: 700;
    margin: 1em 0 0.5em;
    color: #e6e6e6;
  }
  
  .milkdown-editor .milkdown .ProseMirror h2 {
    font-size: 1.5em;
    font-weight: 600;
    margin: 0.8em 0 0.4em;
    color: #e6e6e6;
  }
  
  .milkdown-editor .milkdown .ProseMirror h3 {
    font-size: 1.25em;
    font-weight: 600;
    margin: 0.6em 0 0.3em;
    color: #e6e6e6;
  }
  
  .milkdown-editor .milkdown .ProseMirror ul,
  .milkdown-editor .milkdown .ProseMirror ol {
    padding-left: 1.5em;
    margin: 0.5em 0;
  }
  
  .milkdown-editor .milkdown .ProseMirror ul {
    list-style-type: disc;
  }
  
  .milkdown-editor .milkdown .ProseMirror ol {
    list-style-type: decimal;
  }
  
  .milkdown-editor .milkdown .ProseMirror li {
    margin: 0.25em 0;
  }
  
  .milkdown-editor .milkdown .ProseMirror code {
    background: #2a2a2a;
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9em;
  }
  
  .milkdown-editor .milkdown .ProseMirror pre {
    background: #2a2a2a;
    padding: 1em;
    border-radius: 8px;
    overflow-x: auto;
  }
  
  .milkdown-editor .milkdown .ProseMirror pre code {
    background: transparent;
    padding: 0;
  }
  
  .milkdown-editor .milkdown .ProseMirror blockquote {
    border-left: 3px solid #4b5563;
    padding-left: 1em;
    margin: 0.5em 0;
    color: #9ca3af;
  }
  
  .milkdown-editor .milkdown .ProseMirror a {
    color: #60a5fa;
    text-decoration: underline;
  }
  
  /* Selection */
  .milkdown-editor .milkdown .ProseMirror ::selection {
    background: rgba(96, 165, 250, 0.3);
  }
  
  /* CodeMirror theme overrides */
  .milkdown-editor .cm-editor {
    background: transparent !important;
  }
  
  .milkdown-editor .cm-editor .cm-scroller {
    font-family: inherit;
    line-height: 1.8;
  }
  
  .milkdown-editor .cm-editor .cm-content {
    padding: 0;
  }
  
  .milkdown-editor .cm-editor .cm-gutters {
    background: transparent !important;
    border-right: none !important;
    color: #4b5563;
  }
`;

export function MilkdownEditor({ initialContent, onChange, onEditorReady }: MilkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentLoaded = useRef(false);

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return;

    let editorInstance: Editor | null = null;
    let isMounted = true;

    const initEditor = async () => {
      try {
        // Create editor with Milkdown v7 API
        editorInstance = await Editor.make()
          .config((ctx) => {
            // Set root element
            ctx.set(rootCtx, containerRef.current!);
            // Set initial content
            // Try to clean up BlockNote format if present
            let cleanContent = initialContent;
            if (initialContent.trim()) {
              // BlockNote stores as JSON blocks, try to convert to markdown
              // If it looks like JSON, treat as plain text
              try {
                if (initialContent.trim().startsWith('[') || initialContent.trim().startsWith('{')) {
                  // Likely BlockNote format - leave as-is for now
                  // The editor will handle it
                }
              } catch {
                // Not JSON, use as-is
              }
              ctx.set(defaultValueCtx, cleanContent);
            }
          })
          .use(Crepe)
          .use(listener)
          .create();

        if (!isMounted || !editorInstance) return;

        editorRef.current = editorInstance;
        setIsReady(true);

        // Expose editor to parent for EditorSearch integration
        onEditorReady?.({
          view: editorInstance,
          getJSON: () => {
            try {
              return editorInstance!.action((ctx) => ctx.get('markdown'));
            } catch {
              return {};
            }
          },
        });

        // Listen for changes using the listener plugin
        editorInstance.action((ctx) => {
          const listenerMgr = ctx.get(listenerCtx);
          listenerMgr.markdownUpdated((ctx, markdown) => {
            onChange(markdown);
          });
        });

        contentLoaded.current = true;
      } catch (err) {
        console.error('Failed to initialize Milkdown editor:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize editor');
        }
      }
    };

    initEditor();

    return () => {
      isMounted = false;
      if (editorInstance) {
        try {
          editorInstance.destroy();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  // Handle content changes via onChange callback
  useEffect(() => {
    if (!editorRef.current || !contentLoaded.current) return;

    let mounted = true;

    const handleChange = () => {
      if (!mounted || !editorRef.current) return;
      try {
        const markdown = editorRef.current.action((ctx) => {
          try {
            return ctx.get(listenerCtx);
          } catch {
            return '';
          }
        });
        // Only call onChange if we got a valid markdown
        if (typeof markdown === 'string' && markdown) {
          onChange(markdown);
        }
      } catch (e) {
        // Ignore errors
      }
    };

    const timeoutId = setTimeout(handleChange, 100);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [initialContent, onChange]);

  if (error) {
    return (
      <div className="milkdown-editor-error p-4 bg-red-900/20 rounded-lg border border-red-800">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="milkdown-editor">
      <style>{editorStyles}</style>
      <div
        ref={containerRef}
        className="milkdown-editor-container"
        style={{
          minHeight: '300px',
          backgroundColor: 'transparent',
        }}
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#191919]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}
    </div>
  );
}

export default MilkdownEditor;