import { FileText } from 'lucide-react';
import { NoteEditor } from '../../components/NoteEditor';

interface NoteDetailProps {
  noteId: number | null;
  onBack: () => void;
  onDelete: (id: number) => void;
}

export function NoteDetail({ noteId, onBack, onDelete }: NoteDetailProps) {
  if (!noteId) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-mb-base text-center text-mb-muted">
        <div>
          <FileText size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Select a note to read</p>
        </div>
      </div>
    );
  }

  return (
    <NoteEditor
      key={noteId}
      noteId={noteId}
      onBack={onBack}
      onDelete={onDelete}
    />
  );
}
