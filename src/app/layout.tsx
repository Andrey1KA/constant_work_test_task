import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { QueryProvider } from '@/app/providers/QueryProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Интеллектуальный менеджер задач',
  description: 'Задачи и LLM-ассистент',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <AntdRegistry>
          <QueryProvider>
            <ConfigProvider locale={ruRU}>{children}</ConfigProvider>
          </QueryProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
