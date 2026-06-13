import React, { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';

interface ContactNotesEditorProps {
  contactId: string;
  initialNotes: string;
  onSave: (id: string, notes: string) => void;
}

export default function ContactNotesEditor({ contactId, initialNotes, onSave }: ContactNotesEditorProps) {
  const [localNotes, setLocalNotes] = useState(initialNotes || "");
  const debouncedNotes = useDebounce(localNotes, 500);

  // Sync local state when initialNotes changes
  useEffect(() => {
    setLocalNotes(initialNotes || "");
  }, [initialNotes]);

  // Trigger sync to DB when debouncedNotes changes
  useEffect(() => {
    if (debouncedNotes !== (initialNotes || "")) {
      onSave(contactId, debouncedNotes);
    }
  }, [debouncedNotes]);

  return (
    <textarea 
      value={localNotes} 
      onChange={e => setLocalNotes(e.target.value)}
      placeholder="Escribe detalles del lead o notas de seguimiento (Guarda automáticamente)..."
      rows={2}
      className="w-full bg-[#142036]/60 border border-[#1e2d44] rounded-xl px-2 py-1.5 text-xs text-slate-350 focus:outline-none focus:border-cyan-500 transition resize-none leading-relaxed"
    />
  );
}
