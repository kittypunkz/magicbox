import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';

interface EditorSearchProps {
  editor: any; // BlockNoteEditor
  onClose: () => void;
}

export function EditorSearch({ editor, onClose }: EditorSearchProps) {
  const [query, setQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Search through editor content
  const searchContent = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setMatchCount(0);
      setCurrentMatch(0);
      clearHighlights();
      return;
    }

    const tiptapEditor = editor._tiptapEditor;
    if (!tiptapEditor) return;

    const doc = tiptapEditor.state.doc;
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
      highlightMatches(tiptapEditor, results, 0);
      scrollToMatch(tiptapEditor, results[0]);
    }
  }, [editor]);

  const highlightMatches = (tiptapEditor: any, results: { from: number; to: number }[], activeIndex: number) => {
    const { Decoration, DecorationSet } = require('@tiptap/pm/view');

    const decorations = results.map((match, idx) => {
      const className = idx === activeIndex
        ? 'search-match-active'
        : 'search-match';
      return Decoration.inline(match.from, match.to, { class: className });
    });

    const decorationSet = DecorationSet.create(tiptapEditor.state.doc, decorations);

    tiptapEditor.view.dispatch(
      tiptapEditor.state.tr.setMeta('searchDecorations', decorationSet)
    );
  };

  const clearHighlights = () => {
    const tiptapEditor = editor._tiptapEditor;
    if (!tiptapEditor) return;

    const { DecorationSet } = require('@tiptap/pm/view');
    tiptapEditor.view.dispatch(
      tiptapEditor.state.tr.setMeta('searchDecorations', DecorationSet.empty)
    );
  };

  const scrollToMatch = (tiptapEditor: any, match: { from: number; to: number }) => {
    const coords = tiptapEditor.view.coordsAtPos(match.from);
    if (coords) {
      const editorElement = tiptapEditor.view.dom.closest('.blocknote-editor-wrapper');
      if (editorElement) {
        editorElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  };

  const goToNext = () => {
    if (matchCount === 0) return;
    const next = currentMatch >= matchCount ? 1 : currentMatch + 1;
    setCurrentMatch(next);
    reHighlight(next - 1);
  };

  const goToPrev = () => {
    if (matchCount === 0) return;
    const prev = currentMatch <= 1 ? matchCount : currentMatch - 1;
    setCurrentMatch(prev);
    reHighlight(prev - 1);
  };

  const reHighlight = (activeIndex: number) => {
    if (!query.trim()) return;
    const tiptapEditor = editor._tiptapEditor;
    if (!tiptapEditor) return;

    const doc = tiptapEditor.state.doc;
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

    if (results.length > 0) {
      highlightMatches(tiptapEditor, results, activeIndex);
      scrollToMatch(tiptapEditor, results[activeIndex]);
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[#202020] border-b border-[#2f2f2f]">
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
      />
      {query && (
        <span className="text-xs text-[#6b6b6b]">
          {matchCount > 0 ? `${currentMatch}/${matchCount}` : 'No results'}
        </span>
      )}
      <button onClick={goToPrev} className="p-1 hover:bg-[#2a2a2a] rounded text-[#6b6b6b] hover:text-[#e6e6e6]" title="Previous">
        <ChevronUp size={14} />
      </button>
      <button onClick={goToNext} className="p-1 hover:bg-[#2a2a2a] rounded text-[#6b6b6b] hover:text-[#e6e6e6]" title="Next">
        <ChevronDown size={14} />
      </button>
      <button onClick={() => { clearHighlights(); onClose(); }} className="p-1 hover:bg-[#2a2a2a] rounded text-[#6b6b6b] hover:text-[#e6e6e6]" title="Close">
        <X size={14} />
      </button>
    </div>
  );
}
