import { useState, useEffect } from 'react';
import { loadState, saveState, defaultState } from './utils/storage';
import { isDueNow } from './utils/time';
import PeptideCard from './components/PeptideCard';
import AddPeptideModal from './components/AddPeptideModal';
import LogDoseModal from './components/LogDoseModal';
import HistoryView from './components/HistoryView';
import RenameModal from './components/RenameModal';
import './index.css';

const TABS = ['Dashboard', 'History'];

export default function App() {
  const [state, setState] = useState(() => loadState() || defaultState());
  const [tab, setTab] = useState('Dashboard');
  const [activeUser, setActiveUser] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [logPeptide, setLogPeptide] = useState(null);
  const [renameUser, setRenameUser] = useState(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  function mutate(fn) {
    setState(s => fn(s));
  }

  function addOrUpdatePeptide(peptide) {
    mutate(s => {
      const exists = s.peptides.find(p => p.id === peptide.id);
      return {
        ...s,
        peptides: exists
          ? s.peptides.map(p => p.id === peptide.id ? peptide : p)
          : [...s.peptides, peptide],
      };
    });
  }

  function deletePeptide(id) {
    if (!window.confirm('Delete this peptide and all its dose history?')) return;
    mutate(s => ({
      ...s,
      peptides: s.peptides.filter(p => p.id !== id),
      doses: s.doses.filter(d => d.peptideId !== id),
    }));
  }

  function logDose(dose) {
    mutate(s => ({ ...s, doses: [...s.doses, dose] }));
  }

  function deleteDose(id) {
    mutate(s => ({ ...s, doses: s.doses.filter(d => d.id !== id) }));
  }

  function renameUserProfile(id, name) {
    mutate(s => ({
      ...s,
      users: s.users.map(u => u.id === id ? { ...u, name } : u),
    }));
  }

  function getLastDose(peptideId) {
    const all = state.doses
      .filter(d => d.peptideId === peptideId)
      .sort((a, b) => new Date(b.takenAt) - new Date(a.takenAt));
    return all[0] || null;
  }

  const filteredPeptides = activeUser
    ? state.peptides.filter(p => p.userId === activeUser)
    : state.peptides;

  const totalDue = state.peptides.filter(p => {
    const last = getLastDose(p.id);
    return isDueNow(last?.takenAt, p.frequencyHours);
  }).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💉</span>
            <h1 className="text-lg font-bold text-gray-900">Peptide Tracker</h1>
            {totalDue > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalDue}
              </span>
            )}
          </div>
          <nav className="flex gap-1">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === t ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {tab === 'Dashboard' && (
          <>
            {/* Person filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveUser(null)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  activeUser === null
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              {state.users.map(u => {
                const userDue = state.peptides
                  .filter(p => p.userId === u.id)
                  .filter(p => isDueNow(getLastDose(p.id)?.takenAt, p.frequencyHours)).length;

                const activeStyle = u.color === 'blue'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-pink-500 text-white border-pink-500';

                return (
                  <div key={u.id} className="flex-1 flex gap-1">
                    <button
                      onClick={() => setActiveUser(activeUser === u.id ? null : u.id)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors flex items-center justify-center gap-1.5 ${
                        activeUser === u.id ? activeStyle : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {u.name}
                      {userDue > 0 && (
                        <span className={`text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center ${
                          activeUser === u.id ? 'bg-white text-gray-800' : 'bg-red-500 text-white'
                        }`}>
                          {userDue}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setRenameUser(u)}
                      className="w-8 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50 text-xs flex items-center justify-center"
                      title="Rename"
                    >
                      ✎
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Peptides', value: filteredPeptides.length },
                {
                  label: 'Due now',
                  value: filteredPeptides.filter(p => isDueNow(getLastDose(p.id)?.takenAt, p.frequencyHours)).length,
                  red: true,
                },
                {
                  label: 'Doses today',
                  value: state.doses.filter(d => {
                    if (activeUser) {
                      const p = state.peptides.find(pp => pp.id === d.peptideId);
                      if (p?.userId !== activeUser) return false;
                    }
                    const today = new Date(); today.setHours(0, 0, 0, 0);
                    return new Date(d.takenAt) >= today;
                  }).length,
                },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
                  <p className={`text-2xl font-bold ${s.red && s.value > 0 ? 'text-red-500' : 'text-gray-900'}`}>
                    {s.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Cards */}
            {filteredPeptides.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-5xl mb-3">💊</p>
                <p className="font-medium text-gray-600">No peptides added yet</p>
                <p className="text-sm mt-1">Click "Add peptide" below to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredPeptides.map(p => {
                  const user = state.users.find(u => u.id === p.userId);
                  return (
                    <PeptideCard
                      key={p.id}
                      peptide={p}
                      lastDose={getLastDose(p.id)}
                      userColor={user?.color}
                      onLog={setLogPeptide}
                      onEdit={item => { setEditItem(item); setShowAdd(true); }}
                      onDelete={deletePeptide}
                    />
                  );
                })}
              </div>
            )}

            <button
              onClick={() => { setEditItem(null); setShowAdd(true); }}
              className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              + Add peptide
            </button>
          </>
        )}

        {tab === 'History' && (
          <HistoryView
            doses={state.doses}
            peptides={state.peptides}
            users={state.users}
            onDeleteDose={deleteDose}
          />
        )}
      </main>

      {showAdd && (
        <AddPeptideModal
          users={state.users}
          editItem={editItem}
          onAdd={addOrUpdatePeptide}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
        />
      )}
      {logPeptide && (
        <LogDoseModal
          peptide={logPeptide}
          onLog={logDose}
          onClose={() => setLogPeptide(null)}
        />
      )}
      {renameUser && (
        <RenameModal
          user={renameUser}
          onSave={renameUserProfile}
          onClose={() => setRenameUser(null)}
        />
      )}
    </div>
  );
}
