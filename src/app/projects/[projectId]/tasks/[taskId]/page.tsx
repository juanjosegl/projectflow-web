'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, MessageSquare, Send, Trash2, Pencil } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { tasksService, type TaskUpdatePayload } from '@/lib/services/tasks.service';
import { commentsService } from '@/lib/services/comments.service';
import { projectsService } from '@/lib/services/projects.service';
import { useAuthStore } from '@/store/auth.store';
import { TaskStatus, TaskPriority } from '@/types';

const STATUSES: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const selectClass = 'w-full h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm text-slate-700 dark:text-slate-300';
const fieldLabel = 'text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5 block';

function UserAvatar({ name, avatar, size = 'h-7 w-7' }: { name?: string; avatar?: string; size?: string }) {
  return (
    <Avatar className={`${size} shrink-0`}>
      {avatar && <AvatarImage src={avatar} alt="" />}
      <AvatarFallback className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
        {name?.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

export default function TaskDetailPage() {
  const t = useTranslations('tasks');
  const td = useTranslations('taskDetail');
  const ts = useTranslations('status');
  const tp = useTranslations('priority');
  const tc = useTranslations('common');
  const { taskId, projectId } = useParams<{ taskId: string; projectId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: '', description: '' });

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksService.getOne(taskId),
  });

  const { data: comments, isLoading: loadingComments } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentsService.getByTask(taskId),
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsService.getOne(projectId),
  });

  const teamMembers = project?.team?.members ?? [];

  const invalidateTask = () => {
    queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    queryClient.invalidateQueries({ queryKey: ['tasks', 'mine'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const updateMutation = useMutation({
    mutationFn: (data: TaskUpdatePayload) => tasksService.update(taskId, data),
    onSuccess: () => { invalidateTask(); toast.success(td('updated')); setEditing(false); },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message ?? td('updateFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksService.delete(taskId),
    onSuccess: () => { invalidateTask(); toast.success(td('deleted')); router.push(`/projects/${projectId}`); },
    onError: () => toast.error(td('deleteFailed')),
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => commentsService.create(taskId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setComment('');
    },
    onError: () => toast.error(td('updateFailed')),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => commentsService.delete(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', taskId] }),
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 max-w-4xl mx-auto">
          <Skeleton className="h-6 w-32 mb-6" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!task) return null;

  const startEditing = () => {
    setDraft({ title: task.title, description: task.description ?? '' });
    setEditing(true);
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <button
          onClick={() => router.push(`/projects/${projectId}`)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white mb-5 transition-colors"
        >
          <ArrowLeft size={15} /> {tc('back')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <Card className="border border-slate-200 dark:border-slate-800 shadow-none">
              <CardContent className="p-6">
                {editing ? (
                  <form
                    className="space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (draft.title.trim().length < 2) return;
                      updateMutation.mutate({ title: draft.title.trim(), description: draft.description.trim() });
                    }}
                  >
                    <Input aria-label={t('taskTitle')} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} autoFocus />
                    <textarea
                      aria-label={t('description')}
                      rows={5}
                      value={draft.description}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                      placeholder={t('descriptionPlaceholder')}
                      className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>{tc('cancel')}</Button>
                      <Button type="submit" size="sm" disabled={updateMutation.isPending}>{td('saveDetails')}</Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{task.title}</h1>
                      <Button variant="ghost" size="sm" className="gap-1.5 shrink-0" onClick={startEditing}>
                        <Pencil size={13} /> {td('editDetails')}
                      </Button>
                    </div>
                    {task.description ? (
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{task.description}</p>
                    ) : (
                      <p className="text-sm text-slate-400">{td('noDescription')}</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3">
                <MessageSquare size={15} /> {td('comments')} ({comments?.length ?? 0})
              </h2>
              <Card className="border border-slate-200 dark:border-slate-800 shadow-none">
                <CardContent className="p-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (comment.trim()) commentMutation.mutate(comment.trim());
                    }}
                    className="flex gap-2 mb-4"
                  >
                    <UserAvatar name={user?.name} avatar={user?.avatar} />
                    <div className="flex-1 flex gap-2">
                      <input
                        aria-label={td('writeComment')}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={td('writeComment')}
                        className="flex-1 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors"
                      />
                      <Button type="submit" size="sm" aria-label={td('comments')} disabled={!comment.trim() || commentMutation.isPending}>
                        <Send size={14} />
                      </Button>
                    </div>
                  </form>
                  <Separator className="mb-4" />
                  {loadingComments ? <Skeleton className="h-16 w-full" /> : !comments?.length ? (
                    <p className="text-sm text-slate-400 text-center py-4">{td('noComments')}</p>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((c) => (
                        <div key={c.id} className="flex gap-2.5">
                          <UserAvatar name={c.author.name} avatar={c.author.avatar} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{c.author.name}</span>
                              <span className="text-xs text-slate-400 shrink-0">{new Date(c.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                            {c.author.id === user?.id && (
                              <button
                                onClick={() => deleteCommentMutation.mutate(c.id)}
                                className="text-xs text-slate-400 hover:text-red-500 transition-colors mt-1 flex items-center gap-1"
                              >
                                <Trash2 size={11} /> {tc('delete')}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border border-slate-200 dark:border-slate-800 shadow-none">
              <CardContent className="p-4 space-y-4">
                <div>
                  <label htmlFor="status" className={fieldLabel}>{t('status')}</label>
                  <select id="status" value={task.status} onChange={(e) => updateMutation.mutate({ status: e.target.value })} className={selectClass}>
                    {STATUSES.map((s) => <option key={s} value={s}>{ts(s)}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className={fieldLabel}>{t('priority')}</label>
                  <select id="priority" value={task.priority} onChange={(e) => updateMutation.mutate({ priority: e.target.value })} className={selectClass}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{tp(p)}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="assignee" className={fieldLabel}>{t('assignee')}</label>
                  <select
                    id="assignee"
                    value={task.assigneeId ?? ''}
                    onChange={(e) => updateMutation.mutate({ assigneeId: e.target.value || null })}
                    className={selectClass}
                  >
                    <option value="">{td('unassigned')}</option>
                    {teamMembers.map((m) => (
                      <option key={m.user.id} value={m.user.id}>
                        {m.user.name}{m.user.id === user?.id ? ` (${td('me')})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="due" className={fieldLabel}>{t('dueDate')}</label>
                  <div className="flex gap-2">
                    <Input
                      id="due"
                      type="date"
                      className="h-8"
                      value={task.dueDate?.slice(0, 10) ?? ''}
                      onChange={(e) => updateMutation.mutate({ dueDate: e.target.value || null })}
                    />
                    {task.dueDate && (
                      <Button variant="ghost" size="sm" onClick={() => updateMutation.mutate({ dueDate: null })}>
                        {td('clearDate')}
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <p className={fieldLabel}>{td('createdBy')}</p>
                  <div className="flex items-center gap-2">
                    <UserAvatar name={task.creator?.name} size="h-6 w-6" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{task.creator?.name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              variant="destructive"
              className="w-full gap-1.5"
              disabled={deleteMutation.isPending}
              onClick={() => { if (window.confirm(t('confirmDelete'))) deleteMutation.mutate(); }}
            >
              <Trash2 size={14} /> {td('deleteTask')}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
