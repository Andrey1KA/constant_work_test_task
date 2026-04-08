'use client';

import { Menu } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import Link from 'next/link';

export function SideMenu() {
  const items = [
    {
      key: '/tasks',
      icon: <HomeOutlined />,
      label: <Link href="/tasks">Список задач</Link>,
    },
  ];

  return (
    <Menu mode="inline" items={items} style={{ width: 200, height: '100%' }} />
  );
}
