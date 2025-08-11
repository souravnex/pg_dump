import { Container } from '@/types/api';
import { cn } from '@/lib/utils';
import { Server as ServerIcon } from 'lucide-react';

interface ContainerSidebarProps {
  containers: Container[];
  loading?: boolean;
  selectedContainer?: Container | null;
  onSelect: (container: Container) => void;
}

export function ContainerSidebar({
  containers,
  loading,
  selectedContainer,
  onSelect
}: ContainerSidebarProps) {
  if (loading) {
    return <div className="p-4 text-slate-500">Loading containers...</div>;
  }

  if (containers.length === 0) {
    return <div className="p-4 text-slate-500">No containers found</div>;
  }

  return (
    <div className="divide-y divide-slate-200">
      {containers.map((container) => (
        <div
          key={container.id}
          className={cn(
            "p-4 cursor-pointer hover:bg-blue-50 transition-colors",
            selectedContainer?.id === container.id ? "bg-blue-100" : ""
          )}
          onClick={() => onSelect(container)}
        >
          <div className="flex items-center gap-3">
            <ServerIcon className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-medium text-slate-800">{container.name}</div>
              <div className="text-xs text-slate-500">{container.status}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
