import { describe, it, expect } from 'vitest';
import { partitionTasks, generateId } from '../../utils/tasks/taskListUtils';

describe('taskListUtils', () => {
  describe('partitionTasks', () => {
    it('should separate active and completed tasks', () => {
      const tasks = [
        { id: 1, done: false, title: 'Active 1' },
        { id: 2, done: true, title: 'Done 1' },
        { id: 3, done: false, title: 'Active 2' },
        { id: 4, done: true, title: 'Done 2' },
      ];
      
      const { active, completed } = partitionTasks(tasks);
      
      expect(active).toHaveLength(2);
      expect(completed).toHaveLength(2);
      expect(active[0].title).toBe('Active 1');
      expect(completed[0].title).toBe('Done 1');
    });

    it('should return empty arrays for empty input', () => {
      const { active, completed } = partitionTasks([]);
      
      expect(active).toEqual([]);
      expect(completed).toEqual([]);
    });

    it('should handle all active tasks', () => {
      const tasks = [
        { id: 1, done: false },
        { id: 2, done: false },
      ];
      
      const { active, completed } = partitionTasks(tasks);
      
      expect(active).toHaveLength(2);
      expect(completed).toHaveLength(0);
    });

    it('should handle all completed tasks', () => {
      const tasks = [
        { id: 1, done: true },
        { id: 2, done: true },
      ];
      
      const { active, completed } = partitionTasks(tasks);
      
      expect(active).toHaveLength(0);
      expect(completed).toHaveLength(2);
    });
  });

  describe('generateId', () => {
    it('should return 1 for empty array', () => {
      expect(generateId([])).toBe(1);
    });

    it('should return max id + 1', () => {
      const tasks = [
        { id: 1 },
        { id: 5 },
        { id: 3 },
      ];
      
      expect(generateId(tasks)).toBe(6);
    });

    it('should handle single task', () => {
      const tasks = [{ id: 10 }];
      
      expect(generateId(tasks)).toBe(11);
    });

    it('should handle string ids by converting to numbers', () => {
      const tasks = [
        { id: '1' },
        { id: '5' },
      ];
      
      expect(generateId(tasks)).toBe(6);
    });
  });
});