import DataTable from "@/components/client/data-table";
import { IJob } from "@/types/backend";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  ActionType,
  ProColumns,
  ProFormSelect,
} from "@ant-design/pro-components";
import { Button, Popconfirm, Space, Tag } from "antd";
import { useRef, useState } from "react";
import dayjs from "dayjs";
import queryString from "query-string";
import { useNavigate } from "react-router-dom";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { sfIn, sfLike } from "spring-filter-query-builder";
import { useJob } from "@/hooks/useJob";

const JobPage = () => {
  const tableRef = useRef<ActionType>();
  const navigate = useNavigate();

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

  const { jobs, meta, isFetching, deleteJob, isDeleting } = useJob(queryStr);

  const handleDeleteJob = async (id: string | undefined) => {
    if (id) {
      await deleteJob(id);
    }
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    let sortBy = "";
    const fields = ["name", "salary", "createdAt", "updatedAt"];

    if (sorter && sorter.field && fields.includes(sorter.field as string)) {
      const order = sorter.order === "ascend" ? "asc" : "desc";
      sortBy = `${sorter.field},${order}`;
    }
    if (!sortBy) sortBy = "updatedAt,desc";

    setParams((prev) => ({
      ...prev,
      current: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      sort: sortBy,
    }));
  };

  const handleSearch = (values: any) => {
    let parts = [];
    if (values.name) parts.push(`${sfLike("name", values.name)}`);
    if (values.salary) parts.push(`${sfLike("salary", values.salary)}`);

    if (values.level && values.level.length > 0) {
      parts.push(`${sfIn("level", values.level)}`);
    }

    const filterStr = parts.join(" and ");

    setParams((prev) => ({
      ...prev,
      current: 1,
      filter: filterStr,
    }));
  };

  const columns: ProColumns<IJob>[] = [
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
      title: "Tên Job",
      dataIndex: "name",
      sorter: true,
    },
    {
      title: "Công ty",
      dataIndex: ["company", "name"],
      sorter: true,
      hideInSearch: true,
    },
    {
      title: "Mức lương",
      dataIndex: "salary",
      sorter: true,
      render(dom, entity, index, action, schema) {
        const str = "" + entity.salary;
        return <>{str?.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} đ</>;
      },
    },
    {
      title: "Level",
      dataIndex: "level",
      valueType: "select",
      valueEnum: {
        INTERN: { text: "INTERN" },
        FRESHER: { text: "FRESHER" },
        JUNIOR: { text: "JUNIOR" },
        MIDDLE: { text: "MIDDLE" },
        SENIOR: { text: "SENIOR" },
      },
      fieldProps: {
        mode: "multiple",
      },
      renderFormItem: (item, props, form) => (
        <ProFormSelect
          showSearch
          mode="multiple"
          allowClear
          valueEnum={{
            INTERN: "INTERN",
            FRESHER: "FRESHER",
            JUNIOR: "JUNIOR",
            MIDDLE: "MIDDLE",
            SENIOR: "SENIOR",
          }}
          placeholder="Chọn level"
          {...props}
        />
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      render(dom, entity, index, action, schema) {
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
          <Access permission={ALL_PERMISSIONS.JOBS.UPDATE} hideChildren>
            <EditOutlined
              style={{ fontSize: 20, color: "#ffa500" }}
              onClick={() => navigate(`/admin/job/upsert?id=${entity.id}`)}
            />
          </Access>
          <Access permission={ALL_PERMISSIONS.JOBS.DELETE} hideChildren>
            <Popconfirm
              placement="leftTop"
              title={"Xác nhận xóa job"}
              description={"Bạn có chắc chắn muốn xóa job này ?"}
              onConfirm={() => handleDeleteJob(entity.id)}
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
      <Access permission={ALL_PERMISSIONS.JOBS.GET_PAGINATE}>
        <DataTable<IJob>
          actionRef={tableRef}
          headerTitle="Danh sách Jobs"
          rowKey="id"
          loading={isFetching}
          columns={columns}
          dataSource={jobs}
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
          toolBarRender={(_action, _rows): any => {
            return (
              <Access permission={ALL_PERMISSIONS.JOBS.CREATE} hideChildren>
                <Button
                  icon={<PlusOutlined />}
                  type="primary"
                  onClick={() => navigate("upsert")}
                >
                  Thêm mới
                </Button>
              </Access>
            );
          }}
        />
      </Access>
    </div>
  );
};

export default JobPage;
