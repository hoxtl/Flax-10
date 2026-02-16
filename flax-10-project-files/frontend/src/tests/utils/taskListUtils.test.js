import { describe, it, expect } from 'vitest';
import { partitionTasks } from '../../utils/tasks/taskListUtils';

describe('taskListUtils', () => {
  describe('partitionTasks', () => {
    it('should separate active and done tasks', () => {
      const tasks = [
        { id: '1', done: false, urgent: false, title: 'Active 1' },
        { id: '2', done: true, urgent: false, title: 'Done 1' },
        { id: '3', done: false, urgent: false, title: 'Active 2' },
        { id: '4', done: true, urgent: false, title: 'Done 2' },
      ];
      const result = partitionTasks(tasks);
      expect(result.activeRaw).toHaveLength(2);
      expect(result.doneItems).toHaveLength(2);
      expect(result.anyCompleted).toBe(true);
    });

    it('should return isEmpty true for empty input', () => {
      const result = partitionTasks([]);
      expect(result.isEmpty).toBe(true);
      expect(result.activeRaw).toEqual([]);
      expect(result.doneItems).toEqual([]);
    });

    it('should return isEmpty false when tasks exist', () => {
      const tasks = [{ id: '1', done: false, urgent: false }];
      const result = partitionTasks(tasks);
      expect(result.isEmpty).toBe(false);
    });

    it('should pin urgent tasks first in activePinned', () => {
      const tasks = [
        { id: '1', done: false, urgent: false },
        { id: '2', done: false, urgent: true },
        { id: '3', done: false, urgent: false },
      ];
      const result = partitionTasks(tasks);
      expect(result.activePinned[0].id).toBe('2');
      expect(result.urgentActive).toHaveLength(1);
      expect(result.otherActive).toHaveLength(2);
    });

    it('should set anyCompleted to false when no done tasks', () => {
      const tasks = [
        { id: '1', done: false, urgent: false },
        { id: '2', done: false, urgent: false },
      ];
      const result = partitionTasks(tasks);
      expect(result.anyCompleted).toBe(false);
      expect(result.doneItems).toHaveLength(0);
    });

    it('should handle all done tasks', () => {
      const tasks = [
        { id: '1', done: true, urgent: false },
        { id: '2', done: true, urgent: false },
      ];
      const result = partitionTasks(tasks);
      expect(result.activeRaw).toHaveLength(0);
      expect(result.doneItems).toHaveLength(2);
      expect(result.isEmpty).toBe(false);
    });

    it('should separate urgent and non-urgent active tasks', () => {
      const tasks = [
        { id: '1', done: false, urgent: true },
        { id: '2', done: false, urgent: true },
        { id: '3', done: false, urgent: false },
      ];
      const result = partitionTasks(tasks);
      expect(result.urgentActive).toHaveLength(2);
      expect(result.otherActive).toHaveLength(1);
    });
  });
});