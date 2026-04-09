'use client';

import { useCallback, useState } from 'react';
import { message } from 'antd';
import { llmWorkloadSummaryStream } from '@/lib/api';
import { apiErr } from '@/lib/utils/apiErr';

export function useWorkloadSummaryModal() {
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryText, setSummaryText] = useState('');

  const openSummary = useCallback(async () => {
    setSummaryOpen(true);
    setSummaryText('');
    setSummaryLoading(true);
    try {
      await llmWorkloadSummaryStream((chunk) => {
        setSummaryText((prev) => prev + chunk);
      });
    } catch (e) {
      message.error(apiErr(e));
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const handleSummaryModalCancel = useCallback(() => {
    setSummaryOpen(false);
  }, []);

  const handleSummaryCloseClick = useCallback(() => {
    setSummaryOpen(false);
  }, []);

  return {
    summaryOpen,
    summaryLoading,
    summaryText,
    openSummary,
    handleSummaryModalCancel,
    handleSummaryCloseClick,
  };
}
