'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Users, Plus, ArrowLeft, FolderKanban, Crown, Shield, Code2, Mail, LogOut, X } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { teamsService } from '@/lib/services/teams.service';
import { projectsService } from '@/lib/services/projects.service';
import { dashboardService } from '@/lib/services/dashboard.service';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';

type ApiError = { response?: { data?: { message?: string } } };

const ROLE_ICONS: Record<string, React.ReactNode> = {
  ADMIN: <Crown size={12} />,
  MANAGER: <Shield size={12} />,
  DEVELOPER: <Code2 size={12} />,
};

export default function TeamDetailPage() {
  const t = useTranslations('teams');
  const tp = useTranslations('projects');
  const tc = useTranslations('common');
  const ts = useTranslations('status');
  const tt = useTranslations('teamDetail');
  const { user } = useAuthStore();
  const { teamId } = useParams<{ teamId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);

  const { data: team, isLoading } = useQuery({
    queryKey: ['teams', teamId],
    queryFn: () => teamsService.getOne(teamId),
  });

  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ['projects', teamId],
    queryFn: () => projectsService.getByTeam(teamId),
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'team', teamId],
    queryFn: () => dashboardService.getTeamStats(teamId),
  });

  const myRole = team?.members?.find((m) => m.user.id === user?.id)?.role;
  const isAdmin = myRole === 'ADMIN';
  const canManage = isAdmin || myRole === 'MANAGER';
  const done = stats?.tasksByStatus.find((s) => s.status === 'DONE')?.count ?? 0;
  const pct = stats?.totalTasks ? Math.round((done / stats.totalTasks) * 100) : 0;
  const apiError = (fallback: string) => (err: ApiError) => toast.error(err.response?.data?.message ?? fallback);

  const roleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: Role }) => teamsService.updateMemberRole(teamId, memberId, role),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teams', teamId] }); toast.success(tt('roleUpdated')); },
    onError: apiError(tt('inviteFailed')),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => teamsService.removeMember(teamId, memberId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teams', teamId] }); toast.success(tt('removed')); },
    onError: apiError(tt('inviteFailed')),
  });

  const leaveMutation = useMutation({
    mutationFn: () => teamsService.leave(teamId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teams'] }); toast.success(tt('left')); router.push('/teams'); },
    onError: apiError(tt('inviteFailed')),
  });

  const inviteForm = useForm<{ email: string; role: string }>();
  const projectForm = useForm<{ name: string; description?: string }>();

  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) => teamsService.invite(teamId, data),
    onSuccess: () => {
      toast.success(tt('invited'));
      inviteForm.reset();
      setInviteOpen(false);
    },
    onError: apiError(tt('inviteFailed')),
  });

  const projectMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => projectsService.create(teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', teamId] });
      toast.success('Project created');
      projectForm.reset();
      setProjectOpen(false);
    },
    onError: () => toast.error('Failed to create project'),
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64 lg:col-span-2" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <button
          onClick={() => router.push('/teams')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white mb-5 transition-colors"
        >
          <ArrowLeft size={15} /> {tc('back')}
        </button>

        <PageHeader
          title={team?.name ?? ''}
          description={team?.description}
          action={
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="ghost" size="sm" className="gap-1.5 text-slate-500"
                onClick={() => { if (window.confirm(tt('confirmLeave'))) leaveMutation.mutate(); }}>
                <LogOut size={14} /> {tt('leave')}
              </Button>
              {canManage && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)} className="gap-1.5">
                    <Mail size={14} /> {t('inviteMember')}
                  </Button>
                  <Button size="sm" onClick={() => setProjectOpen(true)} className="gap-1.5">
                    <Plus size={14} /> {tp('newProject')}
                  </Button>
                </>
              )}
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
          {stats && (
            <Card className="border border-slate-200 dark:border-slate-800 shadow-none">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{tt('progress')}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{pct}%</p>
                <p className="text-xs text-slate-500">{done} / {stats.totalTasks} {tt('tasksDone')}</p>
                <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="img" aria-label={`${pct}%`}>
                  {stats.tasksByStatus.map((s) => (
                    <div key={s.status} title={`${ts(s.status)}: ${s.count}`}
                      className={{ BACKLOG: 'bg-slate-300', TODO: 'bg-blue-400', IN_PROGRESS: 'bg-amber-400', IN_REVIEW: 'bg-purple-400', DONE: 'bg-green-500' }[s.status]}
                      style={{ width: `${stats.totalTasks ? (s.count / stats.totalTasks) * 100 : 0}%` }} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Members */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-none">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Users size={15} /> {t('members')} ({team?.members?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {!team?.members?.length ? (
                <p className="text-sm text-slate-400 py-4 text-center">{t('noMembers')}</p>
              ) : (
                <div className="space-y-2">
                  {team.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-2.5 py-1.5">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {member.user.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{member.user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{member.user.email}</p>
                      </div>
                      {isAdmin && member.user.id !== user?.id ? (
                        <div className="flex items-center gap-1">
                          <select
                            aria-label={`${t('role')}: ${member.user.name}`}
                            value={member.role}
                            onChange={(e) => roleMutation.mutate({ memberId: member.user.id, role: e.target.value as Role })}
                            className="h-7 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 text-xs text-slate-600 dark:text-slate-300"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="MANAGER">Manager</option>
                            <option value="DEVELOPER">Developer</option>
                          </select>
                          <button
                            aria-label={`${tt('remove')} ${member.user.name}`}
                            onClick={() => { if (window.confirm(tt('confirmRemove'))) removeMutation.mutate(member.user.id); }}
                            className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          {ROLE_ICONS[member.role]}
                          {member.role}{member.user.id === user?.id ? ` (${tt('you')})` : ''}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          </div>

          {/* Projects */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <FolderKanban size={15} /> {tp('title')} ({projects?.length ?? 0})
            </p>
            {loadingProjects ? (
              <Skeleton className="h-32 w-full" />
            ) : !projects?.length ? (
              <Card className="border border-slate-200 dark:border-slate-800 shadow-none">
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-slate-400">{tp('noProjects')}</p>
                  <Button size="sm" className="mt-3 gap-1.5" onClick={() => setProjectOpen(true)}>
                    <Plus size={14} /> {tp('newProject')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              projects.map((project) => (
                <Card
                  key={project.id}
                  className="border border-slate-200 dark:border-slate-800 shadow-none hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{project.name}</p>
                      {project.description && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{project.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <span className="text-xs text-slate-400">{project._count?.tasks ?? 0} {tp('tasks')}</span>
                      <StatusBadge value={project.status} label={ts(project.status)} />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Invite dialog */}
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">{t('inviteMember')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={inviteForm.handleSubmit((data) => inviteMutation.mutate({ ...data, role: data.role || 'DEVELOPER' }))} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label className="text-sm">{t('email')}</Label>
                <Input type="email" placeholder="member@example.com" {...inviteForm.register('email', { required: true })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">{t('role')}</Label>
                <select
                  {...inviteForm.register('role')}
                  defaultValue="DEVELOPER"
                  className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-white"
                >
                  <option value="DEVELOPER">Developer</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setInviteOpen(false)}>{tc('cancel')}</Button>
                <Button type="submit" size="sm" disabled={inviteMutation.isPending}>{t('invite')}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Create project dialog */}
        <Dialog open={projectOpen} onOpenChange={setProjectOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">{tp('createProject')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={projectForm.handleSubmit((data) => projectMutation.mutate(data))} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label className="text-sm">{tp('projectName')}</Label>
                <Input placeholder={tp('projectNamePlaceholder')} {...projectForm.register('name', { required: true })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">{tp('description')} <span className="text-slate-400">({tc('optional')})</span></Label>
                <Input placeholder={tp('descriptionPlaceholder')} {...projectForm.register('description')} />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setProjectOpen(false)}>{tc('cancel')}</Button>
                <Button type="submit" size="sm" disabled={projectMutation.isPending}>{tp('createProject')}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
