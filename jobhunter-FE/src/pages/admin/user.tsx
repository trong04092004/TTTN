import DataTable from "@/components/client/data-table";
import { IUser } from "@/types/backend";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ActionType, ProColumns } from "@ant-design/pro-components";
import { Button, Popconfirm, Space } from "antd";
import { useState, useRef } from "react";
import dayjs from "dayjs";
import queryString from "query-string";
import ModalUser from "@/components/admin/user/modal.user";
import ViewDetailUser from "@/components/admin/user/view.user";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { sfLike } from "spring-filter-query-builder";
import { useUser } from "@/hooks/useUser"; // IMPORT HOOK MỚI

const UserPage = () => {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [dataInit, setDataInit] = useState<IUser | null>(null);
  const [openViewDetail, setOpenViewDetail] = useState<boolean>(false);
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

  const { users, meta, isFetching, deleteUser, isDeleting } = useUser(queryStr);
  console.log("Users data:", users);

  const handleDeleteUser = async (id: string | undefined) => {
    if (id) await deleteUser(id);
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    let sortBy = "";
    if (sorter && sorter.name)
      sortBy = sorter.name === "ascend" ? "name,asc" : "name,desc";
    if (sorter && sorter.email)
      sortBy = sorter.email === "ascend" ? "email,asc" : "email,desc";
    if (sorter && sorter.createdAt)
      sortBy =
        sorter.createdAt === "ascend" ? "createdAt,asc" : "createdAt,desc";
    if (sorter && sorter.updatedAt)
      sortBy =
        sorter.updatedAt === "ascend" ? "updatedAt,asc" : "updatedAt,desc";
    if (!sortBy) sortBy = "updatedAt,desc";

    let filterStr = "";
    if (filters?.name) filterStr += `${sfLike("name", filters.name)}`;
    if (filters?.email) {
      filterStr +=
        (filterStr ? " and " : "") + `${sfLike("email", filters.email)}`;
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
    if (values?.email)
      filterStr +=
        (filterStr ? " and " : "") + `${sfLike("email", values.email)}`;

    setParams((prev) => ({ ...prev, current: 1, filter: filterStr }));
  };

  const columns: ProColumns<IUser>[] = [
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
      title: "Email",
      dataIndex: "email",
      sorter: true,
    },
    {
      title: "Role",
      dataIndex: ["role", "name"],
      sorter: true,
      hideInSearch: true,
    },
    {
      title: "Company",
      dataIndex: ["company", "name"],
      sorter: true,
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
          <Access permission={ALL_PERMISSIONS.USERS.UPDATE} hideChildren>
            <EditOutlined
              style={{ fontSize: 20, color: "#ffa500" }}
              onClick={() => {
                setOpenModal(true);
                setDataInit(entity);
              }}
            />
          </Access>

          <Access permission={ALL_PERMISSIONS.USERS.DELETE} hideChildren>
            <Popconfirm
              placement="leftTop"
              title={"Xác nhận xóa user"}
              description={"Bạn có chắc chắn muốn xóa user này ?"}
              onConfirm={() => handleDeleteUser(entity.id)}
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
      <Access permission={ALL_PERMISSIONS.USERS.GET_PAGINATE}>
        <DataTable<IUser>
          actionRef={tableRef}
          headerTitle="Danh sách Users"
          rowKey="id"
          loading={isFetching}
          columns={columns}
          dataSource={users}
          onChange={handleTableChange}
          onSubmit={handleSearch}
          onReset={() =>
            setParams((prev) => ({ ...prev, current: 1, filter: "" }))
          }
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
            <Access permission={ALL_PERMISSIONS.USERS.CREATE} hideChildren>
              <Button
                icon={<PlusOutlined />}
                type="primary"
                onClick={() => setOpenModal(true)}
              >
                Thêm mới
              </Button>
            </Access>,
          ]}
        />
      </Access>
      <ModalUser
        openModal={openModal}
        setOpenModal={setOpenModal}
        reloadTable={() => setParams((prev) => ({ ...prev, current: 1 }))}
        dataInit={dataInit}
        setDataInit={setDataInit}
      />
      <ViewDetailUser
        onClose={setOpenViewDetail}
        open={openViewDetail}
        dataInit={dataInit}
        setDataInit={setDataInit}
      />
    </div>
  );
};

export default UserPage;
