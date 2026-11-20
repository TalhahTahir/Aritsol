import { FiArrowDown, FiArrowUp, FiEdit2, FiList, FiPlus, FiTrash2 } from 'react-icons/fi';
import { TYPES } from '../../../shared/schema.js';
import { deleteItem, moveItem, useAdmin, useContent } from '../../content/store';
import { adminUi } from '../../admin/ui';
import s from './Admin.module.css';

/**
 * Edit / move / delete buttons for one product, project or service.
 * Renders nothing for visitors. Put it inside an element with position: relative.
 */
export function AdminItemTools({ type, item, onDeleted, inline = false }) {
  const { isAdmin } = useAdmin();
  const content = useContent();
  if (!isAdmin || !item?._id) return null;

  const list = content[type];
  const i = list.findIndex((x) => x._id === item._id);
  const name = item[TYPES[type].titleField];
  const label = TYPES[type].label;

  const move = (dir) => moveItem(type, item._id, dir).catch((err) => adminUi.toast(err.message, 'error'));

  const remove = async () => {
    const ok = await adminUi.confirm({
      title: `Delete this ${label}?`,
      message: `“${name}” will be removed from the website. This cannot be undone.`,
      confirmLabel: `Delete ${label}`,
    });
    if (!ok) return;
    try {
      await deleteItem(type, item._id);
      adminUi.toast(`${name} deleted`);
      onDeleted?.();
    } catch (err) {
      adminUi.toast(err.message, 'error');
    }
  };

  // stop clicks reaching links or cards underneath
  const guard = (fn) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  return (
    <div className={`${s.tools} ${inline ? s.toolsInline : ''}`} role="group" aria-label={`Admin: ${name}`} data-fluid-off>
      <button type="button" onClick={guard(() => adminUi.openEditor(type, item))} title={`Edit ${label}`}>
        <FiEdit2 aria-hidden /> <span>Edit</span>
      </button>
      <button type="button" onClick={guard(() => move(-1))} disabled={i <= 0} aria-label={`Move ${name} earlier`} title="Move earlier">
        <FiArrowUp aria-hidden />
      </button>
      <button type="button" onClick={guard(() => move(1))} disabled={i < 0 || i >= list.length - 1} aria-label={`Move ${name} later`} title="Move later">
        <FiArrowDown aria-hidden />
      </button>
      <button type="button" className={s.toolDanger} onClick={guard(remove)} aria-label={`Delete ${name}`} title={`Delete ${label}`}>
        <FiTrash2 aria-hidden />
      </button>
    </div>
  );
}

const ADD_LABEL = { work: 'Add project', products: 'Add product', practices: 'Add service' };

/** A dashed "Add …" button, shown only to admins. */
export function AdminAdd({ type, className = '', compact = false }) {
  const { isAdmin, live } = useAdmin();
  if (!isAdmin || !live) return null;
  return (
    <button
      type="button"
      className={`${compact ? s.addCompact : s.addCard} ${className}`}
      onClick={() => adminUi.openEditor(type)}
      data-fluid-off
    >
      <FiPlus aria-hidden /> {ADD_LABEL[type]}
    </button>
  );
}

/** "Edit workflow" button next to the process steps. */
export function AdminEditWorkflow({ className = '' }) {
  const { isAdmin, live } = useAdmin();
  if (!isAdmin || !live) return null;
  return (
    <button type="button" className={`${s.addCompact} ${className}`} onClick={adminUi.openWorkflow} data-fluid-off>
      <FiList aria-hidden /> Edit workflow
    </button>
  );
}
