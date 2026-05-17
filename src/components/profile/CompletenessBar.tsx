import { Card, Progress, Typography } from 'antd';

const { Text } = Typography;

interface CompletenessBarProps {
  score: number;
  count: number;
  description: string;
}

export function CompletenessBar({ score, count, description }: CompletenessBarProps) {
  return (
    <Card
      variant="borderless"
      className="shadow-[0_16px_48px_rgba(106,64,32,0.06)]"
      styles={{ body: { padding: '24px' } }}
    >
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <Text type="secondary" className="text-[13px]">了解程度</Text>
          <p className="mt-1 mb-0 text-[15px] text-[var(--color-text)]">{description}</p>
        </div>
        <span className="font-serif text-[22px] font-medium leading-none text-[var(--color-text)]">
          {score}%
        </span>
      </div>
      <Progress
        percent={score}
        showInfo={false}
        strokeColor={{
          '0%': '#7F77DD',
          '100%': '#AFA9EC',
        }}
        railColor="var(--color-border)"
        className="mb-3"
      />
      <div className="flex items-center justify-between text-[13px]">
        <Text type="secondary">已对话 {count} 次</Text>
        <span className="text-[var(--color-text-warm)]">继续聊，它会更懂你</span>
      </div>
    </Card>
  );
}
