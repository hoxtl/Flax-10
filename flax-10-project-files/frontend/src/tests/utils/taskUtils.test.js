import { describe, it, expect } from 'vitest';
import { createNewTask, normaliseItem, pinUrgentFirst } from '../../utils/tasks/taskUtils';

describe('taskUtils', () => {
  describe('createNewTask', () => {
    it('should create a new task with correct structure', () => {
      const task = createNewTask('Watch FC2 Week 3 on KEATS', 1);
      
      expect(task).toMatchObject({
        id: 1,
        text: 'Watch FC2 Week 3 on KEATS',
        completed: false,
        urgent: false,
      });
      expect(task.timestamp).toBeDefined();
    });

    it('should create task with empty text if not provided', () => {
      const task = createNewTask('', 5);
      
      expect(task.text).toBe('');
      expect(task.id).toBe(5);
    });
  });

  describe('normaliseItem', () => {
    it('should normalise valid task object', () => {
      const input = {
        id: 1,
        text: 'Test task',
        completed: true,
        urgent: false,
        timestamp: Date.now(),
      };
      
      const result = normaliseItem(input);
      expect(result).toEqual(input);
    });

    it('should add missing fields with defaults', () => {
      const input = { id: 1, text: 'Test' };
      
      const result = normaliseItem(input);
      
      expect(result.completed).toBe(false);
      expect(result.urgent).toBe(false);
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('pinUrgentFirst', () => {
    it('should sort urgent tasks first', () => {
      const tasks = [
        { id: 1, urgent: false, timestamp: 100 },
        { id: 2, urgent: true, timestamp: 200 },
        { id: 3, urgent: false, timestamp: 50 },
      ];
      
      const result = pinUrgentFirst(tasks);
      
      expect(result[0].id).toBe(2); // urgent task first
    });

    it('should maintain timestamp order within same urgency', () => {
      const tasks = [
        { id: 1, urgent: false, timestamp: 300 },
        { id: 2, urgent: false, timestamp: 100 },
        { id: 3, urgent: false, timestamp: 200 },
      ];
      
      const result = pinUrgentFirst(tasks);
      
      expect(result[0].id).toBe(2); // oldest first
      expect(result[1].id).toBe(3);
      expect(result[2].id).toBe(1);
    });
  });
});