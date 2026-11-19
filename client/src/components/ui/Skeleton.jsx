export function Skeleton({ className = '', style }) {
  return <span className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function CardSkeleton() {
  return (
    <div className="card skeleton-card">
      <div className="skeleton-row">
        <Skeleton className="skeleton-avatar" />
        <div className="skeleton-lines">
          <Skeleton style={{ width: '55%' }} />
          <Skeleton style={{ width: '35%' }} />
        </div>
      </div>
      <Skeleton style={{ width: '100%', height: 12 }} />
      <Skeleton style={{ width: '90%', height: 12 }} />
      <Skeleton style={{ width: '70%', height: 12 }} />
      <div className="skeleton-row">
        <Skeleton style={{ width: 70, height: 26 }} />
        <Skeleton style={{ width: 90, height: 26 }} />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-3">
      {Array.from({ length: count }).map((_item, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}
