import './DeleteTeamModal.css';

interface DeleteTeamModalProps {
  teamName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteTeamModal({ teamName, onConfirm, onCancel }: DeleteTeamModalProps) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
      <div className="modal-content delete-modal">
        <h2 id="delete-modal-title" className="modal-title">Delete team</h2>
        <p className="modal-message">
          Are you sure you want to delete <strong>{teamName}</strong>? This action cannot be undone.
        </p>
        <div className="modal-actions">
          <button type="button" className="modal-btn modal-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="modal-btn modal-btn-delete" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
