import { formatDateTime } from '../utils/time';

export default function HistoryView({ doses, peptides, users, onDeleteDose }) {
  const sorted = [...doses].sort((a, b) => new Date(b.takenAt) - new Date(a.takenAt));

  function getPeptide(id) {
    return peptides.find(p => p.id === id);
  }

  function getUser(id) {
    return users.find(u => u.id === id);
  }

  if (sorted.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">📋</p>
        <p>No doses logged yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map(dose => {
        const peptide = getPeptide(dose.peptideId);
        const user = getUser(dose.userId);
        if (!peptide || !user) return null;

        const dotColor = user.color === 'blue' ? 'bg-blue-500' : 'bg-pink-500';

        return (
          <div key={dose.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900 text-sm">{peptide.name}</span>
                <span className="text-xs text-gray-500">{dose.dosage} {dose.unit}</span>
                <span className="text-xs text-gray-400">— {user.name}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-gray-400">{formatDateTime(dose.takenAt)}</span>
                {dose.note && <span className="text-xs text-gray-500 italic">"{dose.note}"</span>}
              </div>
            </div>
            <button
              onClick={() => onDeleteDose(dose.id)}
              className="text-gray-300 hover:text-red-400 text-sm flex-shrink-0 ml-2"
              title="Remove log entry"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
