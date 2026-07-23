import DataTable from "@/components/client/data-table";
import { ISkill } from "@/types/backend";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ActionType, ProColumns } from "@ant-design/pro-components";
import { Button, Popconfirm, Space } from "antd";
import { useState, useRef } from "react";
import dayjs from "dayjs";
import queryString from "query-string";
import { sfLike } from "spring-filter-query-builder";
import ModalSkill from "@/components/admin/skill/modal.skill";
import { useSkill } from "@/hooks/useSkill";

const SkillPage = () => {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [dataInit, setDataInit] = useState<ISkill | null>(null);
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

  const { skills, meta, isFetching, deleteSkill, isDeleting } =
    useSkill(queryStr);

  const handleDeleteSkill = async (id: string | undefined) => {
    if (id) await deleteSkill(id);
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    let sortBy = "";
    const fields = ["name", "createdAt", "updatedAt"];
    if (sorter && sorter.field && fields.includes(sorter.field as string)) {
      sortBy =
        sorter.order === "ascend"
          ? `${sorter.field},asc`
          : `${sorter.field},desc`;
    }
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

  const columns: ProColumns<ISkill>[] = [
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
      title: "Created By",
      dataIndex: "createdBy",
      hideInSearch: true,
    },
    {
      title: "Updated By",
      dataIndex: "updatedBy",
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
          <EditOutlined
            style={{ fontSize: 20, color: "#ffa500" }}
            onClick={() => {
              setOpenModal(true);
              setDataInit(entity);
            }}
          />
          <Popconfirm
            placement="leftTop"
            title={"Xác nhận xóa skill"}
            description={"Bạn có chắc chắn muốn xóa skill này ?"}
            onConfirm={() => handleDeleteSkill(entity.id)}
            okText="Xác nhận"
            cancelText="Hủy"
            okButtonProps={{ loading: isDeleting }}
          >
            <span style={{ cursor: "pointer", margin: "0 10px" }}>
              <DeleteOutlined style={{ fontSize: 20, color: "#ff4d4f" }} />
            </span>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <DataTable<ISkill>
        actionRef={tableRef}
        headerTitle="Danh sách Skill"
        rowKey="id"
        loading={isFetching}
        columns={columns}
        dataSource={skills}
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
      <ModalSkill
        openModal={openModal}
        setOpenModal={setOpenModal}
        reloadTable={() => setParams((prev) => ({ ...prev, current: 1 }))}
        dataInit={dataInit}
        setDataInit={setDataInit}
      />
    </div>
  );
};

export default SkillPage;
