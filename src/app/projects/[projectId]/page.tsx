'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, ArrowLeft, Calendar, MessageSquare } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { projectsService } from '@/lib/services/projects.service';
import { tasksService } from '@/lib/services/tasks.service';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { Task, TaskStatus, TaskPriority } from '@/types';

const STATUSES: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const STATUS_COLORS: Record<TaskStatus, string> = {
  BACKLOG:     'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800',
  TODO:        'bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50',
  IN_PROGRESS: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50',
  IN_REVIEW:   'bg-purple-50/50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/50',
  DONE:        'bg-green-50/50 dark:bg-green-950/20 border-green-100 dark:border-green-900/50',
};

const selectClass = 'w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-white';

type CreateForm = { title: string; description?: string; priority: TaskPriority; assigneeId: string; dueDate?: string };

export default function ProjectBoardPage() {
  const t = useTranslations('tasks');
  const tb = useTranslations('board');
  const ts = useTranslations('status');
  const tp = useTranslations('priority');
  const tc = useTranslations('common');
  const td = useTranslations('taskDetail');
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsService.getOne(projectId),
  });

  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => tasksService.getByProject(projectId),
  });

  const teamMembers = project?.team?.members ?? [];

  const form = useForm<CreateForm>({ defaultValues: { priority: 'MEDIUM', assigneeId: user?.id ?? '' } });

  const createMutation = useMutation({
    mutationFn: (data: CreateForm) => tasksService.create(projectId, {
      title: data.title,
      description: data.description || undefined,
      priority: data.priority,
      assigneeId: data.assigneeId || undefined,
      dueDate: data.dueDate || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'mine'] });
      toast.success(tb('created'));
      form.reset({ priority: 'MEDIUM', assigneeId: user?.id ?? '' });
      setOpen(false);
    },
    onError: () => toast.error(tb('createFailed')),
  });

  // Optimistic move: the card jumps immediately, and the board is restored if the API refuses.
  const moveMutation = useMutation({
    mutationFn: ({ taskId, status, position }: { taskId: string; status: TaskStatus; position: number }) =>
      tasksService.update(taskId, { status, position }),
    onMutate: async ({ taskId, status, position }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      const previous = queryClient.getQueryData<Task[]>(['tasks', projectId]);
      queryClient.setQueryData<Task[]>(['tasks', projectId], (old) =>
        old?.map((task) => (task.id === taskId ? { ...task, status, position } : task)),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      queryClient.setQueryData(['tasks', projectId], ctx?.previous);
      toast.error(tb('moveFailed'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const moveTo = (taskId: string, status: TaskStatus) => {
    const task = tasks?.find((x) => x.id === taskId);
    if (!task || task.status === status) return;
    // Append to the bottom of the target column.
    const position = Math.max(-1, ...(tasks ?? []).map((x) => x.position)) + 1;
    moveMutation.mutate({ taskId, status, position });
  };

  const tasksByStatus = (status: TaskStatus) =>
    (tasks ?? []).filter((x) => x.status === status).sort((a, b) => a.position - b.position);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white mb-5 transition-colors"
        >
          <ArrowLeft size={15} /> {tc('back')}
        </button>

        <PageHeader
          title={loadingProject ? '...' : project?.name ?? ''}
          description={project?.description ?? tb('dragHint')}
          action={
            <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
              <Plus size={14} /> {t('newTask')}
            </Button>
          }
        />

        <div className="flex gap-4 overflow-x-auto pb-6">
          {STATUSES.map((status) => {
            const column = tasksByStatus(status);
            return (
              <section
                key={status}
                aria-label={ts(status)}
                className="shrink-0 w-72"
                onDragOver={(e) => { e.preventDefault(); setDragOver(status); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(null);
                  moveTo(e.dataTransfer.getData('text/plain'), status);
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <StatusBadge value={status} label={ts(status)} />
                  <span className="text-xs text-slate-400">{column.length}</span>
                </div>

                <div className={cn(
                  'rounded-lg border p-2 space-y-2 min-h-[200px] transition-colors',
                  STATUS_COLORS[status],
                  dragOver === status && 'ring-2 ring-slate-400/60 dark:ring-slate-500/60',
                )}>
                  {loadingTasks ? (
                    <Skeleton className="h-20 w-full" />
                  ) : column.length === 0 ? (
                    <div className="flex items-center justify-center h-20">
                      <p className="text-xs text-slate-400 dark:text-slate-600">{tb('noTasks')}</p>
                    </div>
                  ) : (
                    column.map((task) => {
                      const overdue = task.dueDate && task.status !== 'DONE' && task.dueDate.slice(0, 10) < today;
                      const next = STATUSES[STATUSES.indexOf(status) + 1];
                      return (
                        <article
                          key={task.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', task.id);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onClick={() => router.push(`/projects/${projectId}/tasks/${task.id}`)}
                          className="group rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 cursor-grab active:cursor-grabbing hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                        >
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2 leading-snug">
                            {task.title}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <StatusBadge value={task.priority} type="priority" label={tp(task.priority)} />
                              {task.dueDate && (
                                <span className={cn('flex items-center gap-1 text-xs', overdue ? 'text-red-500' : 'text-slate-400')}>
                                  <Calendar size={11} />
                                  {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {(task._count?.comments ?? 0) > 0 && (
                                <span className="flex items-center gap-0.5 text-xs text-slate-400">
                                  <MessageSquare size={11} /> {task._count?.comments}
                                </span>
                              )}
                              {task.assignee && (
                                <Avatar className="h-5 w-5" title={task.assignee.name}>
                                  {task.assignee.avatar && <AvatarImage src={task.assignee.avatar} alt="" />}
                                  <AvatarFallback className="text-[10px] bg-slate-200 dark:bg-slate-700">
                                    {task.assignee.name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          </div>
                          {/* Keyboard and touch fallback for drag and drop */}
                          {next && (
                            <button
                              onClick={(e) => { e.stopPropagation(); moveTo(task.id, next); }}
                              className="mt-2 w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-left transition-colors"
                            >
                              {ts(next)} ›
                            </button>
                          )}
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">{t('createTask')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="task-title" className="text-sm">{t('taskTitle')}</Label>
                <Input id="task-title" placeholder={t('taskTitlePlaceholder')} {...form.register('title', { required: true, minLength: 2 })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-desc" className="text-sm">{t('description')} <span className="text-slate-400">({tc('optional')})</span></Label>
                <textarea id="task-desc" rows={3} placeholder={t('descriptionPlaceholder')} {...form.register('description')}
                  className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="task-priority" className="text-sm">{t('priority')}</Label>
                  <select id="task-priority" {...form.register('priority')} className={selectClass}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{tp(p)}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="task-due" className="text-sm">{t('dueDate')}</Label>
                  <Input id="task-due" type="date" {...form.register('dueDate')} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-assignee" className="text-sm">{t('assignee')}</Label>
                <select id="task-assignee" {...form.register('assigneeId')} className={selectClass}>
                  <option value="">{td('unassigned')}</option>
                  {teamMembers.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name}{m.user.id === user?.id ? ` (${td('me')})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>{tc('cancel')}</Button>
                <Button type="submit" size="sm" disabled={createMutation.isPending}>{t('createTask')}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
