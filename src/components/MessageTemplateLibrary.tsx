import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MessageTemplate } from '../types';
import { Plus, Trash2, Save, X, BookOpen } from 'lucide-react';

interface Props {
  onSelect?: (content: string) => void;
}

export default function MessageTemplateLibrary({ onSelect }: Props) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    const { data, error } = await supabase.from('message_templates').select('*').order('created_at', { ascending: false });
    if (data) setTemplates(data);
  }

  async function saveTemplate() {
    if (!name || !content) return;
    await supabase.from('message_templates').insert({ name, content });
    setName('');
    setContent('');
    setIsAdding(false);
    fetchTemplates();
  }

  async function deleteTemplate(id: string) {
    await supabase.from('message_templates').delete().eq('id', id);
    fetchTemplates();
  }

  return (
    <div className="bg-[#0e1422] border border-[#1e2d44] rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-500" /> Biblioteca de Plantillas
        </h2>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-cyan-500 text-[#090c14] px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-cyan-400">
            <Plus className="w-4 h-4" /> Nueva
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-[#080c14] p-4 rounded-xl mb-4 border border-[#1e2d44]">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre/Etiqueta" className="w-full bg-transparent border-b border-[#1e2d44] mb-2 p-1 text-white text-sm outline-none" />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Contenido del mensaje..." rows={3} className="w-full bg-transparent border border-[#1e2d44] rounded-lg p-2 mb-2 text-white text-xs outline-none" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsAdding(false)} className="text-slate-400 text-sm hover:text-white"><X className="w-4 h-4" /></button>
            <button onClick={saveTemplate} className="text-cyan-500 text-sm font-semibold hover:text-cyan-400"><Save className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {templates.map(t => (
          <div key={t.id} className="bg-[#080c14] p-4 rounded-xl border border-[#1e2d44] flex justify-between items-start group">
            <div onClick={() => onSelect?.(t.content)} className="cursor-pointer flex-1">
              <h3 className="text-sm font-bold text-white">{t.name}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.content}</p>
            </div>
            <button onClick={() => deleteTemplate(t.id)} className="text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
