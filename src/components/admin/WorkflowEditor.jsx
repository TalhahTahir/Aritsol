import { useMemo, useRef, useState } from 'react';
import { FiAlertCircle, FiArrowDown, FiArrowUp, FiPlus, FiTrash2 } from 'react-icons/fi';
import { TYPES, sanitize } from '../../../shared/schema.js';
import { saveProcess, useContent } from '../../content/store';
import { adminUi } from '../../admin/ui';
import Modal from './Modal.jsx';
import s from './Admin.module.css';

/** Edit the whole workflow at once: add, remove, reorder and reword the steps. */
export default function WorkflowEditor() {
  const { process } = useContent();
  const start = useMemo(() => process.map(({ title, desc }) => ({ title, desc })), [process]);
  const [steps, setSteps] = useState(start);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [askDiscard, setAskDiscard] = useState(false);
  const formRef = useRef(null);
  const dirty = JSON.stringify(steps) !== JSON.stringify(start);
  const close = () => (dirty && !askDiscard ? setAskDiscard(true) : adminUi.closeWorkflow());

  const edit = (i, key, v) => {
    setSteps((x) => x.map((st, j) => (j === i ? { ...st, [key]: v } : st)));
    setErrors((e) => {
      const next = { ...e };
      delete next[`${i}.${key}`];
      return next;
    });
  };
  const move = (i, d) =>
    setSteps((x) => {
      const next = [...x];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });
  const add = () => {
    setSteps((x) => [...x, { title: '', desc: '' }]);
    requestAnimationFrame(() => formRef.current?.querySelector(`[data-field="${steps.length}.title"]`)?.focus());
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    steps.forEach((st, i) => Object.entries(sanitize('process', st).errors).forEach(([k, m]) => (errs[`${i}.${k}`] = m)));
    if (!steps.length) errs.steps = 'Add at least one step.';
    if (Object.keys(errs).length) {
      setErrors(errs);
      formRef.current?.querySelector(`[data-field="${Object.keys(errs)[0]}"]`)?.focus();
      return;
    }
    setBusy(true);
    setFormError('');
    try {
      await saveProcess(steps);
      adminUi.closeWorkflow();
      adminUi.toast('Workflow saved');
    } catch (err) {
      setBusy(false);
      setFormError(err.message);
      if (err.fields) setErrors(err.fields);
    }
  };

  const max = 12;
  const field = TYPES.process.fields;

  return (
    <Modal
      title="Edit workflow"
      subtitle={TYPES.process.help}
      onClose={close}
      size="lg"
      footer={
        askDiscard ? (
          <div className={s.footRow}>
            <span className={s.footNote}>Discard your changes?</span>
            <button type="button" className="btn btn--ghost" onClick={() => setAskDiscard(false)}>
              Keep editing
            </button>
            <button type="button" className={`btn ${s.dangerBtn}`} onClick={adminUi.closeWorkflow}>
              Discard
            </button>
          </div>
        ) : (
          <div className={s.footRow}>
            <span className={s.footNote}>
              {steps.length} step{steps.length === 1 ? '' : 's'}
            </span>
            <button type="button" className="btn btn--ghost" onClick={close}>
              Cancel
            </button>
            <button type="submit" form="admin-workflow-form" className="btn btn--accent" disabled={busy}>
              {busy ? 'Saving…' : 'Save workflow'}
            </button>
          </div>
        )
      }
    >
      <form id="admin-workflow-form" ref={formRef} className={s.form} onSubmit={submit} noValidate>
        <div className={s.rows}>
          {steps.map((st, i) => (
            <div key={i} className={s.row}>
              <span className={s.rowNum}>{i + 1}</span>
              <div className={s.rowFields}>
                {field.map((f) => {
                  const key = `${i}.${f.name}`;
                  const props = {
                    'data-field': key,
                    'aria-label': `${f.label} ${i + 1}`,
                    'aria-invalid': errors[key] ? true : undefined,
                    className: `${s.input} ${f.type === 'textarea' ? s.textareaSm : ''}`,
                    placeholder: f.type === 'textarea' ? 'What happens in this step' : 'Step name',
                    maxLength: f.max,
                    value: st[f.name],
                    onChange: (e) => edit(i, f.name, e.target.value),
                  };
                  return (
                    <div key={f.name}>
                      {f.type === 'textarea' ? <textarea rows={2} {...props} /> : <input type="text" {...props} />}
                      {errors[key] && (
                        <p className={s.err}>
                          <FiAlertCircle aria-hidden /> {errors[key]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className={s.rowTools}>
                <button type="button" className={s.iconBtn} onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move step ${i + 1} up`}>
                  <FiArrowUp />
                </button>
                <button type="button" className={s.iconBtn} onClick={() => move(i, 1)} disabled={i === steps.length - 1} aria-label={`Move step ${i + 1} down`}>
                  <FiArrowDown />
                </button>
                <button
                  type="button"
                  className={s.iconBtn}
                  onClick={() => setSteps((x) => x.filter((_, j) => j !== i))}
                  disabled={steps.length === 1}
                  aria-label={`Remove step ${i + 1}`}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
          {steps.length < max && (
            <button type="button" className={s.addRow} onClick={add}>
              <FiPlus aria-hidden /> Add step
            </button>
          )}
        </div>
        {(formError || errors.steps) && (
          <p className={s.formError} role="alert">
            <FiAlertCircle aria-hidden /> {formError || errors.steps}
          </p>
        )}
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}
