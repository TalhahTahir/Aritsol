import s from './StackGrid.module.css';

const layers = [
  { name: 'Frontend', items: ['React', 'Next.js', 'TypeScript', 'React Native'] },
  { name: 'Backend', items: ['Node.js', 'Express', 'Java', 'Spring Boot', 'FastAPI'] },
  { name: 'Data', items: ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Kafka'] },
  { name: 'AI', items: ['PyTorch', 'TensorFlow', 'LangGraph', 'OpenAI', 'Llama'] },
  { name: 'Cloud', items: ['AWS', 'Vercel', 'Docker', 'Kubernetes', 'GitHub Actions'] },
];

export default function StackGrid() {
  return (
    <dl className={s.grid}>
      {layers.map((l) => (
        <div key={l.name} className={s.layer}>
          <dt className={s.name}>{l.name}</dt>
          {l.items.map((i) => (
            <dd key={i} className={s.item}>
              {i}
            </dd>
          ))}
        </div>
      ))}
    </dl>
  );
}
