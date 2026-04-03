import { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, Hash } from 'lucide-react';
import { getTotalNoteCount, type TagNode } from '../utils/tagTree';

interface TagTreeProps {
  nodes: TagNode[];
  onTagClick: (path: string) => void;
  selectedPath?: string | null;
  defaultExpanded?: boolean;
  className?: string;
}

interface TagTreeNodeProps {
  node: TagNode;
  onTagClick: (path: string) => void;
  selectedPath?: string | null;
  defaultExpanded?: boolean;
  className?: string;
}

export function TagTree({
  nodes,
  onTagClick,
  selectedPath,
  defaultExpanded = false,
  className = '',
}: TagTreeProps) {
  if (nodes.length === 0) return null;

  return (
    <div className={className}>
      {nodes.map(node => (
        <TagTreeNode
          key={node.path}
          node={node}
          onTagClick={onTagClick}
          selectedPath={selectedPath}
          defaultExpanded={defaultExpanded}
        />
      ))}
    </div>
  );
}

function TagTreeNode({
  node,
  onTagClick,
  selectedPath,
  defaultExpanded = false,
}: TagTreeNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasChildren = node.children.length > 0;
  const totalNotes = getTotalNoteCount(node);
  const isSelected = selectedPath === node.path;

  const toggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => !prev);
  }, []);

  return (
    <div>
      <button
        onClick={() => onTagClick(node.path)}
        className={`
          w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm
          transition-colors min-h-[32px] group
          ${isSelected
            ? 'bg-blue-500/20 text-blue-400'
            : 'text-[#e6e6e6] hover:bg-[#2f2f2f]'
          }
        `}
        style={{ paddingLeft: `${8 + node.depth * 16}px` }}
      >
        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <button
            onClick={toggleExpand}
            className="p-0.5 -ml-1 rounded hover:bg-[#3f3f3f] transition-colors flex-shrink-0"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <ChevronDown size={14} className="text-[#6b6b6b]" />
            ) : (
              <ChevronRight size={14} className="text-[#6b6b6b]" />
            )}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        {/* Tag icon */}
        <Hash
          size={13}
          className="flex-shrink-0"
          style={{ color: node.color }}
        />

        {/* Tag name */}
        <span className="flex-1 text-left truncate">
          {node.name}
        </span>

        {/* Count - total for parent tags, exact for leaf tags */}
        <span className="text-xs text-[#6b6b6b] tabular-nums">
          {totalNotes}
        </span>
      </button>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {node.children.map(child => (
            <TagTreeNode
              key={child.path}
              node={child}
              onTagClick={onTagClick}
              selectedPath={selectedPath}
              defaultExpanded={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
