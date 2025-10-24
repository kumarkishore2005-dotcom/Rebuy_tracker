import { Suspense } from 'react';
import DashboardClient from './dashboard-client';

export default function DashboardPage({
  searchParams,
}: {
  searchParams: { role?: string; name?: string };
}) {
  return (
    <Suspense>
      <DashboardClient role={searchParams?.role} name={searchParams?.name} />
    </Suspense>
  );
}
