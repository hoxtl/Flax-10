import { describe, it, expect } from 'vitest';
import { partitionTasks, generateId } from '../../utils/tasks/taskListUtils';

describe('taskListUtils', () => {
  describe('partitionTasks', () => {
    it('should separate active and completed tasks', () => {
      const tasks = [
        { id: 1, completed: false, text: 'Active 1' },
        { id: 2, completed: true, text: 'Done 1' },
        { id: 3, completed: false, text: 'Active 2' },
        { id: 4, completed: true, text: 'Done 2' },
      ];
      
      const { active, completed } = partitionTasks(tasks);
      
      expect(active).toHaveLength(2);
      expect(completed).toHaveLength(2);
      expect(active[0].text).toBe('Active 1');
      expect(completed[0].text).toBe('Done 1');
    });

    it('should return empty arrays for empty input', () => {
      const { active, completed } = partitionTasks([]);
      
      expect(active).toEqual([]);
      expect(completed).toEqual([]);
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
  });
});