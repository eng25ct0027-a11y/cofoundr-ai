import { Loader2 } from 'lucide-react';

export default function Spinner({ label = 'Loading', full = false, size = 24 }) {
  return (
    <div className={`loading-block ${full ? 'loading-full' : ''}`} role="status">
      <Loader2 className="spin" size={size} />
      {label ? <span>{label}</span> : null}
    </div>
  );
}
