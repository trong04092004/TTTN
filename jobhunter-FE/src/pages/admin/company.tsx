// src/pages/admin/company.tsx
import ModalCompany from "@/components/admin/company/modal.company";
import DataTable from "@/components/client/data-table";
import { ICompany } from "@/types/backend";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ActionType, ProColumns } from "@ant-design/pro-components";
import { Button, Popconfirm, Space } from "antd";
import { useState, useRef } from "react";
import dayjs from "dayjs";
import queryString from "query-string";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { sfLike } from "spring-filter-query-builder";
import { useCompany } from "@/hooks/useCompany"; // Import Custom Hook

const CompanyPage = () => {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [dataInit, setDataInit] = useState<ICompany | null>(null);
  const tableRef = useRef<ActionType>();

  const [params, setParams] = useState({
    current: 1,
    pageSize: 10,
    sort: "updatedAt,desc",
    filter: "",
  });

  const queryStr = queryString.stringify(
    {
      page: params.current,
      size: params.pageSize,
      sort: params.sort,
      filter: params.filter || undefined,
    },
    { skipNull: true, skipEmptyString: true }
  );

  const { companies, meta, isFetching, deleteCompany, isDeleting } =
    useCompany(queryStr);

  const handleDeleteCompany = async (id: string | undefined) => {
    if (id) {
      await deleteCompany(id);
    }
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    let sortBy = "";
    if (sorter && sorter.name) {
      sortBy = sorter.name === "ascend" ? "name,asc" : "name,desc";
    }
    if (sorter && sorter.address) {
      sortBy = sorter.address === "ascend" ? "address,asc" : "address,desc";
    }
    if (sorter && sorter.createdAt) {
      sortBy =
        sorter.createdAt === "ascend" ? "createdAt,asc" : "createdAt,desc";
    }
    if (sorter && sorter.updatedAt) {
      sortBy =
        sorter.updatedAt === "ascend" ? "updatedAt,asc" : "updatedAt,desc";
    }
    if (!sortBy) sortBy = "updatedAt,desc";

    let filterStr = "";

    if (filters?.name) filterStr += `${sfLike("name", filters.name)}`;
    if (filters?.address) {
      filterStr +=
        (filterStr ? " and " : "") + `${sfLike("address", filters.address)}`;
    }

    setParams({
      current: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      sort: sortBy,
      filter: filterStr,
    });
  };

  const handleSearch = (values: any) => {
    let filterStr = "";
    if (values?.name) filterStr += `${sfLike("name", values.name)}`;
    if (values?.address) {
      filterStr +=
        (filterStr ? " and " : "") + `${sfLike("address", values.address)}`;
    }
    setParams((prev) => ({
      ...prev,
      current: 1,
      filter: filterStr,
    }));
  };

  const columns: ProColumns<ICompany>[] = [
    {
      title: "STT",
      key: "index",
      width: 50,
      align: "center",
      render: (text, record, index) => {
        return <>{index + 1 + (meta.page - 1) * meta.pageSize}</>;
      },
      hideInSearch: true,
    },
    {
      title: "Name",
      dataIndex: "name",
      sorter: true,
    },
    {
      title: "Address",
      dataIndex: "address",
      sorter: true,
    },
    {
      title: "CreatedAt",
      dataIndex: "createdAt",
      width: 200,
      sorter: true,
      render: (text, record, index, action) => {
        return (
          <>
            {record.createdAt
              ? dayjs(record.createdAt).format("DD-MM-YYYY HH:mm:ss")
              : ""}
          </>
        );
      },
      hideInSearch: true,
    },
    {
      title: "UpdatedAt",
      dataIndex: "updatedAt",
      width: 200,
      sorter: true,
      render: (text, record, index, action) => {
        return (
          <>
            {record.updatedAt
              ? dayjs(record.updatedAt).format("DD-MM-YYYY HH:mm:ss")
              : ""}
          </>
        );
      },
      hideInSearch: true,
    },
    {
      title: "Actions",
      hideInSearch: true,
      width: 50,
      render: (_value, entity, _index, _action) => (
        <Space>
          <Access permission={ALL_PERMISSIONS.COMPANIES.UPDATE} hideChildren>
            <EditOutlined
              style={{
                fontSize: 20,
                color: "#ffa500",
              }}
              type=""
              onClick={() => {
                setOpenModal(true);
                setDataInit(entity);
              }}
            />
          </Access>
          <Access permission={ALL_PERMISSIONS.COMPANIES.DELETE} hideChildren>
            <Popconfirm
              placement="leftTop"
              title={"Xác nhận xóa company"}
              description={"Bạn có chắc chắn muốn xóa company này ?"}
              onConfirm={() => handleDeleteCompany(entity.id)}
              okText="Xác nhận"
              cancelText="Hủy"
              okButtonProps={{ loading: isDeleting }} // Hiển thị loading khi đang xóa
            >
              <span style={{ cursor: "pointer", margin: "0 10px" }}>
                <DeleteOutlined
                  style={{
                    fontSize: 20,
                    color: "#ff4d4f",
                  }}
                />
              </span>
            </Popconfirm>
          </Access>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Access permission={ALL_PERMISSIONS.COMPANIES.GET_PAGINATE}>
        <DataTable<ICompany>
          actionRef={tableRef}
          headerTitle="Danh sách Công Ty"
          rowKey="id"
          loading={isFetching}
          columns={columns}
          dataSource={companies} // Truyền trực tiếp data từ hook
          // Xử lý sự kiện thay đổi table
          onChange={handleTableChange}
          // Xử lý sự kiện Search form
          onSubmit={(values) => handleSearch(values)}
          onReset={() =>
            setParams((prev) => ({ ...prev, filter: "", current: 1 }))
          }
          scroll={{ x: true }}
          pagination={{
            current: meta.page,
            pageSize: meta.pageSize,
            showSizeChanger: true,
            total: meta.total,
            showTotal: (total, range) => {
              return (
                <div>
                  {" "}
                  {range[0]}-{range[1]} trên {total} rows
                </div>
              );
            },
          }}
          rowSelection={false}
          toolBarRender={(_action, _rows): any => {
            return (
              <Access
                permission={ALL_PERMISSIONS.COMPANIES.CREATE}
                hideChildren
              >
                <Button
                  icon={<PlusOutlined />}
                  type="primary"
                  onClick={() => setOpenModal(true)}
                >
                  Thêm mới
                </Button>
              </Access>
            );
          }}
        />
      </Access>
      <ModalCompany
        openModal={openModal}
        setOpenModal={setOpenModal}
        reloadTable={() => setParams((prev) => ({ ...prev, current: 1 }))}
        dataInit={dataInit}
        setDataInit={setDataInit}
      />
    </div>
  );
};

export default CompanyPage;
