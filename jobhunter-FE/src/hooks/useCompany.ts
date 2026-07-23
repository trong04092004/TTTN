import {
  callCreateCompany,
  callDeleteCompany,
  callFetchCompany,
  callUpdateCompany,
} from "@/config/api";
import { IBackendRes, ICompany, IModelPaginate } from "@/types/backend";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { message, notification } from "antd";

export const useCompany = (queryString: string | null = null) => {
  const queryClient = useQueryClient();

  const query = useQuery<IBackendRes<IModelPaginate<ICompany>>>({
    queryKey: ["companies", queryString],
    queryFn: () => callFetchCompany(queryString || "") as any,
    placeholderData: keepPreviousData,
    enabled: !!queryString,
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      address: string;
      description: string;
      logo: string;
    }) => {
      const res = await callCreateCompany(
        data.name,
        data.address,
        data.description,
        data.logo
      );
    },

    onSuccess: () => {
      message.success("Thêm mới company thành công");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (error: any) => {
      notification.error({
        message: "Có lỗi xảy ra",
        description: error?.message || "Không thể tạo mới",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      address: string;
      description: string;
      logo: string;
    }) => {
      const res = await callUpdateCompany(
        data.id,
        data.name,
        data.address,
        data.description,
        data.logo
      );
    },

    onSuccess: () => {
      message.success("Cập nhật company thành công!");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },

    onError: (error: any) => {
      notification.error({
        message: "Có lỗi xảy ra",
        description: error?.message || "Không thể cập nhật",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await callDeleteCompany(id);
      if (+res.statusCode !== 200) throw res;
      return res;
    },

    onSuccess: () => {
      message.success("Xóa company thành công");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },

    onError: (error: any) => {
      notification.error({
        message: "Có lỗi xảy ra",
        description: error?.message || "Không thể xóa",
      });
    },
  });

  return {
    companies: query.data?.data?.result ?? [],
    meta: query.data?.data?.meta ?? {
      page: 1,
      pageSize: 10,
      total: 0,
      pages: 0,
    },
    isFetching: query.isFetching,
    isLoading: query.isLoading,

    createCompany: createMutation.mutateAsync,
    updateCompany: updateMutation.mutateAsync,
    deleteCompany: deleteMutation.mutateAsync,

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
