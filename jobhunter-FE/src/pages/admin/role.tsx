import DataTable from "@/components/client/data-table";
import { IRole } from "@/types/backend";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ActionType, ProColumns } from "@ant-design/pro-components";
import { Button, Popconfirm, Space, Tag } from "antd";
import { useState, useRef, useMemo } from "react";
import dayjs from "dayjs";
import queryString from "query-string";
import ModalRole from "@/components/admin/role/modal.role";
import { ALL_PERMISSIONS } from "@/config/permissions";
import Access from "@/components/share/access";
import { sfLike } from "spring-filter-query-builder";
import { groupByPermission } from "@/config/utils";
import { useRole } from "@/hooks/useRole";
import { usePermission } from "@/hooks/usePermission";

const RolePage = () => {
  // 1. State UI
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [singleRole, setSingleRole] = useState<IRole | null>(null);
  const tableRef = useRef<ActionType>();

  // 2. State Params
  const [params, setParams] = useState({
    current: 1,
    pageSize: 10,
    sort: "updatedAt,desc",
    filter: "",
  });

  // 3. Build Query String cho Role Table
  const queryStr = queryString.stringify(
    {
      page: params.current,
      size: params.pageSize,
      sort: params.sort,
      filter: params.filter || undefined,
    },
    { skipNull: true, skipEmptyString: true }
  );

  const { roles, meta, isFetching, deleteRole, isDeleting } = useRole(queryStr);

  const { permissions } = usePermission("page=1&size=1000");

  const listPermissions = useMemo(() => {
    return groupByPermission(permissions);
  }, [permissions]);

  const handleDeleteRole = async (id: string | undefined) => {
    if (id) await deleteRole(id);
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    let sortBy = "";
    if (sorter && sorter.name)
      sortBy = sorter.name === "ascend" ? "name,asc" : "name,desc";
    if (sorter && sorter.createdAt)
      sortBy =
        sorter.createdAt === "ascend" ? "createdAt,asc" : "createdAt,desc";
    if (sorter && sorter.updatedAt)
      sortBy =
        sorter.updatedAt === "ascend" ? "updatedAt,asc" : "updatedAt,desc";
    if (!sortBy) sortBy = "updatedAt,desc";

    let filterStr = "";
    if (filters?.name) filterStr += `${sfLike("name", filters.name)}`;

    setParams({
      current: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      sort: sortBy,
      filter: filterStr,
    });
  };

  const columns: ProColumns<IRole>[] = [
    {
      title: "Id",
      dataIndex: "id",
      width: 250,
      render: (text, record) => <span>{record.id}</span>,
      hideInSearch: true,
    },
    {
      title: "Name",
      dataIndex: "name",
      sorter: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      render(dom, entity) {
        return (
          <Tag color={entity.active ? "lime" : "red"}>
            {entity.active ? "ACTIVE" : "INACTIVE"}
          </Tag>
        );
      },
      hideInSearch: true,
    },
    {
      title: "CreatedAt",
      dataIndex: "createdAt",
      width: 200,
      sorter: true,
      render: (text, record) => (
        <>
          {record.createdAt
            ? dayjs(record.createdAt).format("DD-MM-YYYY HH:mm:ss")
            : ""}
        </>
      ),
      hideInSearch: true,
    },
    {
      title: "UpdatedAt",
      dataIndex: "updatedAt",
      width: 200,
      sorter: true,
      render: (text, record) => (
        <>
          {record.updatedAt
            ? dayjs(record.updatedAt).format("DD-MM-YYYY HH:mm:ss")
            : ""}
        </>
      ),
      hideInSearch: true,
    },
    {
      title: "Actions",
      hideInSearch: true,
      width: 50,
      render: (_value, entity) => (
        <Space>
          <Access permission={ALL_PERMISSIONS.ROLES.UPDATE} hideChildren>
            <EditOutlined
              style={{ fontSize: 20, color: "#ffa500" }}
              onClick={() => {
                setSingleRole(entity);
                setOpenModal(true);
              }}
            />
          </Access>
          <Access permission={ALL_PERMISSIONS.ROLES.DELETE} hideChildren>
            <Popconfirm
              placement="leftTop"
              title={"Xác nhận xóa role"}
              description={"Bạn có chắc chắn muốn xóa role này ?"}
              onConfirm={() => handleDeleteRole(entity.id)}
              okText="Xác nhận"
              cancelText="Hủy"
              okButtonProps={{ loading: isDeleting }}
            >
              <span style={{ cursor: "pointer", margin: "0 10px" }}>
                <DeleteOutlined style={{ fontSize: 20, color: "#ff4d4f" }} />
              </span>
            </Popconfirm>
          </Access>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Access permission={ALL_PERMISSIONS.ROLES.GET_PAGINATE}>
        <DataTable<IRole>
          actionRef={tableRef}
          headerTitle="Danh sách Roles (Vai Trò)"
          rowKey="id"
          loading={isFetching}
          columns={columns}
          dataSource={roles}
          onChange={handleTableChange}
          scroll={{ x: true }}
          pagination={{
            current: meta.page,
            pageSize: meta.pageSize,
            showSizeChanger: true,
            total: meta.total,
            showTotal: (total, range) => (
              <div>
                {" "}
                {range[0]}-{range[1]} trên {total} rows
              </div>
            ),
          }}
          rowSelection={false}
          toolBarRender={() => [
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => setOpenModal(true)}
            >
              Thêm mới
            </Button>,
          ]}
        />
      </Access>
      <ModalRole
        openModal={openModal}
        setOpenModal={setOpenModal}
        reloadTable={() => setParams((prev) => ({ ...prev, current: 1 }))}
        listPermissions={listPermissions}
        singleRole={singleRole}
        setSingleRole={setSingleRole}
      />
    </div>
  );
};

export default RolePage;
