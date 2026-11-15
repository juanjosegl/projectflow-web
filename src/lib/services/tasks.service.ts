import api from '../api';
import { Task, ApiResponse } from '@/types';

export interface TaskUpdatePayload {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  position?: number;
  assigneeId?: string | null;
}

export const tasksService = {
  async create(projectId: string, data: TaskUpdatePayload & { title: string }) {
    const res = await api.post<ApiResponse<Task>>(`/projects/${projectId}/tasks`, data);
    return res.data.data;
  },
  async getByProject(projectId: string) {
    const res = await api.get<ApiResponse<Task[]>>(`/projects/${projectId}/tasks`);
    return res.data.data;
  },
  async getOne(taskId: string) {
    const res = await api.get<ApiResponse<Task>>(`/tasks/${taskId}`);
    return res.data.data;
  },
  async update(taskId: string, data: TaskUpdatePayload) {
    const res = await api.patch<ApiResponse<Task>>(`/tasks/${taskId}`, data);
    return res.data.data;
  },
  async delete(taskId: string) {
    await api.delete(`/tasks/${taskId}`);
  },
  async getMine() {
    const res = await api.get<ApiResponse<Task[]>>('/tasks/mine');
    return res.data.data;
  },
};
