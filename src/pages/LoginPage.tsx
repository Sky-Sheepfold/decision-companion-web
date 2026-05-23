import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as AntApp, Alert, Button, Checkbox, Form, Input } from 'antd';
import { ArrowRightOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { AuthLayout } from '../components/auth/AuthLayout';
import { getApiErrorMessage } from '../api/agent';
import { useAuthStore } from '../stores/authStore';

interface LoginFormValues {
  username: string;
  password: string;
  remember?: boolean;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const { user, loading, error, login } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    navigate(user.onboarded ? '/chat' : '/onboarding', { replace: true });
  }, [navigate, user]);

  async function handleSubmit(values: LoginFormValues) {
    try {
      const authUser = await login(values.username, values.password);
      message.success('欢迎回来');
      navigate(authUser.onboarded ? '/chat' : '/onboarding', { replace: true });
    } catch (err) {
      message.error(getApiErrorMessage(err, '登录失败'));
    }
  }

  return (
    <AuthLayout
      title="欢迎回来"
      subtitle="进入你的决策工作台，继续之前没有想完的事。"
      switchText="还没有账号？"
      switchTo="/register"
      switchLabel="创建一个"
    >
      {error && (
        <Alert
          type="error"
          showIcon
          title={error}
          className="mb-5 !rounded-lg !border-[#F5D5CB] !bg-[#FAECE7] !text-[#993C1D]"
        />
      )}

      <Form<LoginFormValues>
        layout="vertical"
        requiredMark={false}
        initialValues={{ remember: true }}
        onFinish={handleSubmit}
      >
        <Form.Item
          label="用户名"
          name="username"
          rules={[
            { required: true, message: '请输入用户名' },
            { max: 50, message: '用户名不能超过 50 个字符' },
            { validator: validateUsername },
          ]}
        >
          <Input
            size="large"
            prefix={<UserOutlined className="text-[#B09880]" />}
            placeholder="输入你的用户名"
            autoComplete="username"
            className="h-11"
          />
        </Form.Item>

        <Form.Item
          label="密码"
          name="password"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 8, message: '密码至少 8 位' },
            { max: 72, message: '密码不能超过 72 位' },
          ]}
        >
          <Input.Password
            size="large"
            prefix={<LockOutlined className="text-[#B09880]" />}
            placeholder="输入密码"
            autoComplete="current-password"
            className="h-11"
          />
        </Form.Item>

        <div className="mb-5 flex items-center justify-between gap-3">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox className="text-[13px] text-[#7D6958]">记住登录状态</Checkbox>
          </Form.Item>
          <span className="text-[12px] text-[#B09880]">密码找回稍后开放</span>
        </div>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={loading}
          icon={<ArrowRightOutlined />}
          iconPlacement="end"
          className="h-11 w-full !rounded-lg bg-[#C8845A] font-medium hover:!bg-[#A06040]"
        >
          进入工作台
        </Button>
      </Form>

      <PrivacyNote />
    </AuthLayout>
  );
}

function PrivacyNote() {
  return (
    <div className="mt-5 rounded-lg border border-[#EFE2D6] bg-[#FDFBF9] px-3 py-2 text-[12px] leading-5 text-[#8A7765]">
      你的对话和档案仅用于个性化陪伴与决策分析，你可以在之后查看和修正这些理解。
    </div>
  );
}

function validateUsername(_: unknown, value?: string) {
  if (!value || !/[\s/\\]/.test(value.trim())) return Promise.resolve();
  return Promise.reject(new Error('用户名不能包含空白字符、斜杠或反斜杠'));
}
