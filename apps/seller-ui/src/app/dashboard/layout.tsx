import { Sidebar } from '../../components/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 px-xl py-lg">{children}</main>
    </div>
  );
}
