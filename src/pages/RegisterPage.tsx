import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CircleAlert, CircleCheck, Eye, EyeOff, Loader2, Lock, User } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { validatePassword, validateUsername } from '../components/auth/validate';
import { getApiErrorMessage } from '../api/agent';
import { useAuthStore } from '../stores/authStore';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RegisterFormValues {
  username: string;
  password: string;
  confirmPassword: string;
  privacyAccepted: boolean;
}

type RegisterField = 'username' | 'password' | 'confirmPassword';

export function RegisterPage() {
  const navigate = useNavigate();
  const { user, loading, register } = useAuthStore();
  const [values, setValues] = useState<RegisterFormValues>({
    username: '',
    password: '',
    confirmPassword: '',
    privacyAccepted: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RegisterField, string>>>({});
  const [privacyError, setPrivacyError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!user) return;
    navigate(user.onboarded ? '/chat' : '/onboarding', { replace: true });
  }, [navigate, user]);

  function validateField(field: RegisterField, next: RegisterFormValues): string | undefined {
    if (field === 'username') return validateUsername(next.username);
    if (field === 'password') return validatePassword(next.password);
    if (!next.confirmPassword) return '请再次输入密码';
    if (next.confirmPassword !== next.password) return '两次输入的密码不一致';
    return undefined;
  }

  function handleChange(field: RegisterField, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    setFormError(null);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, next) }));
    }
  }

  function handleBlur(field: RegisterField) {
    setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, values) }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors: Partial<Record<RegisterField, string>> = {
      username: validateUsername(values.username),
      password: validatePassword(values.password),
      confirmPassword: validateField('confirmPassword', values),
    };
    const privacy = values.privacyAccepted ? undefined : '请先确认你理解档案生成方式';
    setFieldErrors(errors);
    setPrivacyError(privacy ?? null);
    if (errors.username || errors.password || errors.confirmPassword || privacy) return;

    try {
      await register(values.username.trim(), values.password);
      setSubmitted(true);
    } catch (err) {
      setFormError(getApiErrorMessage(err, '注册失败'));
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
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className="auth-error-banner" role="alert">
            <CircleAlert />
            <span>{formError}</span>
          </div>
        )}

        <div className="auth-field" data-invalid={fieldErrors.username ? true : undefined}>
          <Label htmlFor="register-username" className="sr-only">用户名</Label>
          <div className="auth-input-wrap">
            <User className="auth-input-icon" />
            <Input
              id="register-username"
              value={values.username}
              onChange={(event) => handleChange('username', event.target.value)}
              onBlur={() => handleBlur('username')}
              placeholder="用户名（支持中文）"
              autoComplete="username"
              aria-invalid={fieldErrors.username ? true : undefined}
              className="auth-input"
            />
          </div>
          {fieldErrors.username && <p className="auth-field-error">{fieldErrors.username}</p>}
        </div>

        <div className="auth-field" data-invalid={fieldErrors.password ? true : undefined}>
          <Label htmlFor="register-password" className="sr-only">密码</Label>
          <div className="auth-input-wrap">
            <Lock className="auth-input-icon" />
            <Input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              value={values.password}
              onChange={(event) => handleChange('password', event.target.value)}
              onBlur={() => handleBlur('password')}
              placeholder="密码（至少 8 位）"
              autoComplete="new-password"
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

        <div className="auth-field" data-invalid={fieldErrors.confirmPassword ? true : undefined}>
          <Label htmlFor="register-confirm" className="sr-only">确认密码</Label>
          <div className="auth-input-wrap">
            <Lock className="auth-input-icon" />
            <Input
              id="register-confirm"
              type={showPassword ? 'text' : 'password'}
              value={values.confirmPassword}
              onChange={(event) => handleChange('confirmPassword', event.target.value)}
              onBlur={() => handleBlur('confirmPassword')}
              placeholder="再次输入密码"
              autoComplete="new-password"
              aria-invalid={fieldErrors.confirmPassword ? true : undefined}
              className="auth-input"
            />
          </div>
          {fieldErrors.confirmPassword && <p className="auth-field-error">{fieldErrors.confirmPassword}</p>}
        </div>

        <div className="auth-field" data-invalid={privacyError ? true : undefined}>
          <label className="auth-check auth-check-multiline" htmlFor="register-privacy">
            <Checkbox
              id="register-privacy"
              checked={values.privacyAccepted}
              onCheckedChange={(checked) => {
                setValues((prev) => ({ ...prev, privacyAccepted: checked === true }));
                setPrivacyError(null);
              }}
              aria-invalid={privacyError ? true : undefined}
            />
            <span>我理解：我的对话会被用于生成个人档案，并且我可以在之后查看和修正这些理解。</span>
          </label>
          {privacyError && <p className="auth-field-error">{privacyError}</p>}
        </div>

        <Button type="submit" size="lg" disabled={loading || submitted} className="auth-submit">
          {loading ? (
            <>
              <Loader2 className="animate-spin" />
              正在创建...
            </>
          ) : submitted ? (
            <>
              <CircleCheck />
              已创建，正在进入...
            </>
          ) : (
            <>
              创建我的决策伙伴
              <ArrowRight />
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
