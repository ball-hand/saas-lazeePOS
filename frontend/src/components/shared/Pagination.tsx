import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
}

export function Pagination({ currentPage, totalPages, onPageChange, totalItems }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    const pages = [];
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const itemsPerPage = 10;
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : (currentPage * itemsPerPage);

  return (
    <div className="flex items-center justify-between border-t border-[var(--border)] bg-transparent px-4 py-3 sm:px-6">
      {/* Mobile Pagination */}
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-main)] disabled:opacity-50"
        >
          Sebelumnya
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-main)] disabled:opacity-50"
        >
          Berikutnya
        </button>
      </div>

      {/* Desktop Pagination */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">
            Menampilkan <span className="font-medium text-[var(--text-primary)]">{startItem}</span> sampai <span className="font-medium text-[var(--text-primary)]">{endItem}</span> dari {totalItems ? <span className="font-medium text-[var(--text-primary)]">{totalItems}</span> : ''} data
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-[var(--text-secondary)] ring-1 ring-inset ring-[var(--border)] hover:bg-[var(--bg-main)] focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Pertama</span>
              <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 text-[var(--text-secondary)] ring-1 ring-inset ring-[var(--border)] hover:bg-[var(--bg-main)] focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Sebelumnya</span>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            
            {getPageNumbers().map(page => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                aria-current={currentPage === page ? 'page' : undefined}
                className={
                  currentPage === page
                    ? "relative z-10 inline-flex items-center bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"
                    : "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] ring-1 ring-inset ring-[var(--border)] hover:bg-[var(--bg-main)] focus:z-20 focus:outline-offset-0"
                }
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 text-[var(--text-secondary)] ring-1 ring-inset ring-[var(--border)] hover:bg-[var(--bg-main)] focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Berikutnya</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-[var(--text-secondary)] ring-1 ring-inset ring-[var(--border)] hover:bg-[var(--bg-main)] focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Terakhir</span>
              <ChevronsRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
