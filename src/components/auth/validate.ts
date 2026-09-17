export function validateUsername(value: string): string | undefined {
  const username = value.trim();
  if (!username) return '请输入用户名';
  if (username.length > 50) return '用户名不能超过 50 个字符';
  if (/[\s/\\]/.test(username)) return '用户名不能包含空白字符、斜杠或反斜杠';
  return undefined;
}

export function validatePassword(value: string): string | undefined {
  if (!value) return '请输入密码';
  if (value.length < 8) return '密码至少 8 位';
  if (value.length > 72) return '密码不能超过 72 位';
  return undefined;
}
