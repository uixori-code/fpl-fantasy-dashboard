import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getManagerId, setManagerId, clearManagerId } from '../lib/storage';
import { fetchManagerEntry } from '../lib/fplLiveClient';

export default function Settings() {
  const [input, setInput] = useState(getManagerId() ?? '');
  const [status, setStatus] = useState<'idle' | 'checking' | 'error' | 'saved'>('idle');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  async function handleSave() {
    const id = input.trim();
    if (!/^\d+$/.test(id)) {
      setStatus('error');
      setMessage('Manager ID should be numbers only, e.g. 486265.');
      return;
    }

    setStatus('checking');
    setMessage('Verifying manager ID…');
    try {
      const entry = await fetchManagerEntry(id);
      setManagerId(id);
      setStatus('saved');
      setMessage(`Saved! Found team "${entry.name}".`);
      setTimeout(() => navigate('/my-team'), 800);
    } catch {
      setStatus('error');
      setMessage("Couldn't verify that ID against the FPL API. Double-check the number and try again.");
    }
  }

  function handleClear() {
    clearManagerId();
    setInput('');
    setStatus('idle');
    setMessage('');
  }

  return (
    <div className="max-w-md space-y-4">
      <h2 className="font-semibold text-lg">My FPL Manager ID</h2>
      <p className="text-sm text-slate-400">
        Find this in the FPL site's "Points" or "Pick Team" URL (e.g. <code>/entry/486265/...</code>), or via
        DevTools → Network → the <code>/api/me/</code> request's <code>entry</code> field.
      </p>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="e.g. 486265"
        className="w-full bg-white/5 border border-white/20 rounded-md px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={status === 'checking'}
          className="bg-accent text-pitch font-semibold px-4 py-2 rounded-md text-sm disabled:opacity-50"
        >
          {status === 'checking' ? 'Checking…' : 'Save'}
        </button>
        <button onClick={handleClear} className="px-4 py-2 rounded-md text-sm border border-white/20 hover:bg-white/10">
          Clear
        </button>
      </div>
      {message && (
        <p className={`text-sm ${status === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>{message}</p>
      )}
    </div>
  );
}
