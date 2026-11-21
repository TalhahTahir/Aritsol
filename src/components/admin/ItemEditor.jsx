import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiArrowDown, FiArrowLeft, FiArrowRight, FiArrowUp, FiImage, FiPlus, FiTrash2, FiUploadCloud, FiX } from 'react-icons/fi';
import { TYPES, blank, getPath, sanitize, setPath } from '../../../shared/schema.js';
import { saveItem, uploadImage, useContent } from '../../content/store';
import { adminUi } from '../../admin/ui';
import Modal from './Modal.jsx';
import s from './Admin.module.css';

const where = (type, item) =>
  type === 'work' ? `/work#${item.id}` : type === 'products' ? `/products#${item.id}` : `/services/${item.slug}`;

/** Add or edit one product, project or service. The fields come from shared/schema.js. */
export default function ItemEditor({ type, item }) {
  const def = TYPES[type];
  const editing = !!item?._id;
  const navigate = useNavigate();
  const { practices } = useContent();
  // older items may miss newer fields: fill those with their defaults
  const start = useMemo(() => structuredClone({ ...blank(type), ...(item || {}) }), [item, type]);
  const [value, setValue] = useState(start);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [askDiscard, setAskDiscard] = useState(false);
  const formRef = useRef(null);

  const dirty = JSON.stringify(value) !== JSON.stringify(start);
  const close = () => (dirty && !askDiscard ? setAskDiscard(true) : adminUi.closeEditor());

  // v can be a value or a function of the current value (used by uploads that finish later)
  const update = (f, v) => {
    setValue((x) => {
      const path = f.path || f.name;
      return setPath(structuredClone(x), path, typeof v === 'function' ? v(getPath(x, path)) : v);
    });
    setErrors((e) => {
      const next = { ...e };
      Object.keys(next).forEach((k) => (k === f.name || k.startsWith(`${f.name}.`)) && delete next[k]);
      return next;
    });
  };

  const focusError = (errs) => {
    const first = Object.keys(errs)[0];
    if (!first) return;
    requestAnimationFrame(() => formRef.current?.querySelector(`[data-field="${first}"]`)?.focus());
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy || uploading) return;
    const check = sanitize(type, value);
    if (Object.keys(check.errors).length) {
      setErrors(check.errors);
      focusError(check.errors);
      return;
    }
    setBusy(true);
    setFormError('');
    try {
      const saved = await saveItem(type, { ...value, _id: item?._id });
      adminUi.closeEditor();
      adminUi.toast(editing ? `${saved[def.titleField]} updated` : `${saved[def.titleField]} added`);
      if (!editing) navigate(where(type, saved)); // show it in its section
    } catch (err) {
      setBusy(false);
      setFormError(err.message);
      if (err.fields) {
        setErrors(err.fields);
        focusError(err.fields);
      }
    }
  };

  const fieldProps = (f) => ({
    f,
    value: getPath(value, f.path || f.name),
    error: errors[f.name],
    errors,
    onChange: (v) => update(f, v),
    options: f.optionsFrom === 'practices' ? practices.map((p) => ({ value: p.slug, label: p.short })) : f.options,
    setUploading,
    folder: type,
  });

  const main = def.fields.filter((f) => f.type !== 'slug');
  const advanced = def.fields.filter((f) => f.type === 'slug');

  return (
    <Modal
      title={`${editing ? 'Edit' : 'Add'} ${def.label}`}
      subtitle={def.help}
      onClose={close}
      size="lg"
      footer={
        askDiscard ? (
          <div className={s.footRow}>
            <span className={s.footNote}>Discard your changes?</span>
            <button type="button" className="btn btn--ghost" onClick={() => setAskDiscard(false)}>
              Keep editing
            </button>
            <button type="button" className={`btn ${s.dangerBtn}`} onClick={adminUi.closeEditor}>
              Discard
            </button>
          </div>
        ) : (
          <div className={s.footRow}>
            <span className={s.footNote}>Press Enter in a one-line field to save.</span>
            <button type="button" className="btn btn--ghost" onClick={close}>
              Cancel
            </button>
            <button type="submit" form="admin-item-form" className="btn btn--accent" disabled={busy || uploading}>
              {busy ? 'Saving…' : uploading ? 'Uploading…' : editing ? 'Save changes' : `Add ${def.label}`}
            </button>
          </div>
        )
      }
    >
      <form id="admin-item-form" ref={formRef} className={s.form} onSubmit={submit} noValidate>
        {main.map((f) => (
          <Field key={f.name} {...fieldProps(f)} />
        ))}
        {advanced.length > 0 && (
          <details className={s.advanced}>
            <summary>Advanced</summary>
            {advanced.map((f) => (
              <Field key={f.name} {...fieldProps(f)} />
            ))}
          </details>
        )}
        {formError && (
          <p className={s.formError} role="alert">
            <FiAlertCircle aria-hidden /> {formError}
          </p>
        )}
        {/* lets Enter submit even though the visible button sits in the footer */}
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}

// ── fields ────────────────────────────────────────────────────

function Field({ f, value, error, errors, onChange, options, setUploading, folder }) {
  const id = `af-${f.name}`;
  const common = {
    id,
    'data-field': f.name,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-err` : f.help ? `${id}-help` : undefined,
  };

  let control;
  switch (f.type) {
    case 'textarea':
      control = (
        <textarea {...common} className={`${s.input} ${s.textarea}`} rows={f.max > 700 ? 6 : 4} maxLength={f.max} value={value || ''} onChange={(e) => onChange(e.target.value)} />
      );
      break;
    case 'select':
      control = (
        <select {...common} className={`${s.input} ${s.select}`} value={value || ''} onChange={(e) => onChange(e.target.value)}>
          {!f.default && <option value="">Choose…</option>}
          {(options || []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case 'bool':
      return (
        <label className={s.check}>
          <input {...common} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span>{f.label}</span>
        </label>
      );
    case 'list':
      control = (
        <textarea
          {...common}
          className={`${s.input} ${s.textarea}`}
          rows={Math.min(8, Math.max(3, (value || []).length + 1))}
          value={(value || []).join('\n')}
          onChange={(e) => onChange(e.target.value.split('\n'))}
          onBlur={(e) => onChange(e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))}
        />
      );
      break;
    case 'objectList':
      control = <ObjectList f={f} value={value || []} onChange={onChange} errors={errors} />;
      break;
    case 'gallery':
      control = <GalleryField f={f} common={common} value={value || []} onChange={onChange} setUploading={setUploading} folder={folder} />;
      break;
    case 'image':
      control = <ImageField f={f} common={common} value={value || ''} onChange={onChange} setUploading={setUploading} folder={folder} />;
      break;
    case 'url':
      control = <input {...common} className={s.input} type="url" inputMode="url" placeholder={f.placeholder} value={value || ''} onChange={(e) => onChange(e.target.value)} />;
      break;
    case 'slug':
      control = (
        <input {...common} className={s.input} type="text" placeholder="made from the name" value={value || ''} onChange={(e) => onChange(e.target.value)} />
      );
      break;
    default:
      control = (
        <input {...common} className={s.input} type="text" maxLength={f.max} placeholder={f.placeholder} value={value || ''} onChange={(e) => onChange(e.target.value)} />
      );
  }

  return (
    <div className={s.field}>
      <label htmlFor={id} className={s.label}>
        {f.label}
        {!f.required && f.type !== 'objectList' && <span className={s.optional}>optional</span>}
      </label>
      {control}
      {f.help && !error && (
        <p id={`${id}-help`} className={s.help}>
          {f.help}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className={s.err}>
          <FiAlertCircle aria-hidden /> {error}
        </p>
      )}
    </div>
  );
}

function ImageField({ f, common, value, onChange, setUploading, folder }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setUploading(true);
    setErr('');
    try {
      onChange(await uploadImage(file, folder));
    } catch (error) {
      setErr(error.message);
    } finally {
      setBusy(false);
      setUploading(false);
    }
  };

  return (
    <div className={s.image}>
      <div className={s.preview}>
        {value ? <img src={value} alt="" /> : <FiImage aria-hidden />}
        {busy && <span className={s.previewBusy}>Uploading…</span>}
      </div>
      <div className={s.imageSide}>
        <button type="button" className="btn btn--ghost" onClick={() => fileRef.current?.click()} disabled={busy}>
          <FiUploadCloud aria-hidden /> {value ? 'Replace image' : 'Upload image'}
        </button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden onChange={pick} />
        <input
          {...common}
          className={s.input}
          type="text"
          inputMode="url"
          placeholder="…or paste an image link (https://…)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button type="button" className={s.textBtn} onClick={() => onChange('')}>
            <FiX aria-hidden /> Remove image
          </button>
        )}
        {err && (
          <p className={s.err}>
            <FiAlertCircle aria-hidden /> {err}
          </p>
        )}
      </div>
    </div>
  );
}

/** Several images: upload many at once or paste links; reorder and remove. */
function GalleryField({ f, common, value, onChange, setUploading, folder }) {
  const fileRef = useRef(null);
  const [link, setLink] = useState('');
  const [progress, setProgress] = useState('');
  const [err, setErr] = useState('');
  const max = f.max || 12;
  const room = max - value.length;

  const pick = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    if (!files.length) return;
    if (files.length > room) setErr(`Only ${room} more image${room === 1 ? '' : 's'} fit (${max} maximum). The rest were skipped.`);
    else setErr('');
    const todo = files.slice(0, room);
    setUploading(true);
    for (let i = 0; i < todo.length; i++) {
      setProgress(`Uploading ${i + 1} of ${todo.length}…`);
      try {
        const url = await uploadImage(todo[i], folder);
        // add to the latest list (links may have been added meanwhile); show each one as soon as it is up
        onChange((cur) => [...(cur || []), url].slice(0, max));
      } catch (error) {
        setErr(`${todo[i].name}: ${error.message}`);
      }
    }
    setProgress('');
    setUploading(false);
  };

  const addLink = () => {
    const v = link.trim();
    if (!v) return;
    if (!/^https:\/\//i.test(v)) return setErr('Image links must start with https://');
    if (value.includes(v)) return setErr('That image is already in the gallery.');
    if (room <= 0) return setErr(`The gallery is full (${max} images).`);
    onChange([...value, v]);
    setLink('');
    setErr('');
  };

  const move = (i, d) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };

  return (
    <div className={s.gallery}>
      {value.length > 0 && (
        <ul role="list" className={s.galleryGrid}>
          {value.map((src, i) => (
            <li key={src} className={s.galleryItem}>
              <img src={src} alt={`Gallery image ${i + 1}`} />
              <span className={s.galleryNum}>{i + 1}</span>
              <div className={s.galleryTools}>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move image ${i + 1} earlier`}>
                  <FiArrowLeft />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label={`Move image ${i + 1} later`}>
                  <FiArrowRight />
                </button>
                <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove image ${i + 1}`}>
                  <FiX />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className={s.galleryAdd}>
        <button type="button" className="btn btn--ghost" onClick={() => fileRef.current?.click()} disabled={!!progress || room <= 0} data-field={f.name}>
          <FiUploadCloud aria-hidden /> {progress || 'Upload images'}
        </button>
        <input ref={fileRef} type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden onChange={pick} />
        <span className={s.galleryCount}>
          {value.length} / {max}
        </span>
      </div>
      <div className={s.galleryLink}>
        <input
          {...common}
          className={s.input}
          type="text"
          inputMode="url"
          placeholder="…or paste an image link (https://…)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault(); // add the link, don't save the form
              addLink();
            }
          }}
        />
        <button type="button" className="btn btn--ghost" onClick={addLink} disabled={!link.trim()}>
          <FiPlus aria-hidden /> Add
        </button>
      </div>
      {err && (
        <p className={s.err}>
          <FiAlertCircle aria-hidden /> {err}
        </p>
      )}
    </div>
  );
}

function ObjectList({ f, value, onChange, errors }) {
  const set = (i, key, v) => onChange(value.map((row, j) => (j === i ? { ...row, [key]: v } : row)));
  const move = (i, d) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div className={s.rows}>
      {value.map((row, i) => (
        <div key={i} className={s.row}>
          <span className={s.rowNum}>{i + 1}</span>
          <div className={s.rowFields}>
            {f.of.map((sub) => {
              const key = `${f.name}.${i}.${sub.name}`;
              const props = {
                'data-field': key,
                'aria-label': `${sub.label} ${i + 1}`,
                'aria-invalid': errors[key] ? true : undefined,
                className: `${s.input} ${sub.type === 'textarea' ? s.textareaSm : ''}`,
                value: row[sub.name] || '',
                placeholder: sub.label,
                onChange: (e) => set(i, sub.name, e.target.value),
              };
              return (
                <div key={sub.name}>
                  {sub.type === 'textarea' ? <textarea rows={2} {...props} /> : <input type="text" {...props} />}
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
            <button type="button" className={s.iconBtn} onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${i + 1} up`}>
              <FiArrowUp />
            </button>
            <button type="button" className={s.iconBtn} onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label={`Move ${i + 1} down`}>
              <FiArrowDown />
            </button>
            <button type="button" className={s.iconBtn} onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove ${i + 1}`}>
              <FiTrash2 />
            </button>
          </div>
        </div>
      ))}
      {value.length < (f.max || 20) && (
        <button type="button" className={s.addRow} onClick={() => onChange([...value, Object.fromEntries(f.of.map((x) => [x.name, '']))])}>
          <FiPlus aria-hidden /> Add {f.label.toLowerCase().replace(/s$/, '')}
        </button>
      )}
    </div>
  );
}
