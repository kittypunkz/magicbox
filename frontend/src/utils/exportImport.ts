import type { Note } from '../types';

/**
 * Export a single note as a markdown file
 */
export function exportNoteAsMarkdown(note: Note): void {
  const filename = sanitizeFilename(note.title) + '.md';
  const content = note.content || '';
  
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export multiple notes as separate markdown files (zipped would need a library)
 * For now, export as individual files triggered one by one
 */
export function exportNotesAsMarkdown(notes: Note[]): void {
  // Create a combined markdown file with all notes
  const combined = notes.map(note => {
    const header = `# ${note.title}\n\n`;
    const meta = `<!-- Folder: ${note.folder_name || 'Inbox'} | Created: ${note.created_at} -->\n\n`;
    return header + meta + (note.content || '');
  }).join('\n\n---\n\n');
  
  const filename = `magicbox-export-${new Date().toISOString().slice(0, 10)}.md`;
  const blob = new Blob([combined], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import a markdown file and return its content
 */
export function importMarkdownFile(): Promise<{ title: string; content: string }> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown,.txt';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        // Use filename as title (without extension)
        const title = file.name.replace(/\.(md|markdown|txt)$/i, '');
        resolve({ title, content });
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    };
    
    input.click();
  });
}

/**
 * Sanitize a string for use as a filename
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 200);
}
