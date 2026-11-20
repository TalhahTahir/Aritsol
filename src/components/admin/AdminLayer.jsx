import { Suspense, lazy, useState } from 'react';
import { FiAlertTriangle, FiBox, FiBriefcase, FiCheck, FiGrid, FiList, FiLogOut, FiShield } from 'react-icons/fi';
import { logout, useAdmin } from '../../content/store';
import { adminUi, useAdminUi } from '../../admin/ui';
import AdminLogin from './AdminLogin.jsx';
import Modal from './Modal.jsx';
import s from './Admin.module.css';

// the editors are only downloaded by admins
const ItemEditor = lazy(() => import('./ItemEditor.jsx'));
const WorkflowEditor = lazy(() => import('./WorkflowEditor.jsx'));

/** Everything admin that floats above the page: login, admin bar, editors, confirmations, toasts. */
export default function AdminLayer() {
  const ui = useAdminUi();
  const { isAdmin } = useAdmin();

  return (
    <>
      {ui.login && !isAdmin && <AdminLogin />}
      {isAdmin && <AdminBar />}
      <Suspense fallback={null}>
        {isAdmin && ui.editor && <ItemEditor key={ui.editor.item?._id || ui.editor.type} type={ui.editor.type} item={ui.editor.item} />}
        {isAdmin && ui.workflow && <WorkflowEditor />}
      </Suspense>
      {ui.confirm && <Confirm {...ui.confirm} />}
      {ui.toasts.length > 0 && (
        <div className={s.toasts} role="status" aria-live="polite">
          {ui.toasts.map((t) => (
            <p key={t.id} className={`${s.toast} ${t.kind === 'error' ? s.toastError : ''}`}>
              {t.kind === 'error' ? <FiAlertTriangle aria-hidden /> : <FiCheck aria-hidden />} {t.message}
            </p>
          ))}
        </div>
      )}
    </>
  );
}

function AdminBar() {
  const { live } = useAdmin();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    await logout();
    window.location.reload();
  };

  const act = (fn) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div className={`${s.bar} ${open ? s.barOpen : ''}`} data-fluid-off>
      <button type="button" className={s.barBadge} onClick={() => setOpen((x) => !x)} aria-expanded={open} aria-controls="admin-bar-menu">
        <FiShield aria-hidden /> Admin
      </button>
      <div id="admin-bar-menu" className={s.barMenu}>
        {live ? (
          <>
            <button type="button" onClick={act(() => adminUi.openEditor('work'))}>
              <FiBriefcase aria-hidden /> Add project
            </button>
            <button type="button" onClick={act(() => adminUi.openEditor('products'))}>
              <FiBox aria-hidden /> Add product
            </button>
            <button type="button" onClick={act(() => adminUi.openEditor('practices'))}>
              <FiGrid aria-hidden /> Add service
            </button>
            <button type="button" onClick={act(adminUi.openWorkflow)}>
              <FiList aria-hidden /> Workflow
            </button>
          </>
        ) : (
          <span className={s.barWarn}>
            <FiAlertTriangle aria-hidden /> Content could not be loaded from the database
          </span>
        )}
        <button type="button" className={s.barOut} onClick={signOut} disabled={busy}>
          <FiLogOut aria-hidden /> Log out
        </button>
      </div>
    </div>
  );
}

function Confirm({ title, message, confirmLabel = 'Delete', resolve }) {
  return (
    <Modal
      title={title}
      onClose={() => resolve(false)}
      size="sm"
      role="alertdialog"
      footer={
        <div className={s.footRow}>
          <button type="button" className="btn btn--ghost" onClick={() => resolve(false)} data-autofocus>
            Cancel
          </button>
          <button type="button" className={`btn ${s.dangerBtn}`} onClick={() => resolve(true)}>
            {confirmLabel}
          </button>
        </div>
      }
    >
      <p className={s.confirmText}>{message}</p>
    </Modal>
  );
}
