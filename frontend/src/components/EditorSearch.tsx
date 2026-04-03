import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';

interface EditorSearchProps {
  editor: any; // MilkdownEditor wrapper with _getProseMirrorView
  onClose: () => void;
}

export function EditorSearch({ editor, onClose }: EditorSearchProps) {
  const [query, setQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const decorationsRef = useRef<any>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearHighlights();
        onClose();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          goToPrev();
        } else {
          goToNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [matchCount, currentMatch]);

  // Get ProseMirror view from editor
  const getProseMirrorView = useCallback(() => {
    if (!editor) return null;
    
    // Try the _getProseMirrorView function first (Milkdown wrapper)
    if (editor._getProseMirrorView) {
      return editor._getProseMirrorView();
    }
    
    // Fallback: try to get view from Crepe's editor
    if (editor._crepe?.editor) {
      try {
        const { editorViewCtx } = require('@milkdown/core');
        return editor._crepe.editor.action((ctx: any) => ctx.get(editorViewCtx));
      } catch {
        return null;
      }
    }
    
    return null;
  }, [editor]);

  // Search through editor content
  const searchContent = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setMatchCount(0);
      setCurrentMatch(0);
      clearHighlights();
      return;
    }

    const view = getProseMirrorView();
    if (!view) return;

    const doc = view.state.doc;
    const results: { from: number; to: number }[] = [];
    const lowerQuery = searchQuery.toLowerCase();

    // Search through all text nodes
    doc.descendants((node: any, pos: number) => {
      if (node.isText) {
        const text = node.text.toLowerCase();
        let startIdx = 0;
        while (true) {
          const idx = text.indexOf(lowerQuery, startIdx);
          if (idx === -1) break;
          results.push({ from: pos + idx, to: pos + idx + searchQuery.length });
          startIdx = idx + 1;
        }
      }
    });

    setMatchCount(results.length);
    setCurrentMatch(results.length > 0 ? 1 : 0);

    // Highlight all matches
    if (results.length > 0) {
      highlightMatches(view, results, 0);
      scrollToMatch(view, results[0]);
    }
  }, [getProseMirrorView]);

  const highlightMatches = (view: any, results: { from: number; to: number }[], activeIndex: number) => {
    const { Decoration, DecorationSet } = require('prosemirror-view');

    const decorations = results.map((match, idx) => {
      const className = idx === activeIndex
        ? 'search-match-active'
        : 'search-match';
      return Decoration.inline(match.from, match.to, { class: className });
    });

    decorationsRef.current = DecorationSet.create(view.state.doc, decorations);
    
    // Apply decorations via dispatch
    const tr = view.state.tr.setMeta('searchDecorations', decorationsRef.current);
    view.dispatch(tr);
  };

  const clearHighlights = () => {
    const view = getProseMirrorView();
    if (!view) return;

    decorationsRef.current = null;
    const tr = view.state.tr.setMeta('searchDecorations', null);
    view.dispatch(tr);
  };

  const scrollToMatch = (view: any, match: { from: number; to: number }) => {
    try {
      const coords = view.coordsAtPos(match.from);
      if (coords) {
        const editorElement = view.dom.closest('.milkdown-editor-container') 
          || view.dom.closest('.milkdown-editor');
        if (editorElement) {
          const editorRect = editorElement.getBoundingClientRect();
          // Scroll if match is outside visible area
          if (coords.top < editorRect.top || coords.bottom > editorRect.bottom) {
            const scrollTarget = coords.top - editorRect.top - 50;
            editorElement.scrollTop = editorElement.scrollTop + scrollTarget;
          }
        }
      }
    } catch {
      // Ignore scroll errors
    }
  };

  const goToNext = useCallback(() => {
    if (matchCount === 0) return;
    const next = currentMatch >= matchCount ? 1 : currentMatch + 1;
    setCurrentMatch(next);
    reHighlight(next - 1);
  }, [matchCount, currentMatch, query]);

  const goToPrev = useCallback(() => {
    if (matchCount === 0) return;
    const prev = currentMatch <= 1 ? matchCount : currentMatch - 1;
    setCurrentMatch(prev);
    reHighlight(prev - 1);
  }, [matchCount, currentMatch, query]);

  const reHighlight = useCallback((activeIndex: number) => {
    if (!query.trim()) return;
    
    const view = getProseMirrorView();
    if (!view) return;

    const doc = view.state.doc;
    const results: { from: number; to: number }[] = [];
    const lowerQuery = query.toLowerCase();

    doc.descendants((node: any, pos: number) => {
      if (node.isText) {
        const text = node.text.toLowerCase();
        let startIdx = 0;
        while (true) {
          const idx = text.indexOf(lowerQuery, startIdx);
          if (idx === -1) break;
          results.push({ from: pos + idx, to: pos + idx + query.length });
          startIdx = idx + 1;
        }
      }
    });

    if (results.length > 0 && activeIndex < results.length) {
      highlightMatches(view, results, activeIndex);
      scrollToMatch(view, results[activeIndex]);
    }
  }, [query, getProseMirrorView]);

  return (
    <div 
      className="flex items-center gap-2 px-3 py-2 bg-[#202020] border-b border-[#2f2f2f]"
      data-testid="editor-search"
    >
      <Search size={14} className="text-[#6b6b6b] flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          searchContent(e.target.value);
        }}
        placeholder="Search in note..."
        className="flex-1 bg-transparent text-[#e6e6e6] text-sm outline-none placeholder-[#4b5563]"
        data-testid="editor-search-input"
      />
      {query && (
        <span className="text-xs text-[#6b6b6b]" data-testid="editor-search-count">
          {matchCount > 0 ? `${currentMatch}/${matchCount}` : 'No results'}
        </span>
      )}
      <button 
        onClick={goToPrev} 
        className="p-1 hover:bg-[#2a2a2a] rounded text-[#6b6b6b] hover:text-[#e6e6e6]" 
        title="Previous (Shift+Enter)"
        data-testid="editor-search-prev"
      >
        <ChevronUp size={14} />
      </button>
      <button 
        onClick={goToNext} 
        className="p-1 hover:bg-[#2a2a2a] rounded text-[#6b6b6b] hover:text-[#e6e6e6]" 
        title="Next (Enter)"
        data-testid="editor-search-next"
      >
        <ChevronDown size={14} />
      </button>
      <button 
        onClick={() => { clearHighlights(); onClose(); }} 
        className="p-1 hover:bg-[#2a2a2a] rounded text-[#6b6b6b] hover:text-[#e6e6e6]" 
        title="Close (Escape)"
        data-testid="editor-search-close"
      >
        <X size={14} />
      </button>
    </div>
  );
}
