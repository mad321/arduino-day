import { useState } from 'react';
import Modal from './Modal';

export default function LogDoseModal({ peptide, onLog, onClose }) {
  const [time, setTime] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
  });
  const [note, setNote] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onLog({
      id: crypto.randomUUID(),
      peptideId: peptide.id,
      userId: peptide.userId,
      takenAt: new Date(time).toISOString(),
      dosage: peptide.dosage,
      unit: peptide.unit,
      note: note.trim(),
    });
    onClose();
  }

  return (
    <Modal title={`Log dose — ${peptide.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
          <span className="font-medium text-gray-800">{peptide.dosage} {peptide.unit}</span>
          {peptide.notes && <p className="mt-1 text-xs">{peptide.notes}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time taken</label>
          <input
            type="datetime-local"
            required
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
          <input
            type="text"
            placeholder="Injection site, reaction, etc."
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
          >
            Log dose
          </button>
        </div>
      </form>
    </Modal>
  );
}
