import {
  CheckSquareOutlined,
  LoadingOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  FooterToolbar,
  ModalForm,
  ProCard,
  ProFormText,
  ProFormTextArea,
} from "@ant-design/pro-components";
import { Col, ConfigProvider, Form, Modal, Row, Upload, message } from "antd";
import "styles/reset.scss";
import { isMobile } from "react-device-detect";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useEffect, useState } from "react";
import { ICompany } from "@/types/backend";
import { v4 as uuidv4 } from "uuid";
import enUS from "antd/lib/locale/en_US";
import { useUpload } from "@/hooks/useUpload";
import { useCompany } from "@/hooks/useCompany";

interface IProps {
  openModal: boolean;
  setOpenModal: (v: boolean) => void;
  dataInit?: ICompany | null;
  setDataInit: (v: any) => void;
  reloadTable: () => void;
}

interface ICompanyForm {
  name: string;
  address: string;
}

interface ICompanyLogo {
  name: string;
  uid: string;
}

const ModalCompany = (props: IProps) => {
  const { openModal, setOpenModal, reloadTable, dataInit, setDataInit } = props;

  // Hooks
  const { uploadFile, isUploading } = useUpload();
  const { createCompany, updateCompany, isCreating, isUpdating } = useCompany();

  // State
  const [animation, setAnimation] = useState<string>("open");
  const [dataLogo, setDataLogo] = useState<ICompanyLogo[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [value, setValue] = useState<string>("");

  const [form] = Form.useForm();

  useEffect(() => {
    if (dataInit?.id) {
      setValue(dataInit.description ?? "");
      form.setFieldsValue({
        name: dataInit.name,
        address: dataInit.address,
      });
      if (dataInit.logo) {
        setDataLogo([
          {
            name: dataInit.logo,
            uid: uuidv4(),
          },
        ]);
      }
    }
  }, [dataInit]);

  const submitCompany = async (valuesForm: ICompanyForm) => {
    const { name, address } = valuesForm;
    if (dataLogo.length === 0) {
      message.error("Vui lòng upload ảnh Logo");
      return;
    }

    if (dataInit?.id) {
      // Update
      await updateCompany({
        id: dataInit.id,
        name,
        address,
        description: value,
        logo: dataLogo[0].name,
      });
      handleReset();
      // Không bắt buộc gọi reloadTable() nếu chỉ cần refresh data (hook đã lo),
      // nhưng nếu muốn reset về trang 1 thì giữ lại.
      // reloadTable();
    } else {
      // Create
      await createCompany({
        name,
        address,
        description: value,
        logo: dataLogo[0].name,
      });
      handleReset();
      reloadTable(); // Reset về trang 1 sau khi tạo mới
    }
  };

  const handleReset = async () => {
    form.resetFields();
    setValue("");
    setDataInit(null);
    setDataLogo([]);

    // Add animation when closing modal
    setAnimation("close");
    await new Promise((r) => setTimeout(r, 400));
    setOpenModal(false);
    setAnimation("open");
  };

  const handleRemoveFile = (file: any) => {
    setDataLogo([]);
  };

  const handlePreview = async (file: any) => {
    if (!file.originFileObj) {
      setPreviewImage(file.url);
      setPreviewOpen(true);
      setPreviewTitle(
        file.name || file.url.substring(file.url.lastIndexOf("/") + 1)
      );
      return;
    }
    getBase64(file.originFileObj, (url: string) => {
      setPreviewImage(url);
      setPreviewOpen(true);
      setPreviewTitle(
        file.name || file.url.substring(file.url.lastIndexOf("/") + 1)
      );
    });
  };

  const getBase64 = (img: any, callback: any) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result));
    reader.readAsDataURL(img);
  };

  const beforeUpload = (file: any) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG file!");
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must smaller than 2MB!");
    }
    return isJpgOrPng && isLt2M;
  };

  // Sử dụng useUpload hook
  const handleUploadFileLogo = async ({ file, onSuccess, onError }: any) => {
    try {
      const fileName = await uploadFile({ file, folder: "company" });
      setDataLogo([
        {
          name: fileName,
          uid: uuidv4(),
        },
      ]);
      if (onSuccess) onSuccess("ok");
    } catch (error) {
      if (onError) {
        setDataLogo([]);
        onError({ event: error });
      }
    }
  };

  return (
    <>
      {openModal && (
        <>
          <ModalForm
            title={<>{dataInit?.id ? "Cập nhật Company" : "Tạo mới Company"}</>}
            open={openModal}
            modalProps={{
              onCancel: () => {
                handleReset();
              },
              afterClose: () => handleReset(),
              destroyOnClose: true,
              width: isMobile ? "100%" : 900,
              footer: null,
              keyboard: false,
              maskClosable: false,
              className: `modal-company ${animation}`,
              rootClassName: `modal-company-root ${animation}`,
            }}
            scrollToFirstError={true}
            preserve={false}
            form={form}
            onFinish={submitCompany}
            initialValues={dataInit?.id ? dataInit : {}}
            submitter={{
              render: (_: any, dom: any) => (
                <FooterToolbar>{dom}</FooterToolbar>
              ),
              submitButtonProps: {
                icon: <CheckSquareOutlined />,
                loading: isCreating || isUpdating, // Loading state từ hook
              },
              searchConfig: {
                resetText: "Hủy",
                submitText: <>{dataInit?.id ? "Cập nhật" : "Tạo mới"}</>,
              },
            }}
          >
            <Row gutter={16}>
              <Col span={24}>
                <ProFormText
                  label="Tên công ty"
                  name="name"
                  rules={[
                    { required: true, message: "Vui lòng không bỏ trống" },
                  ]}
                  placeholder="Nhập tên công ty"
                />
              </Col>
              <Col span={8}>
                <Form.Item
                  labelCol={{ span: 24 }}
                  label="Ảnh Logo"
                  name="logo"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng không bỏ trống",
                      validator: () => {
                        if (dataLogo.length > 0) return Promise.resolve();
                        else return Promise.reject(false);
                      },
                    },
                  ]}
                >
                  <ConfigProvider locale={enUS}>
                    <Upload
                      name="logo"
                      listType="picture-card"
                      className="avatar-uploader"
                      maxCount={1}
                      multiple={false}
                      customRequest={handleUploadFileLogo}
                      beforeUpload={beforeUpload}
                      // onChange={handleChange} // Không cần handleChange nữa vì hook đã xử lý
                      onRemove={(file) => handleRemoveFile(file)}
                      onPreview={handlePreview}
                      defaultFileList={
                        dataInit?.id && dataInit?.logo
                          ? [
                              {
                                uid: uuidv4(),
                                name: dataInit?.logo,
                                status: "done",
                                url: `${
                                  import.meta.env.VITE_BACKEND_URL
                                }/storage/company/${dataInit?.logo}`,
                              },
                            ]
                          : []
                      }
                    >
                      <div>
                        {isUploading ? <LoadingOutlined /> : <PlusOutlined />}
                        <div style={{ marginTop: 8 }}>Upload</div>
                      </div>
                    </Upload>
                  </ConfigProvider>
                </Form.Item>
              </Col>

              <Col span={16}>
                <ProFormTextArea
                  label="Địa chỉ"
                  name="address"
                  rules={[
                    { required: true, message: "Vui lòng không bỏ trống" },
                  ]}
                  placeholder="Nhập địa chỉ công ty"
                  fieldProps={{
                    autoSize: { minRows: 4 },
                  }}
                />
              </Col>

              <ProCard
                title="Miêu tả"
                headStyle={{ color: "#d81921" }}
                style={{ marginBottom: 20 }}
                headerBordered
                size="small"
                bordered
              >
                <Col span={24}>
                  <ReactQuill theme="snow" value={value} onChange={setValue} />
                </Col>
              </ProCard>
            </Row>
          </ModalForm>
          <Modal
            open={previewOpen}
            title={previewTitle}
            footer={null}
            onCancel={() => setPreviewOpen(false)}
            style={{ zIndex: 1500 }}
          >
            <img alt="example" style={{ width: "100%" }} src={previewImage} />
          </Modal>
        </>
      )}
    </>
  );
};

export default ModalCompany;
