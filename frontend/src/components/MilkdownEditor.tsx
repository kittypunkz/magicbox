import { useEffect, useRef, useState, useCallback } from 'react';
import { Editor, rootCtx, editorViewCtx, defaultValueCtx } from '@milkdown/core';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { commonmark } from '@milkdown/preset-commonmark';
import { history } from '@milkdown/plugin-history';
import { cursor } from '@milkdown/plugin-cursor';
import { HashtagDropdown, extractHashtags } from './HashtagDropdown';

interface MilkdownEditorProps {
  initialContent: string;
  onChange: (markdown: string) => void;
  onEditorReady?: (editor: any) => void;
  onTagsChange?: (tags: string[]) => void;
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
  
  .milkdown-editor .milkdown {
    background-color: transparent !important;
  }
  
  .milkdown-editor .milkdown .editor {
    background-color: transparent !important;
    color: #e6e6e6 !important;
    min-height: 300px;
    padding: 0;
  }
  
  .milkdown-editor .milkdown .ProseMirror {
    outline: none;
    min-height: 300px;
    padding: 0;
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
  
  .milkdown-editor .milkdown .ProseMirror hr {
    border: none;
    border-top: 1px solid #2f2f2f;
    margin: 1em 0;
  }
  
  .milkdown-editor .milkdown .ProseMirror table {
    border-collapse: collapse;
    width: 100%;
  }
  
  .milkdown-editor .milkdown .ProseMirror th,
  .milkdown-editor .milkdown .ProseMirror td {
    border: 1px solid #2f2f2f;
    padding: 0.5em;
  }
  
  .milkdown-editor .milkdown .ProseMirror th {
    background: #2a2a2a;
  }

  /* Placeholder */
  .milkdown-editor .ProseMirror.is-empty::before {
    content: attr(data-placeholder);
    color: #4b5563;
    float: left;
    height: 0;
    pointer-events: none;
  }
  
  /* Selection */
  .milkdown-editor .ProseMirror ::selection {
    background: rgba(96, 165, 250, 0.3);
  }
  
  /* Image handling */
  .milkdown-editor .ProseMirror img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
  }
`;

export function MilkdownEditor({ initialContent, onChange, onEditorReady, onTagsChange }: MilkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentLoaded = useRef(false);
  
  // Hashtag dropdown state
  const [hashtagDropdown, setHashtagDropdown] = useState<{
    show: boolean;
    query: string;
    position: { top: number; left: number };
  }>({ show: false, query: '', position: { top: 0, left: 0 } });

  // Get ProseMirror view for search functionality
  const getProseMirrorView = useCallback(() => {
    if (!editorRef.current) return null;
    try {
      return editorRef.current.action((ctx) => ctx.get(editorViewCtx));
    } catch {
      return null;
    }
  }, []);

  // Handle tag selection
  const handleTagSelect = useCallback((tagName: string) => {
    const view = getProseMirrorView();
    if (!view) return;
    
    const { state } = view;
    const { from } = state.selection;
    const textBeforeCursor = state.doc.textBetween(0, from, '\n', '\n');
    const hashtagMatch = textBeforeCursor.match(/#([\w.-]*)$/);
    
    if (hashtagMatch) {
      const insertFrom = from - hashtagMatch[0].length;
      const tr = state.tr.insertText(`#${tagName} `, insertFrom, from);
      view.dispatch(tr);
      
      // Extract and notify of tag changes
      const fullText = state.doc.textContent;
      const tags = extractHashtags(fullText);
      onTagsChange?.(tags);
    }
    
    setHashtagDropdown((prev) => ({ ...prev, show: false }));
  }, [getProseMirrorView, onTagsChange]);

  // Handle creating new tag
  const handleCreateTag = useCallback(async (tagName: string) => {
    try {
      const { tagsAPI } = await import('../api/client');
      await tagsAPI.create({ name: tagName });
      handleTagSelect(tagName);
    } catch (err) {
      console.error('Failed to create tag:', err);
    }
  }, [handleTagSelect]);

  // Close dropdown
  const handleCloseDropdown = useCallback(() => {
    setHashtagDropdown((prev) => ({ ...prev, show: false }));
  }, []);

  // Detect hashtag while typing
  const detectHashtag = useCallback(() => {
    const view = getProseMirrorView();
    if (!view) return;
    
    const { state } = view;
    const { from } = state.selection;
    const textBeforeCursor = state.doc.textBetween(0, from, '\n', '\n');
    const hashtagMatch = textBeforeCursor.match(/#([\w.-]*)$/);
    
    if (hashtagMatch) {
      const query = hashtagMatch[1];
      const pos = view.coordsAtPos(from);
      const editorRect = view.dom.getBoundingClientRect();
      
      setHashtagDropdown({
        show: true,
        query,
        position: {
          top: pos.bottom - editorRect.top + 4,
          left: pos.left - editorRect.left,
        },
      });
    } else {
      setHashtagDropdown((prev) => ({ ...prev, show: false }));
    }
  }, [getProseMirrorView]);

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return;

    let editorInstance: Editor | null = null;
    let isMounted = true;

    const initEditor = async () => {
      try {
        // Create the Milkdown editor with minimal plugins
        editorInstance = await Editor.make()
          .config((ctx) => {
            ctx.set(rootCtx, containerRef.current!);
            if (initialContent.trim()) {
              ctx.set(defaultValueCtx, initialContent);
            }
          })
          .use(commonmark)
          .use(listener)
          .use(history)
          .use(cursor)
          .create();

        if (!isMounted || !editorInstance) return;

        editorRef.current = editorInstance;
        setIsReady(true);
        contentLoaded.current = true;

        // Expose editor to parent for EditorSearch integration
        onEditorReady?.({
          _editor: editorInstance,
          _getProseMirrorView: getProseMirrorView,
          getJSON: () => {
            try {
              const view = getProseMirrorView();
              return view ? view.state.doc.toJSON() : {};
            } catch {
              return {};
            }
          },
        });

        // Set up listener for content changes
        editorInstance.action((ctx) => {
          const listenerManager = ctx.get(listenerCtx);
          listenerManager.markdownUpdated((_c, markdown) => {
            if (isMounted) {
              onChange(markdown);
              
              // Extract tags from content
              const tags = extractHashtags(markdown);
              onTagsChange?.(tags);
            }
          });
        });

        // Add keydown listener for hashtag detection
        const view = getProseMirrorView();
        if (view) {
          view.dom.addEventListener('keydown', () => {
            setTimeout(detectHashtag, 0);
          });
        }

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
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="milkdown-editor-error p-4 bg-red-900/20 rounded-lg border border-red-800">
        <p className="text-red-400">{error}</p>
        <p className="text-sm text-red-400/70 mt-2">
          Please refresh the page to try again.
        </p>
      </div>
    );
  }

  return (
    <div className="milkdown-editor relative">
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
      
      {/* Hashtag Dropdown */}
      {hashtagDropdown.show && (
        <HashtagDropdown
          position={hashtagDropdown.position}
          query={hashtagDropdown.query}
          onSelect={handleTagSelect}
          onClose={handleCloseDropdown}
          onCreateTag={handleCreateTag}
        />
      )}
    </div>
  );
}

export default MilkdownEditor;
