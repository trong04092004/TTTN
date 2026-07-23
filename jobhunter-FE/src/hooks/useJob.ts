import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  callCreateJob,
  callDeleteJob,
  callFetchJob,
  callFetchJobById,
  callUpdateJob,
} from "@/config/api";
import { IBackendRes, IJob, IModelPaginate } from "@/types/backend";
import { message, notification } from "antd";

export const useJob = (queryString: string | null = null) => {
  const queryClient = useQueryClient();

  const query = useQuery<IBackendRes<IModelPaginate<IJob>>>({
    queryKey: ["jobs", queryString],
    queryFn: () => callFetchJob(queryString || "") as any,
    placeholderData: keepPreviousData,
    enabled: !!queryString,
  });

  const createMutation = useMutation({
    mutationFn: async (job: IJob) => {
      const res = await callCreateJob(job);
      if (!res.data) throw res;
      return res.data;
    },
    onSuccess: () => {
      message.success("Tạo mới Job thành công");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (error: any) => {
      notification.error({
        message: "Có lỗi xảy ra",
        description: error?.message || "Không thể tạo job",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; job: IJob }) => {
      const res = await callUpdateJob(data.job, data.id);
      if (!res.data) throw res;
      return res.data;
    },
    onSuccess: () => {
      message.success("Cập nhật Job thành công");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (error: any) => {
      notification.error({
        message: "Có lỗi xảy ra",
        description: error?.message || "Không thể cập nhật job",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await callDeleteJob(id);
      if (!res.data) throw res;
      return res.data;
    },
    onSuccess: () => {
      message.success("Xóa Job thành công");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (error: any) => {
      notification.error({
        message: "Có lỗi xảy ra",
        description: error?.message || "Không thể xóa job",
      });
    },
  });

  return {
    jobs: query.data?.data?.result ?? [],
    meta: query.data?.data?.meta ?? {
      page: 1,
      pageSize: 10,
      total: 0,
      pages: 0,
    },
    isFetching: query.isFetching,

    createJob: createMutation.mutateAsync,
    updateJob: updateMutation.mutateAsync,
    deleteJob: deleteMutation.mutateAsync,

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

export const useJobById = (id: string | null) => {
  return useQuery({
    queryKey: ["jobs", id],
    queryFn: () => callFetchJobById(id as string),
    enabled: !!id,
  });
};
