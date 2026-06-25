import { useState } from 'react';
import Modal from './Modal';

export default function RenameModal({ user, onSave, onClose }) {
  const [name, setName] = useState(user.name);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(user.id, name.trim());
    onClose();
  }

  return (
    <Modal title="Rename profile" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-3">
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
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
