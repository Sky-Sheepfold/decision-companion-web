import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as AntApp, Alert, Button, Checkbox, Form, Input } from 'antd';
import { ArrowRightOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { AuthLayout } from '../components/auth/AuthLayout';
import { getApiErrorMessage } from '../api/agent';
import { useAuthStore } from '../stores/authStore';

interface RegisterFormValues {
  username: string;
  password: string;
  confirmPassword: string;
  privacyAccepted: boolean;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const { user, loading, error, register } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    navigate(user.onboarded ? '/chat' : '/onboarding', { replace: true });
  }, [navigate, user]);

  async function handleSubmit(values: RegisterFormValues) {
    try {
      await register(values.username, values.password);
      message.success('账号已创建');
      navigate('/onboarding', { replace: true });
    } catch (err) {
      message.error(getApiErrorMessage(err, '注册失败'));
    }
  }

  return (
    <AuthLayout
      title="创建账号"
      subtitle="先建立一个稳定身份，再开始让伙伴慢慢认识你。"
      switchText="已有账号？"
      switchTo="/login"
      switchLabel="直接登录"
    >
      {error && (
        <Alert
          type="error"
          showIcon
          title={error}
          className="mb-5 !rounded-lg !border-[#F5D5CB] !bg-[#FAECE7] !text-[#993C1D]"
        />
      )}

      <Form<RegisterFormValues>
        layout="vertical"
        requiredMark={false}
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
            placeholder="支持中文用户名"
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
            placeholder="至少 8 位"
            autoComplete="new-password"
            className="h-11"
          />
        </Form.Item>

        <Form.Item
          label="确认密码"
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: '请再次输入密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password
            size="large"
            prefix={<LockOutlined className="text-[#B09880]" />}
            placeholder="再次输入密码"
            autoComplete="new-password"
            className="h-11"
          />
        </Form.Item>

        <Form.Item
          name="privacyAccepted"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) => value
                ? Promise.resolve()
                : Promise.reject(new Error('请先确认你理解档案生成方式')),
            },
          ]}
        >
          <Checkbox className="items-start text-[13px] leading-5 text-[#7D6958]">
            我理解：我的对话会被用于生成个人档案，并且我可以在之后查看和修正这些理解。
          </Checkbox>
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={loading}
          icon={<ArrowRightOutlined />}
          iconPlacement="end"
          className="h-11 w-full !rounded-lg bg-[#C8845A] font-medium hover:!bg-[#A06040]"
        >
          创建我的决策伙伴
        </Button>
      </Form>
    </AuthLayout>
  );
}

function validateUsername(_: unknown, value?: string) {
  if (!value || !/[\s/\\]/.test(value.trim())) return Promise.resolve();
  return Promise.reject(new Error('用户名不能包含空白字符、斜杠或反斜杠'));
}
