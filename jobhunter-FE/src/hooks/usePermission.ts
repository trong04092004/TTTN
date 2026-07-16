import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  callCreatePermission,
  callDeletePermission,
  callFetchPermission,
  callUpdatePermission,
} from "@/config/api";
import { IBackendRes, IModelPaginate, IPermission } from "@/types/backend";
import { message, notification } from "antd";

export const usePermission = (queryString: string | null = null) => {
  const queryClient = useQueryClient();

  const query = useQuery<IBackendRes<IModelPaginate<IPermission>>>({
    queryKey: ["permissions", queryString],
    queryFn: () => callFetchPermission(queryString || "") as any,
    placeholderData: keepPreviousData,
    enabled: !!queryString,
  });

  const createMutation = useMutation({
    mutationFn: async (perm: IPermission) => {
      const res = await callCreatePermission(perm);
      if (!res.data) throw res;
      return res.data;
    },
    onSuccess: () => {
      message.success("Thêm mới Permission thành công");
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
    onError: (error: any) => {
      notification.error({
        message: "Có lỗi xảy ra",
        description: error?.message || "Không thể tạo mới permission",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; perm: IPermission }) => {
      const res = await callUpdatePermission(data.perm, data.id);
      if (!res.data) throw res;
      return res.data;
    },
    onSuccess: () => {
      message.success("Cập nhật Permission thành công");
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
    onError: (error: any) => {
      notification.error({
        message: "Có lỗi xảy ra",
        description: error?.message || "Không thể cập nhật permission",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await callDeletePermission(id);
      if (+res.statusCode !== 200) throw res;
      return res;
    },
    onSuccess: () => {
      message.success("Xóa Permission thành công");
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
    onError: (error: any) => {
      notification.error({
        message: "Có lỗi xảy ra",
        description: error?.message || "Không thể xóa permission",
      });
    },
  });

  return {
    permissions: query.data?.data?.result ?? [],
    meta: query.data?.data?.meta ?? {
      page: 1,
      pageSize: 10,
      total: 0,
      pages: 0,
    },
    isFetching: query.isFetching,

    createPermission: createMutation.mutateAsync,
    updatePermission: updateMutation.mutateAsync,
    deletePermission: deleteMutation.mutateAsync,

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
