import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  callCreateRole,
  callDeleteRole,
  callFetchRole,
  callUpdateRole,
} from "@/config/api";
import { IBackendRes, IModelPaginate, IRole } from "@/types/backend";
import { message, notification } from "antd";

export const useRole = (queryString: string | null = null) => {
  const queryClient = useQueryClient();

  const query = useQuery<IBackendRes<IModelPaginate<IRole>>>({
    queryKey: ["roles", queryString],
    queryFn: () => callFetchRole(queryString || "") as any,
    placeholderData: keepPreviousData,
    enabled: !!queryString,
  });

  const createMutation = useMutation({
    mutationFn: async (role: IRole) => {
      const res = await callCreateRole(role);
      if (!res.data) throw res;
      return res.data;
    },
    onSuccess: () => {
      message.success("Thêm mới Role thành công");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (error: any) => {
      notification.error({
        message: "Có lỗi xảy ra",
        description: error?.message || "Không thể tạo mới role",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; role: IRole }) => {
      const res = await callUpdateRole(data.role, data.id);
      if (!res.data) throw res;
      return res.data;
    },
    onSuccess: () => {
      message.success("Cập nhật Role thành công");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (error: any) => {
      notification.error({
        message: "Có lỗi xảy ra",
        description: error?.message || "Không thể cập nhật role",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await callDeleteRole(id);
      if (+res.statusCode !== 200) throw res;
      return res;
    },
    onSuccess: () => {
      message.success("Xóa Role thành công");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (error: any) => {
      notification.error({
        message: "Có lỗi xảy ra",
        description: error?.message || "Không thể xóa role",
      });
    },
  });

  return {
    roles: query.data?.data?.result ?? [],
    meta: query.data?.data?.meta ?? {
      page: 1,
      pageSize: 10,
      total: 0,
      pages: 0,
    },
    isFetching: query.isFetching,

    createRole: createMutation.mutateAsync,
    updateRole: updateMutation.mutateAsync,
    deleteRole: deleteMutation.mutateAsync,

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
