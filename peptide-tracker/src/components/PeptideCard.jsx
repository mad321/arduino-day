import { formatRelative, formatNextDue, isDueNow } from '../utils/time';

export default function PeptideCard({ peptide, lastDose, userColor, onLog, onEdit, onDelete }) {
  const due = isDueNow(lastDose?.takenAt, peptide.frequencyHours);
  const nextLabel = formatNextDue(lastDose?.takenAt, peptide.frequencyHours);

  const borderColor = userColor === 'blue' ? 'border-blue-200' : 'border-pink-200';
  const badgeBg = due ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';

  return (
    <div className={`bg-white rounded-xl border-2 ${borderColor} p-4 flex flex-col gap-3 shadow-sm`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900 text-base">{peptide.name}</h3>
          <p className="text-sm text-gray-500">{peptide.dosage} {peptide.unit}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${badgeBg}`}>
          {nextLabel}
        </span>
      </div>

      {lastDose ? (
        <p className="text-xs text-gray-400">
          Last dose: {formatRelative(lastDose.takenAt)}
        </p>
      ) : (
        <p className="text-xs text-gray-400 italic">No doses logged yet</p>
      )}

      {peptide.notes && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">{peptide.notes}</p>
      )}

      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => onLog(peptide)}
          className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            due
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          Log dose
        </button>
        <button
          onClick={() => onEdit(peptide)}
          className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(peptide.id)}
          className="px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-50"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
