import { useState } from 'react';
import Modal from './Modal';

const FREQUENCIES = [
  { label: 'Once daily', value: 24 },
  { label: 'Twice daily (12h)', value: 12 },
  { label: 'Every other day (48h)', value: 48 },
  { label: 'Every 3 days (72h)', value: 72 },
  { label: 'Weekly (168h)', value: 168 },
  { label: 'Custom', value: 'custom' },
];

const UNITS = ['mcg', 'mg', 'IU', 'units'];

export default function AddPeptideModal({ users, onAdd, onClose, editItem }) {
  const [form, setForm] = useState(editItem || {
    name: '',
    dosage: '',
    unit: 'mcg',
    userId: users[0].id,
    frequencyHours: 24,
    customFreq: '',
    notes: '',
  });

  const freqIsCustom = form.frequencyHours === 'custom';

  function set(k, v) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const freqHours = freqIsCustom ? Number(form.customFreq) : Number(form.frequencyHours);
    if (!form.name.trim() || !form.dosage || !freqHours) return;
    onAdd({
      id: editItem?.id || crypto.randomUUID(),
      name: form.name.trim(),
      dosage: form.dosage,
      unit: form.unit,
      userId: form.userId,
      frequencyHours: freqHours,
      notes: form.notes.trim(),
    });
    onClose();
  }

  return (
    <Modal title={editItem ? 'Edit Peptide' : 'Add Peptide'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">For</label>
          <div className="flex gap-2">
            {users.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => set('userId', u.id)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  form.userId === u.id
                    ? u.color === 'blue'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-pink-500 text-white border-pink-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Peptide name</label>
          <input
            type="text"
            required
            placeholder="e.g. BPC-157, TB-500, CJC-1295"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
            <input
              type="number"
              required
              min="0"
              step="any"
              placeholder="e.g. 250"
              value={form.dosage}
              onChange={e => set('dosage', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-24">
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select
              value={form.unit}
              onChange={e => set('unit', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
          <select
            value={form.frequencyHours}
            onChange={e => set('frequencyHours', e.target.value === 'custom' ? 'custom' : Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>

        {freqIsCustom && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom frequency (hours)</label>
            <input
              type="number"
              required
              min="1"
              value={form.customFreq}
              onChange={e => set('customFreq', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea
            placeholder="Reconstitution info, injection site, etc."
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
            className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            {editItem ? 'Save changes' : 'Add peptide'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
