import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: { label: string; href?: string }[];
}

export function PageHeader({ title, description, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 pb-6 border-b mb-6">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          {breadcrumb.map((item, idx) => (
            <span key={idx} className="flex items-center gap-1.5">
              {idx > 0 && <span>/</span>}
              {item.href ? (
                <a href={item.href} className="hover:text-foreground transition-colors">{item.label}</a>
              ) : (
                <span className={idx === breadcrumb.length - 1 ? 'text-foreground font-medium' : ''}>{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex-shrink-0 flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
