import { describe, it, expect } from 'vitest';
import { createNewTask, normaliseItem, pinUrgentFirst } from '../../utils/tasks/taskUtils';

describe('taskUtils', () => {
  describe('createNewTask', () => {
    it('should create a new task with correct structure', () => {
      const task = createNewTask('Watch FC2 Week 3 videos on KEATS');
      
      expect(task).toMatchObject({
        title: 'Watch FC2 Week 3 videos on KEATS',
        done: false,
        urgent: false,
        completedAt: null,
      });
      expect(task.id).toBeDefined();
    });

    it('should create task with empty title if not provided', () => {
      const task = createNewTask('');
      
      expect(task.title).toBe('');
      expect(task.done).toBe(false);
    });

    it('should generate unique id for each task', () => {
      const task1 = createNewTask('Task 1');
      const task2 = createNewTask('Task 2');
      
      expect(task1.id).not.toBe(task2.id);
    });
  });

  describe('normaliseItem', () => {
    it('should normalise valid task object', () => {
      const input = {
        id: 'test-123',
        title: 'Test task',
        done: true,
        urgent: false,
        completedAt: 1234567890,
      };
      
      const result = normaliseItem(input);
      expect(result).toEqual(input);
    });

    it('should add missing fields with defaults', () => {
      const input = { id: 'test-1', title: 'Test' };
      
      const result = normaliseItem(input);
      
      expect(result.done).toBe(false);
      expect(result.urgent).toBe(false);
      expect(result.completedAt).toBeNull();
    });

    it('should preserve existing id when provided', () => {
      const input = { id: 'existing-123' };
      
      const result = normaliseItem(input);
      
      expect(result.id).toBe('existing-123');
    });

    it('should generate new id when not provided', () => {
      const input = { title: 'No ID task' };
      
      const result = normaliseItem(input);
      
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
    });

    it('should preserve string title when provided', () => {
      const input = { title: 'My task title' };
      
      const result = normaliseItem(input);
      
      expect(result.title).toBe('My task title');
    });

    it('should use empty string for non-string title', () => {
      const input = { title: 123 };
      
      const result = normaliseItem(input);
      
      expect(result.title).toBe('');
    });

    it('should preserve completedAt timestamp when it is a number', () => {
      const timestamp = 1234567890;
      const input = { completedAt: timestamp };
      
      const result = normaliseItem(input);
      
      expect(result.completedAt).toBe(timestamp);
    });

    it('should use null for non-number completedAt', () => {
      const input = { completedAt: 'invalid' };
      
      const result = normaliseItem(input);
      
      expect(result.completedAt).toBeNull();
    });

    it('should handle all valid properties together', () => {
      const input = {
        id: 'test-id',
        title: 'Test title',
        done: true,
        urgent: true,
        completedAt: 999999,
      };
      
      const result = normaliseItem(input);
      
      expect(result).toEqual({
        id: 'test-id',
        title: 'Test title',
        done: true,
        urgent: true,
        completedAt: 999999,
      });
    });

    it('should convert truthy done to true', () => {
      const input = { done: 1 };
      
      const result = normaliseItem(input);
      
      expect(result.done).toBe(true);
    });

    it('should convert falsy done to false', () => {
      const input = { done: 0 };
      
      const result = normaliseItem(input);
      
      expect(result.done).toBe(false);
    });
  });

  describe('pinUrgentFirst', () => {
    it('should sort urgent tasks first', () => {
      const tasks = [
        { id: 1, urgent: false },
        { id: 2, urgent: true },
        { id: 3, urgent: false },
      ];
      
      const result = pinUrgentFirst(tasks);
      
      expect(result[0].id).toBe(2);
    });

    it('should maintain order within urgent tasks', () => {
      const tasks = [
        { id: 1, urgent: true },
        { id: 2, urgent: true },
        { id: 3, urgent: false },
      ];
      
      const result = pinUrgentFirst(tasks);
      
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(3);
    });

    it('should maintain order within non-urgent tasks', () => {
      const tasks = [
        { id: 1, urgent: false },
        { id: 2, urgent: false },
        { id: 3, urgent: false },
      ];
      
      const result = pinUrgentFirst(tasks);
      
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(3);
    });

    it('should handle empty array', () => {
      const result = pinUrgentFirst([]);
      
      expect(result).toEqual([]);
    });

    it('should handle all urgent tasks', () => {
      const tasks = [
        { id: 1, urgent: true },
        { id: 2, urgent: true },
      ];
      
      const result = pinUrgentFirst(tasks);
      
      expect(result).toHaveLength(2);
      expect(result[0].urgent).toBe(true);
      expect(result[1].urgent).toBe(true);
    });
  });
});