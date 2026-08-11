import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getManagerId,
  setManagerId,
  clearManagerId,
  getDraftLeagueId,
  setDraftLeagueId,
  clearDraftLeagueId,
} from '../lib/storage';
import { fetchManagerEntry } from '../lib/fplLiveClient';

export default function Settings() {
  const [input, setInput] = useState(getManagerId() ?? '');
  const [status, setStatus] = useState<'idle' | 'checking' | 'error' | 'saved'>('idle');
  const [message, setMessage] = useState('');
  const [draftInput, setDraftInput] = useState(getDraftLeagueId() ?? '');
  const [draftMessage, setDraftMessage] = useState('');
  const navigate = useNavigate();

  function handleSaveDraft() {
    const id = draftInput.trim();
    if (!/^\d+$/.test(id)) {
      setDraftMessage('');
      return;
    }
    // Not verified against the Draft API here — that endpoint is unreliable from a browser,
    // so the Draft Board reports sync problems itself rather than blocking you from saving.
    setDraftLeagueId(id);
    setDraftMessage('Saved. Use "Sync league" on the Draft Board to pull owned players.');
  }

  function handleClearDraft() {
    clearDraftLeagueId();
    setDraftInput('');
    setDraftMessage('');
  }

  async function handleSave() {
    const id = input.trim();
    if (!/^\d+$/.test(id)) {
      setStatus('error');
      setMessage('Manager ID should be numbers only, e.g. 1234567.');
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
        Find this in the FPL site's "Points" or "Pick Team" URL (e.g. <code>/entry/1234567/...</code>), or via
        DevTools → Network → the <code>/api/me/</code> request's <code>entry</code> field.
      </p>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="e.g. 1234567"
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

      <hr className="border-white/10" />

      <h2 className="font-semibold text-lg">Draft League ID (optional)</h2>
      <p className="text-sm text-slate-400">
        Only for the separate <a href="https://draft.premierleague.com" className="text-accent underline">FPL Draft</a>{' '}
        game. Lets the Draft Board auto-mark players already owned in your league. The board works fine without it —
        you can just mark picks yourself.
      </p>
      <input
        value={draftInput}
        onChange={(e) => setDraftInput(e.target.value)}
        placeholder="e.g. 4321"
        className="w-full bg-white/5 border border-white/20 rounded-md px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSaveDraft}
          className="bg-accent text-pitch font-semibold px-4 py-2 rounded-md text-sm"
        >
          Save
        </button>
        <button
          onClick={handleClearDraft}
          className="px-4 py-2 rounded-md text-sm border border-white/20 hover:bg-white/10"
        >
          Clear
        </button>
      </div>
      {draftMessage && <p className="text-sm text-emerald-400">{draftMessage}</p>}
    </div>
  );
}
