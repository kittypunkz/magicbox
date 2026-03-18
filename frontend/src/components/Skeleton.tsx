import type { ReactNode } from 'react';

// Dark mode colors for skeleton
const c = {
  base: 'bg-[#2a2a2a]',
  highlight: 'bg-[#3a3a3a]',
};

interface SkeletonProps {
  className?: string;
  children?: ReactNode;
}

export function Skeleton({ className = '', children }: SkeletonProps) {
  return (
    <div
      className={`${c.base} rounded animate-pulse ${className}`}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

// Pre-built skeleton patterns
export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 border border-[#2f2f2f] rounded-xl ${className}`}>
      <Skeleton className="h-5 w-3/4 mb-3" />
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonFolderItem({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 ${className}`}>
      <Skeleton className="w-4 h-4 rounded" />
      <Skeleton className="h-4 flex-1" />
    </div>
  );
}

export function SkeletonNoteItem({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-start gap-3 p-4 border border-[#2f2f2f] rounded-xl ${className}`}>
      <Skeleton className="w-5 h-5 rounded mt-0.5" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonStat({ className = '' }: { className?: string }) {
  return (
    <div className={`text-center ${className}`}>
      <Skeleton className="h-8 w-16 mx-auto mb-1" />
      <Skeleton className="h-3 w-12 mx-auto" />
    </div>
  );
}

export function SkeletonSearchResult({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 ${className}`}>
      <Skeleton className="w-4 h-4 rounded" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

// Shimmer effect wrapper
export function SkeletonShimmer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <div 
        className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
        }}
      />
    </div>
  );
}
