import { TaskDetailPage } from '@/views';

export default function TaskByIdPage({
  params,
}: {
  params: { id: string };
}) {
  return <TaskDetailPage id={params.id} />;
}
