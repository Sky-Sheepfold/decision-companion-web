import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CircleAlert, Eye, EyeOff, Loader2, Lock, User } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { validatePassword, validateUsername } from '../components/auth/validate';
import { getApiErrorMessage } from '../api/agent';
import { useAuthStore } from '../stores/authStore';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginFormValues {
  username: string;
  password: string;
  remember: boolean;
}

type LoginField = 'username' | 'password';

export function LoginPage() {
  const navigate = useNavigate();
  const { user, loading, login } = useAuthStore();
  const [values, setValues] = useState<LoginFormValues>({ username: '', password: '', remember: true });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<LoginField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    navigate(user.onboarded ? '/chat' : '/onboarding', { replace: true });
  }, [navigate, user]);

  function validateField(field: LoginField, next: LoginFormValues): string | undefined {
    return field === 'username' ? validateUsername(next.username) : validatePassword(next.password);
  }

  function handleChange(field: LoginField, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    setFormError(null);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, next) }));
    }
  }

  function handleBlur(field: LoginField) {
    setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, values) }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors: Partial<Record<LoginField, string>> = {
      username: validateUsername(values.username),
      password: validatePassword(values.password),
    };
    setFieldErrors(errors);
    if (errors.username || errors.password) return;

    try {
      await login(values.username.trim(), values.password);
    } catch (err) {
      setFormError(getApiErrorMessage(err, '登录失败'));
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
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className="auth-error-banner" role="alert">
            <CircleAlert />
            <span>{formError}</span>
          </div>
        )}

        <div className="auth-field" data-invalid={fieldErrors.username ? true : undefined}>
          <Label htmlFor="login-username" className="sr-only">用户名</Label>
          <div className="auth-input-wrap">
            <User className="auth-input-icon" />
            <Input
              id="login-username"
              value={values.username}
              onChange={(event) => handleChange('username', event.target.value)}
              onBlur={() => handleBlur('username')}
              placeholder="用户名"
              autoComplete="username"
              aria-invalid={fieldErrors.username ? true : undefined}
              className="auth-input"
            />
          </div>
          {fieldErrors.username && <p className="auth-field-error">{fieldErrors.username}</p>}
        </div>

        <div className="auth-field" data-invalid={fieldErrors.password ? true : undefined}>
          <Label htmlFor="login-password" className="sr-only">密码</Label>
          <div className="auth-input-wrap">
            <Lock className="auth-input-icon" />
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={values.password}
              onChange={(event) => handleChange('password', event.target.value)}
              onBlur={() => handleBlur('password')}
              placeholder="密码"
              autoComplete="current-password"
              aria-invalid={fieldErrors.password ? true : undefined}
              className="auth-input auth-input-has-trail"
            />
            <button
              type="button"
              className="auth-input-trail"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          {fieldErrors.password && <p className="auth-field-error">{fieldErrors.password}</p>}
        </div>

        <div className="auth-row-between">
          <label className="auth-check" htmlFor="login-remember">
            <Checkbox
              id="login-remember"
              checked={values.remember}
              onCheckedChange={(checked) => setValues((prev) => ({ ...prev, remember: checked === true }))}
            />
            <span>记住登录状态</span>
          </label>
          <span className="auth-side-note">密码找回稍后开放</span>
        </div>

        <Button type="submit" size="lg" disabled={loading} className="auth-submit">
          {loading ? (
            <>
              <Loader2 className="animate-spin" />
              正在进入...
            </>
          ) : (
            <>
              进入工作台
              <ArrowRight />
            </>
          )}
        </Button>
      </form>

      <PrivacyNote />
    </AuthLayout>
  );
}

function PrivacyNote() {
  return (
    <div className="auth-privacy-note">
      你的对话和档案仅用于个性化陪伴与决策分析，你可以在之后查看和修正这些理解。
    </div>
  );
}
