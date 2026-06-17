import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  applyTemplate,
} from '@/api/holiday-templates';
import {
  CreateHolidayTemplateRequest,
  UpdateHolidayTemplateRequest,
  ApplyHolidayTemplateRequest,
} from '@/types/holidayTemplate';

export const TEMPLATE_QUERY_KEYS = {
  all: ['holiday-templates'] as const,
  lists: () => [...TEMPLATE_QUERY_KEYS.all, 'list'] as const,
  details: () => [...TEMPLATE_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...TEMPLATE_QUERY_KEYS.details(), id] as const,
};

export const useHolidayTemplates = () => {
  return useQuery({
    queryKey: TEMPLATE_QUERY_KEYS.lists(),
    queryFn: getAllTemplates,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useHolidayTemplate = (id: number) => {
  return useQuery({
    queryKey: TEMPLATE_QUERY_KEYS.detail(id),
    queryFn: () => getTemplateById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHolidayTemplateRequest) => createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_QUERY_KEYS.lists() });
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateHolidayTemplateRequest }) =>
      updateTemplate(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TEMPLATE_QUERY_KEYS.detail(variables.id) });
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_QUERY_KEYS.lists() });
    },
  });
};

export const useApplyTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ApplyHolidayTemplateRequest }) =>
      applyTemplate(id, data),
    onSuccess: () => {
      // Invalidate holidays to show newly created ones
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
  });
};
