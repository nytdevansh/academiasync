import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [6, 12, 24],
}) => {
  if (totalItems === 0) return null;

  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
      <p className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-700">{firstItem}-{lastItem}</span> of{' '}
        <span className="font-semibold text-slate-700">{totalItems}</span>
      </p>
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500" htmlFor="page-size">
          Per page
        </label>
        <select
          id="page-size"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <Button
          variant="ghost"
          size="sm"
          icon={<ChevronLeft className="w-4 h-4" />}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          title="Previous page"
        />
        <span className="min-w-16 text-center text-xs font-semibold text-slate-600">
          {page} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          icon={<ChevronRight className="w-4 h-4" />}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          title="Next page"
        />
      </div>
    </div>
  );
};
