import { Sidebar } from '../../components/sidebar';
import { Header } from '../../components/header';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@biashara-mall/ui/components/ui/sidebar';
import { TooltipProvider } from '@biashara-mall/ui/components/ui/tooltip';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider className="flex-col">
        <Header leading={<SidebarTrigger />} />
        <div className="flex flex-1">
          <Sidebar />
          <SidebarInset className="bg-surface">
            <div className="flex-1 px-8 py-6">{children}</div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
