import DataTable from "@/components/client/data-table";
import { IPermission } from "@/types/backend";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ActionType, ProColumns } from "@ant-design/pro-components";
import { Button, Popconfirm, Space } from "antd";
import { useState, useRef } from "react";
import dayjs from "dayjs";
import queryString from "query-string";
import ViewDetailPermission from "@/components/admin/permission/view.permission";
import ModalPermission from "@/components/admin/permission/modal.permission";
import { colorMethod } from "@/config/utils";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { usePermission } from "@/hooks/usePermission"; // IMPORT HOOK

const PermissionPage = () => {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [dataInit, setDataInit] = useState<IPermission | null>(null);
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

  const { permissions, meta, isFetching, deletePermission, isDeleting } =
    usePermission(queryStr);

  const handleDeletePermission = async (id: string | undefined) => {
    if (id) await deletePermission(id);
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    let sortBy = "";
    const fields = [
      "name",
      "apiPath",
      "method",
      "module",
      "createdAt",
      "updatedAt",
    ];
    if (sorter && sorter.field && fields.includes(sorter.field as string)) {
      sortBy =
        sorter.order === "ascend"
          ? `${sorter.field},asc`
          : `${sorter.field},desc`;
    }
    if (!sortBy) sortBy = "updatedAt,desc";

    let parts = [];
    if (filters?.name) parts.push(`name ~ '${filters.name}'`);
    if (filters?.apiPath) parts.push(`apiPath ~ '${filters.apiPath}'`);
    if (filters?.method) parts.push(`method ~ '${filters.method}'`);
    if (filters?.module) parts.push(`module ~ '${filters.module}'`);

    const filterStr = parts.join(" and ");

    setParams({
      current: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      sort: sortBy,
      filter: filterStr,
    });
  };

  const columns: ProColumns<IPermission>[] = [
    {
      title: "Id",
      dataIndex: "id",
      width: 50,
      render: (text, record, index, action) => {
        return (
          <a
            href="#"
            onClick={() => {
              setOpenViewDetail(true);
              setDataInit(record);
            }}
          >
            {record.id}
          </a>
        );
      },
      hideInSearch: true,
    },
    {
      title: "Name",
      dataIndex: "name",
      sorter: true,
    },
    {
      title: "API",
      dataIndex: "apiPath",
      sorter: true,
    },
    {
      title: "Method",
      dataIndex: "method",
      sorter: true,
      render(dom, entity, index, action, schema) {
        return (
          <p
            style={{
              paddingLeft: 10,
              fontWeight: "bold",
              marginBottom: 0,
              color: colorMethod(entity?.method as string),
            }}
          >
            {entity?.method || ""}
          </p>
        );
      },
    },
    {
      title: "Module",
      dataIndex: "module",
      sorter: true,
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
          <Access permission={ALL_PERMISSIONS.PERMISSIONS.UPDATE} hideChildren>
            <EditOutlined
              style={{ fontSize: 20, color: "#ffa500" }}
              onClick={() => {
                setOpenModal(true);
                setDataInit(entity);
              }}
            />
          </Access>
          <Access permission={ALL_PERMISSIONS.PERMISSIONS.DELETE} hideChildren>
            <Popconfirm
              placement="leftTop"
              title={"Xác nhận xóa permission"}
              description={"Bạn có chắc chắn muốn xóa permission này ?"}
              onConfirm={() => handleDeletePermission(entity.id)}
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
      <Access permission={ALL_PERMISSIONS.PERMISSIONS.GET_PAGINATE}>
        <DataTable<IPermission>
          actionRef={tableRef}
          headerTitle="Danh sách Permissions (Quyền Hạn)"
          rowKey="id"
          loading={isFetching}
          columns={columns}
          dataSource={permissions}
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
      <ModalPermission
        openModal={openModal}
        setOpenModal={setOpenModal}
        reloadTable={() => setParams((prev) => ({ ...prev, current: 1 }))}
        dataInit={dataInit}
        setDataInit={setDataInit}
      />

      <ViewDetailPermission
        onClose={setOpenViewDetail}
        open={openViewDetail}
        dataInit={dataInit}
        setDataInit={setDataInit}
      />
    </div>
  );
};

export default PermissionPage;
