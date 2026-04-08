'use client';

import { useCallback } from 'react';
import { Space } from 'antd';
import type { CheckboxChangeEvent } from 'antd';
import type { DayjsRangePickerChangeValue } from '@/types/dayjsRange';
import { useTaskBoardModals } from '@/lib/taskBoard/useTaskBoardModals';
import {
  TasksBoardProvider,
  useTasksBoard,
} from '@/state/tasksBoard';
import { CategorySuggestModal } from '@/views/TaskBoardPage/CategorySuggestModal';
import { DecomposeSubtasksModal } from '@/views/TaskBoardPage/DecomposeSubtasksModal';
import { PrioritySuggestModal } from '@/views/TaskBoardPage/PrioritySuggestModal';
import { TaskBoardFilters } from '@/views/TaskBoardPage/TaskBoardFilters';
import { TaskBoardTableSection } from '@/views/TaskBoardPage/TaskBoardTableSection';
import { TaskBoardToolbar } from '@/views/TaskBoardPage/TaskBoardToolbar';
import { TaskFormModal } from '@/views/TaskBoardPage/TaskFormModal';
import { WorkloadSummaryModal } from '@/views/TaskBoardPage/WorkloadSummaryModal';
import type { Priority, TaskStatus } from '@/types/task';

function TaskBoardPageContent() {
  const {
    tasks,
    total,
    isFetching,
    refetch,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    dateRange,
    setDateRange,
    overdueOnly,
    setOverdueOnly,
    setAppliedSearch,
    tablePage,
    tablePageSize,
    handleTableChange,
    columnSortOrder,
    deleteTaskMut,
    createTaskMut,
    updateTaskMut,
  } = useTasksBoard();

  const {
    openSummary,
    openCreate,
    openEdit,
    aiMenu,
    form,
    taskModalOpen,
    editing,
    handleTaskModalCancel,
    handleTaskFormFinish,
    catTask,
    catLoading,
    catSuggestion,
    handleCategoryModalCancel,
    handleCategoryAccept,
    handleCategoryReject,
    decTask,
    decLoading,
    decItems,
    createDecItemChangeHandler,
    handleDecCreateClick,
    handleDecCancelClick,
    priTask,
    priLoading,
    priValue,
    priReason,
    handlePriorityModalCancel,
    handlePriValueChange,
    handlePriApplyClick,
    handlePriRejectClick,
    summaryOpen,
    summaryLoading,
    summaryText,
    handleSummaryModalCancel,
    handleSummaryCloseClick,
  } = useTaskBoardModals();

  const handleOpenSummaryClick = useCallback(() => {
    void openSummary();
  }, [openSummary]);

  const handleRefetchClick = useCallback(() => {
    void refetch();
  }, [refetch]);

  const handleFilterStatusChange = useCallback(
    (value?: TaskStatus) => {
      setFilterStatus(value);
    },
    [setFilterStatus]
  );

  const handleFilterPriorityChange = useCallback(
    (value?: Priority) => {
      setFilterPriority(value);
    },
    [setFilterPriority]
  );

  const handleDateRangeChange = useCallback(
    (dates: DayjsRangePickerChangeValue) => {
      if (dates?.[0] && dates[1]) {
        setDateRange([dates[0], dates[1]]);
      } else {
        setDateRange(null);
      }
    },
    [setDateRange]
  );

  const handleOverdueOnlyChange = useCallback(
    (e: CheckboxChangeEvent) => {
      setOverdueOnly(e.target.checked);
    },
    [setOverdueOnly]
  );

  const handleTaskSearch = useCallback(
    (v: string) => {
      setAppliedSearch(v);
    },
    [setAppliedSearch]
  );

  const handleDeleteRow = useCallback(
    (id: string) => {
      deleteTaskMut.mutate(id);
    },
    [deleteTaskMut]
  );

  return (
    <div style={{ width: '100%', maxWidth: 1280 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <TaskBoardToolbar
          onWorkloadClick={handleOpenSummaryClick}
          onNewTaskClick={openCreate}
        />
        <TaskBoardFilters
          filterStatus={filterStatus}
          onFilterStatusChange={handleFilterStatusChange}
          filterPriority={filterPriority}
          onFilterPriorityChange={handleFilterPriorityChange}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          overdueOnly={overdueOnly}
          onOverdueOnlyChange={handleOverdueOnlyChange}
          onSearch={handleTaskSearch}
          onRefreshClick={handleRefetchClick}
          isRefreshing={isFetching}
        />
        <TaskBoardTableSection
          tasks={tasks}
          total={total}
          isFetching={isFetching}
          tablePage={tablePage}
          tablePageSize={tablePageSize}
          onTableChange={handleTableChange}
          columnSortOrder={columnSortOrder}
          onEditRow={openEdit}
          onDeleteRow={handleDeleteRow}
          getAiMenu={aiMenu}
        />
      </Space>

      <TaskFormModal
        open={taskModalOpen}
        editing={editing}
        form={form}
        onCancel={handleTaskModalCancel}
        onFinish={handleTaskFormFinish}
        isSubmitting={
          createTaskMut.isPending || updateTaskMut.isPending
        }
      />

      <CategorySuggestModal
        open={Boolean(catTask)}
        loading={catLoading}
        task={catTask}
        suggestion={catSuggestion}
        onCancel={handleCategoryModalCancel}
        onAccept={handleCategoryAccept}
        onReject={handleCategoryReject}
      />

      <DecomposeSubtasksModal
        open={Boolean(decTask)}
        loading={decLoading}
        task={decTask}
        items={decItems}
        getLineChangeHandler={createDecItemChangeHandler}
        onCancel={handleDecCancelClick}
        onCreate={handleDecCreateClick}
      />

      <PrioritySuggestModal
        open={Boolean(priTask)}
        loading={priLoading}
        task={priTask}
        value={priValue}
        reason={priReason}
        onValueChange={handlePriValueChange}
        onCancel={handlePriorityModalCancel}
        onApply={handlePriApplyClick}
        onReject={handlePriRejectClick}
      />

      <WorkloadSummaryModal
        open={summaryOpen}
        loading={summaryLoading}
        text={summaryText}
        onCancel={handleSummaryModalCancel}
        onClose={handleSummaryCloseClick}
      />
    </div>
  );
}

export function TaskBoardPage() {
  return (
    <TasksBoardProvider>
      <TaskBoardPageContent />
    </TasksBoardProvider>
  );
}
