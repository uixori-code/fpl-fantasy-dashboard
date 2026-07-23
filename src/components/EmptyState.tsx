import type { ReactNode } from 'react';

export default function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="bg-white/5 border border-dashed border-white/20 rounded-lg p-8 text-center">
      <div className="font-semibold text-slate-200">{title}</div>
      {children && <div className="text-sm text-slate-400 mt-2">{children}</div>}
    </div>
  );
}
