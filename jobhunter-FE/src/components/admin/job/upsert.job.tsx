import {
  Breadcrumb,
  Col,
  ConfigProvider,
  Divider,
  Form,
  Row,
  message,
  notification,
} from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { DebounceSelect } from "../user/debouce.select";
import {
  FooterToolbar,
  ProForm,
  ProFormDatePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from "@ant-design/pro-components";
import styles from "styles/admin.module.scss";
import { LOCATION_LIST } from "@/config/utils";
import { ICompanySelect } from "../user/modal.user";
import { useState, useEffect } from "react";
import { callFetchCompany } from "@/config/api"; // Chỉ giữ lại API cần thiết cho debounce
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { CheckSquareOutlined } from "@ant-design/icons";
import enUS from "antd/lib/locale/en_US";
import dayjs from "dayjs";
import { ISkill } from "@/types/backend";
import { useJob, useJobById } from "@/hooks/useJob";
import { useSkill } from "@/hooks/useSkill";

interface ISkillSelect {
  label: string;
  value: string;
  key?: string;
}

const ViewUpsertJob = (props: any) => {
  const [companies, setCompanies] = useState<ICompanySelect[]>([]);
  const [skills, setSkills] = useState<ISkillSelect[]>([]);

  const navigate = useNavigate();
  const [value, setValue] = useState<string>("");

  let location = useLocation();
  let params = new URLSearchParams(location.search);
  const id = params?.get("id");

  const [form] = Form.useForm();

  const { data: jobDataRes, isLoading: isLoadingJob } = useJobById(id);
  const dataUpdate = jobDataRes?.data;

  const { skills: skillList } = useSkill("page=1&size=100");

  const { createJob, updateJob, isCreating, isUpdating } = useJob();

  useEffect(() => {
    if (skillList) {
      const arr = skillList.map((item) => {
        return {
          label: item.name as string,
          value: item.id as string,
          key: item.id,
        };
      });
      setSkills(arr);
    }
  }, [skillList]);

  useEffect(() => {
    if (dataUpdate && id) {
      setValue(dataUpdate.data?.description as string);

      setCompanies([
        {
          label: dataUpdate.data?.company?.name as string,
          value:
            `${dataUpdate.data?.company?.id}@#$${dataUpdate.data?.company?.logo}` as string,
          key: dataUpdate.data?.company?.id,
        },
      ]);

      const skillIds = dataUpdate.data?.skills?.map((item: ISkill) => item.id);

      form.setFieldsValue({
        ...dataUpdate,
        company: {
          label: dataUpdate.data?.company?.name as string,
          value:
            `${dataUpdate.data?.company?.id}@#$${dataUpdate.data?.company?.logo}` as string,
          key: dataUpdate.data?.company?.id,
        },
        skills: skillIds,
        startDate: dataUpdate.data?.startDate
          ? dayjs(dataUpdate.data.startDate)
          : null,
        endDate: dataUpdate.data?.endDate
          ? dayjs(dataUpdate.data.endDate)
          : null,
      });
    }
  }, [dataUpdate, id, form]);

  async function fetchCompanyList(name: string): Promise<ICompanySelect[]> {
    const res = await callFetchCompany(`page=1&size=100&name ~ '${name}'`);
    if (res && res.data) {
      const list = res.data.result;
      const temp = list.map((item) => {
        return {
          label: item.name as string,
          value: `${item.id}@#$${item.logo}` as string,
        };
      });
      return temp;
    } else return [];
  }

  const onFinish = async (values: any) => {
    const cp = values?.company?.value?.split("@#$");
    const companyData = {
      id: cp && cp.length > 0 ? cp[0] : "",
      name: values.company.label,
      logo: cp && cp.length > 1 ? cp[1] : "",
    };

    const arrSkills = values?.skills?.map((item: string) => {
      return { id: +item };
    });

    const commonData = {
      name: values.name,
      skills: arrSkills,
      company: companyData,
      location: values.location,
      salary: values.salary,
      quantity: values.quantity,
      level: values.level,
      description: value, // Lấy từ state ReactQuill
      startDate: dayjs(values.startDate, "DD/MM/YYYY").toDate(),
      endDate: dayjs(values.endDate, "DD/MM/YYYY").toDate(),
      active: values.active,
    };

    if (dataUpdate?.data?.id) {
      // UPDATE
      await updateJob({ id: dataUpdate.data.id, job: commonData });
      navigate("/admin/job");
    } else {
      // CREATE
      await createJob(commonData);
      navigate("/admin/job");
    }
  };

  return (
    <div className={styles["upsert-job-container"]}>
      <div className={styles["title"]}>
        <Breadcrumb
          separator=">"
          items={[
            { title: <Link to="/admin/job">Manage Job</Link> },
            { title: "Upsert Job" },
          ]}
        />
      </div>
      <div>
        <ConfigProvider locale={enUS}>
          <ProForm
            form={form}
            onFinish={onFinish}
            submitter={{
              searchConfig: {
                resetText: "Hủy",
                submitText: <>{id ? "Cập nhật Job" : "Tạo mới Job"}</>,
              },
              onReset: () => navigate("/admin/job"),
              render: (_: any, dom: any) => (
                <FooterToolbar>{dom}</FooterToolbar>
              ),
              submitButtonProps: {
                icon: <CheckSquareOutlined />,
                loading: isCreating || isUpdating, // Loading state
              },
            }}
          >
            <Row gutter={[20, 20]}>
              <Col span={24} md={12}>
                <ProFormText
                  label="Tên Job"
                  name="name"
                  rules={[
                    { required: true, message: "Vui lòng không bỏ trống" },
                  ]}
                  placeholder="Nhập tên job"
                />
              </Col>
              <Col span={24} md={6}>
                <ProFormSelect
                  name="skills"
                  label="Kỹ năng yêu cầu"
                  options={skills}
                  placeholder="Please select a skill"
                  rules={[
                    { required: true, message: "Vui lòng chọn kỹ năng!" },
                  ]}
                  allowClear
                  mode="multiple"
                  fieldProps={{ suffixIcon: null }}
                />
              </Col>
              <Col span={24} md={6}>
                <ProFormSelect
                  name="location"
                  label="Địa điểm"
                  options={LOCATION_LIST.filter((item) => item.value !== "ALL")}
                  placeholder="Please select a location"
                  rules={[
                    { required: true, message: "Vui lòng chọn địa điểm!" },
                  ]}
                />
              </Col>
              <Col span={24} md={6}>
                <ProFormDigit
                  label="Mức lương"
                  name="salary"
                  rules={[
                    { required: true, message: "Vui lòng không bỏ trống" },
                  ]}
                  placeholder="Nhập mức lương"
                  fieldProps={{
                    addonAfter: " đ",
                    formatter: (value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                    parser: (value) =>
                      +(value || "").replace(/\$\s?|(,*)/g, ""),
                  }}
                />
              </Col>
              <Col span={24} md={6}>
                <ProFormDigit
                  label="Số lượng"
                  name="quantity"
                  rules={[
                    { required: true, message: "Vui lòng không bỏ trống" },
                  ]}
                  placeholder="Nhập số lượng"
                />
              </Col>
              <Col span={24} md={6}>
                <ProFormSelect
                  name="level"
                  label="Trình độ"
                  valueEnum={{
                    INTERN: "INTERN",
                    FRESHER: "FRESHER",
                    JUNIOR: "JUNIOR",
                    MIDDLE: "MIDDLE",
                    SENIOR: "SENIOR",
                  }}
                  placeholder="Please select a level"
                  rules={[{ required: true, message: "Vui lòng chọn level!" }]}
                />
              </Col>

              {(dataUpdate?.data?.id || !id) && (
                <Col span={24} md={6}>
                  <ProForm.Item
                    name="company"
                    label="Thuộc Công Ty"
                    rules={[
                      { required: true, message: "Vui lòng chọn company!" },
                    ]}
                  >
                    <DebounceSelect
                      allowClear
                      showSearch
                      defaultValue={companies}
                      value={companies}
                      placeholder="Chọn công ty"
                      fetchOptions={fetchCompanyList}
                      onChange={(newValue: any) => {
                        if (newValue?.length === 0 || newValue?.length === 1) {
                          setCompanies(newValue as ICompanySelect[]);
                        }
                      }}
                      style={{ width: "100%" }}
                    />
                  </ProForm.Item>
                </Col>
              )}
            </Row>
            <Row gutter={[20, 20]}>
              <Col span={24} md={6}>
                <ProFormDatePicker
                  label="Ngày bắt đầu"
                  name="startDate"
                  fieldProps={{ format: "DD/MM/YYYY" }}
                  rules={[
                    { required: true, message: "Vui lòng chọn ngày cấp" },
                  ]}
                  placeholder="dd/mm/yyyy"
                />
              </Col>
              <Col span={24} md={6}>
                <ProFormDatePicker
                  label="Ngày kết thúc"
                  name="endDate"
                  fieldProps={{ format: "DD/MM/YYYY" }}
                  rules={[
                    { required: true, message: "Vui lòng chọn ngày cấp" },
                  ]}
                  placeholder="dd/mm/yyyy"
                />
              </Col>
              <Col span={24} md={6}>
                <ProFormSwitch
                  label="Trạng thái"
                  name="active"
                  checkedChildren="ACTIVE"
                  unCheckedChildren="INACTIVE"
                  initialValue={true}
                  fieldProps={{ defaultChecked: true }}
                />
              </Col>
              <Col span={24}>
                <ProForm.Item
                  name="description"
                  label="Miêu tả job"
                  rules={[
                    { required: true, message: "Vui lòng nhập miêu tả job!" },
                  ]}
                >
                  <ReactQuill theme="snow" value={value} onChange={setValue} />
                </ProForm.Item>
              </Col>
            </Row>
            <Divider />
          </ProForm>
        </ConfigProvider>
      </div>
    </div>
  );
};

export default ViewUpsertJob;
