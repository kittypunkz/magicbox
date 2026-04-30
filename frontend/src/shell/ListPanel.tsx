interface ListPanelProps {
  children: React.ReactNode;
  hidden?: boolean;
}

export function ListPanel({ children, hidden }: ListPanelProps) {
  return (
    <aside className={`${hidden ? 'hidden lg:flex' : 'flex'} h-full w-full shrink-0 flex-col overflow-hidden border-r border-mb-border bg-mb-base lg:w-[280px]`}>
      {children}
    </aside>
  );
}
