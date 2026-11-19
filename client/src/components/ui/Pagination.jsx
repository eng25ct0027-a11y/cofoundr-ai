import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ meta, onChange, onPage }) {
  if (!meta || meta.pages <= 1) return null;
  const setPage = onChange || onPage;
  const { page, pages } = meta;

  const pageNumbers = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  for (let index = start; index <= end; index += 1) pageNumbers.push(index);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        className="page-btn"
        onClick={() => setPage(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        type="button"
      >
        <ChevronLeft size={16} />
      </button>
      {start > 1 ? (
        <>
          <button className="page-btn" onClick={() => setPage(1)} type="button">
            1
          </button>
          {start > 2 ? <span className="page-ellipsis">…</span> : null}
        </>
      ) : null}
      {pageNumbers.map((number) => (
        <button
          key={number}
          className={`page-btn ${number === page ? 'is-active' : ''}`}
          onClick={() => setPage(number)}
          aria-current={number === page ? 'page' : undefined}
          type="button"
        >
          {number}
        </button>
      ))}
      {end < pages ? (
        <>
          {end < pages - 1 ? <span className="page-ellipsis">…</span> : null}
          <button className="page-btn" onClick={() => setPage(pages)} type="button">
            {pages}
          </button>
        </>
      ) : null}
      <button
        className="page-btn"
        onClick={() => setPage(page + 1)}
        disabled={page >= pages}
        aria-label="Next page"
        type="button"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
