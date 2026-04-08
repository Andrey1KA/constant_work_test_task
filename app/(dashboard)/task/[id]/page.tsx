import { TaskDetailPage } from '@/components/TaskDetailPage/TaskDetailPage';

export default function TaskByIdPage({
  params,
}: {
  params: { id: string };
}) {
  return <TaskDetailPage id={params.id} />;
}
