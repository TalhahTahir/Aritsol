import { useState } from 'react';
import { FiAlertCircle, FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import { login } from '../../content/store';
import { adminUi } from '../../admin/ui';
import Modal from './Modal.jsx';
import s from './Admin.module.css';

/** Email + password. On success the page reloads with admin controls on. */
export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter the admin email and password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await login(email.trim(), password);
      window.location.reload();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title="Admin controls" subtitle="Sign in to add and edit products, work, services and the workflow." onClose={adminUi.closeLogin} size="sm">
      <form className={s.form} onSubmit={submit} noValidate>
        <div className={s.field}>
          <label htmlFor="admin-email" className={s.label}>
            Email
          </label>
          <input
            id="admin-email"
            className={s.input}
            type="email"
            autoComplete="username"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-autofocus
          />
        </div>
        <div className={s.field}>
          <label htmlFor="admin-password" className={s.label}>
            Password
          </label>
          <div className={s.pwWrap}>
            <input
              id="admin-password"
              className={s.input}
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" className={s.pwToggle} onClick={() => setShow((x) => !x)} aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>
        {error && (
          <p className={s.formError} role="alert">
            <FiAlertCircle aria-hidden /> {error}
          </p>
        )}
        <button type="submit" className={`btn btn--accent ${s.wide}`} disabled={busy}>
          <FiLock aria-hidden /> {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </Modal>
  );
}
