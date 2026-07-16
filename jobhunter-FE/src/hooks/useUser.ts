import {
  callCreateUser,
  callDeleteUser,
  callFetchUser,
  callUpdateUser,
} from "@/config/api";
import { IBackendRes, IModelPaginate, IUser } from "@/types/backend";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { message, notification } from "antd";

export const useUser = (queryString: string | null = null) => {
  const queryClient = useQueryClient();

  const query = useQuery<IBackendRes<IModelPaginate<IUser>>>({
    queryKey: ["users", queryString],
    queryFn: () => callFetchUser(queryString || "") as any,
    placeholderData: keepPreviousData,
    enabled: !!queryString,
  });

  const createMutation = useMutation({
    mutationFn: async (user: IUser) => {
      const res = await callCreateUser(user);

      if (!res.data) throw res;
      return res.data;
    },

    onSuccess: () => {
      message.success("Thêm user thành công");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },

    onError: (error: any) => {
      notification.error({
        message: "Có lỗi xảy ra",
        description: error?.message || "Không thể tạo mới user",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (user: IUser) => {
      const res = await callUpdateUser(user);
      if (!res.data) throw res;
      return res.data;
    },
    onSuccess: () => {
      message.success("Cập nhật User thành công");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      notification.error({
        message: "Có lỗi xảy ra",
        description: error?.message || "Không thể cập nhật user",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await callDeleteUser(id);
      if (+res.statusCode !== 200) throw res;
      return res;
    },
    onSuccess: () => {
      message.success("Xóa User thành công");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      notification.error({
        message: "Có lỗi xảy ra",
        description: error?.message || "Không thể xóa user",
      });
    },
  });

  return {
    users: query.data?.data?.result ?? [],
    meta: query.data?.data?.meta ?? {
      page: 1,
      pageSize: 10,
      total: 0,
      pages: 0,
    },
    isFetching: query.isFetching,

    createUser: createMutation.mutateAsync,
    updateUser: updateMutation.mutateAsync,
    deleteUser: deleteMutation.mutateAsync,

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
