import { MainLayout } from '@/components/MainLayout/MainLayout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
