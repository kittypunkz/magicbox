/**
 * Tag Tree Utility
 * 
 * Builds a hierarchical tree structure from flat tag paths like 'work/client/apple'.
 * Tags are stored flat in the DB but rendered as a tree in the UI.
 */

export interface TagNode {
  /** Full path e.g. "work/client/apple" */
  path: string;
  /** Local name segment e.g. "apple" */
  name: string;
  /** Direct children */
  children: TagNode[];
  /** Note count for this exact tag (populated externally) */
  noteCount: number;
  /** Whether this tag is pinned */
  pinned: boolean;
  /** Color of this tag */
  color: string;
  /** Depth in the tree (0 = root) */
  depth: number;
  /** Whether this node is expanded in UI */
  expanded?: boolean;
}

export interface FlatTag {
  id: number;
  name: string;
  color: string;
  icon: string | null;
  pinned: number;
  note_count?: number;
}

/**
 * Build a tree from flat tags.
 * 
 * Tags like "work", "work/client", "work/client/apple" get organized into:
 * - work (depth 0)
 *   └─ client (depth 1)
 *       └─ apple (depth 2)
 */
export function buildTagTree(flatTags: FlatTag[]): TagNode[] {
  // Map from path to node
  const nodeMap = new Map<string, TagNode>();
  // Track which nodes have parents
  const childPaths = new Set<string>();

  // Sort tags by path length (parents before children)
  const sorted = [...flatTags].sort((a, b) => a.name.localeCompare(b.name));

  for (const tag of sorted) {
    const path = tag.name;
    const segments = path.split('/');
    const name = segments[segments.length - 1];
    const depth = segments.length - 1;

    // Create or update node
    const existing = nodeMap.get(path);
    const node: TagNode = existing || {
      path,
      name,
      children: [],
      noteCount: tag.note_count ?? 0,
      pinned: tag.pinned === 1,
      color: tag.color,
      depth,
      expanded: false,
    };

    if (!existing) {
      nodeMap.set(path, node);
    }

    // Link to parent if it exists
    if (depth > 0) {
      const parentPath = segments.slice(0, -1).join('/');
      const parent = nodeMap.get(parentPath);
      if (parent) {
        // Avoid duplicates
        if (!parent.children.find(c => c.path === path)) {
          parent.children.push(node);
        }
      }
      childPaths.add(path);
    }
  }

  // Sort children by name
  for (const node of nodeMap.values()) {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Return only root nodes (those without parents in the list)
  const roots: TagNode[] = [];
  for (const node of nodeMap.values()) {
    const segments = node.path.split('/');
    if (segments.length === 1) {
      roots.push(node);
    }
  }
  roots.sort((a, b) => {
    // Pinned first, then alphabetical
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return roots;
}

/**
 * Calculate recursive note count for a tag (includes all descendants).
 * The noteCount on each node is for that exact tag only.
 * This returns the sum of all descendants.
 */
export function getTotalNoteCount(node: TagNode): number {
  let total = node.noteCount;
  for (const child of node.children) {
    total += getTotalNoteCount(child);
  }
  return total;
}

/**
 * Flatten a tree to get all descendant paths.
 * Used for search queries like "SELECT * FROM tags WHERE name LIKE 'work/%'".
 */
export function getDescendantPaths(node: TagNode): string[] {
  const paths: string[] = [node.path];
  for (const child of node.children) {
    paths.push(...getDescendantPaths(child));
  }
  return paths;
}

/**
 * Get all paths that should be shown when clicking a tag.
 * Returns the tag itself plus all descendants.
 */
export function getSearchPaths(tagPath: string, tags: FlatTag[]): string[] {
  const paths = tags
    .map(t => t.name)
    .filter(name => name === tagPath || name.startsWith(tagPath + '/'));
  return paths;
}

/**
 * Generate SQL LIKE pattern for finding descendants.
 * e.g. "work" → "work/%"
 */
export function descendantPattern(tagPath: string): string {
  return `${tagPath}/%`;
}
