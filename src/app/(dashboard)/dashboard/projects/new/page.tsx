import { PageHeader } from "@/components/shared/page-header";
import { ProjectForm } from "@/features/projects/project-form";

export default function NewProjectPage() {
  return (
    <>
      <PageHeader title="新建项目" description="完整表单页面范例：包含字段说明、服务端校验、提交状态和成功跳转。" />
      <ProjectForm />
    </>
  );
}
