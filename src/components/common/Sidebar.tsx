import { useNavigate } from 'react-router-dom';
import { Button, Typography, Space } from 'antd';
import { FormOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface SidebarProps {
  className?: string;
}

interface ChatHistoryItem {
  id: string;
  title: string;
  date: string;
  group: string;
}

const mockHistory: ChatHistoryItem[] = [
  { id: '1', title: '关于职业选择', date: '21:20', group: '今天' },
  { id: '2', title: '和父母的沟通', date: '昨天', group: '昨天' },
  { id: '3', title: '是否要换城市', date: '5月10日', group: '更早' },
  { id: '4', title: '考研还是工作', date: '5月8日', group: '更早' },
];

export function Sidebar({ className = '' }: SidebarProps) {
  const navigate = useNavigate();
  const groups = mockHistory.reduce<Record<string, ChatHistoryItem[]>>((acc, item) => {
    acc[item.group] = [...(acc[item.group] || []), item];
    return acc;
  }, {});

  return (
    <aside
      className={`
        flex h-screen w-full flex-col border-r border-[#E8D8C8]
        bg-[#F8F3ED]
        ${className}
      `}
    >
      <div className="px-4 py-5 flex-shrink-0">
        <Space className="w-full justify-between items-center" align="center">
          <Space size={10}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C8845A] text-[13px] font-medium text-white shadow-sm">
              伴
            </div>
            <div className="flex flex-col">
              <Text strong className="text-[15px] text-[#2C2C2A] block !mb-0 leading-tight">决策伙伴</Text>
              <Text type="secondary" className="text-[12px] opacity-80 mt-0.5">安静地记住你</Text>
            </div>
          </Space>
          <Button type="text" icon={<FormOutlined className="text-[16px]" />} className="text-[#A06040] hover:!bg-[#F0DFC8]" />
        </Space>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
        <div className="px-2 mb-3 flex items-center gap-2">
          <ClockCircleOutlined className="text-[#B09880] text-[13px]" />
          <Text type="secondary" className="text-[13px] font-medium tracking-wide">历史对话</Text>
        </div>

        {mockHistory.length === 0 ? (
          <Text type="secondary" className="px-2 text-[13px] block mt-2">还没有历史对话</Text>
        ) : (
          <div className="space-y-5 mt-4">
            {Object.entries(groups).map(([group, items]) => (
              <div key={group} className="space-y-1.5">
                <Text type="secondary" className="px-2 text-[12px] block mb-1 opacity-70">{group}</Text>
                <div className="space-y-1">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="w-full text-left rounded-lg px-3 py-2 transition-colors hover:bg-white/70 focus:bg-white group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="truncate text-[14px] text-[#4A3C31] font-medium group-hover:text-[#A06040] transition-colors">{item.title}</div>
                          <div className="text-[12px] text-[#B09880] mt-0.5 font-light">{item.date}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[#E8D8C8] p-3 bg-transparent flex-shrink-0">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-[#A06040] bg-white/75 border border-[#E8D8C8] transition-all hover:bg-white"
        >
          <div className="flex items-center gap-3">
            <UserOutlined className="text-lg" />
            <span>全景画像</span>
          </div>
          <span aria-hidden="true" className="font-serif">→</span>
        </button>
      </div>
    </aside>
  );
}
