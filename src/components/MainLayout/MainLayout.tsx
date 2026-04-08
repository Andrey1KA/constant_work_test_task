'use client';

import { Layout } from 'antd';
import Sider from 'antd/es/layout/Sider';
import { Content } from 'antd/es/layout/layout';
import { SideMenu } from '@/components/SideMenu/SideMenu';
import type { MainLayoutProps } from '@/components/MainLayout/types/mainLayout.types';

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200}>
        <SideMenu />
      </Sider>
      <Layout>
        <Content
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'flex-start',
            minHeight: '100vh',
            width: '100%',
            maxWidth: 1320,
            margin: '0 auto',
            padding: '24px',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
