import { TaskDetailPage } from '@/views/TaskDetailPage/TaskDetailPage';

export default function TaskByIdPage({
  params,
}: {
  params: { id: string };
}) {
  return <TaskDetailPage id={params.id} />;
}
