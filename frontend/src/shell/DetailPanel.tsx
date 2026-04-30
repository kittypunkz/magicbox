interface DetailPanelProps {
  children: React.ReactNode;
  fullWidth?: boolean;
  showOnMobile?: boolean;
}

export function DetailPanel({ children, fullWidth, showOnMobile = true }: DetailPanelProps) {
  return (
    <section
      className={`h-full min-w-0 flex-1 overflow-hidden bg-mb-base ${
        fullWidth ? '' : 'lg:min-w-[580px]'
      } ${showOnMobile ? 'flex' : 'hidden lg:flex'}`}
    >
      {children}
    </section>
  );
}
