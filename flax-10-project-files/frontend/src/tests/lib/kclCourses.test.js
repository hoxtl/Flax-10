import { describe, it, expect } from 'vitest';
import { KCL_DEPARTMENTS, ALL_KCL_COURSES } from '../../lib/kclCourses';

describe('KCL_DEPARTMENTS', () => {
  it('is an object', () => {
    expect(typeof KCL_DEPARTMENTS).toBe('object');
    expect(KCL_DEPARTMENTS).not.toBeNull();
  });

  it('has the expected top-level department keys', () => {
    const keys = Object.keys(KCL_DEPARTMENTS);
    expect(keys).toContain('Arts & Humanities');
    expect(keys).toContain('Business');
    expect(keys).toContain('Law');
    expect(keys).toContain('Life Sciences & Medicine');
    expect(keys).toContain('Natural, Mathematical & Engineering Sciences');
    expect(keys).toContain('Nursing, Midwifery & Palliative Care');
    expect(keys).toContain('Psychiatry, Psychology & Neuroscience');
    expect(keys).toContain('Social Science & Public Policy');
    expect(keys).toContain('Dentistry, Oral & Craniofacial Sciences');
  });

  it('has 9 departments', () => {
    expect(Object.keys(KCL_DEPARTMENTS).length).toBe(9);
  });

  it('each department value is a non-empty array', () => {
    for (const [dept, courses] of Object.entries(KCL_DEPARTMENTS)) {
      expect(Array.isArray(courses), `${dept} should be an array`).toBe(true);
      expect(courses.length, `${dept} should have at least one course`).toBeGreaterThan(0);
    }
  });

  it('each course within a department is a non-empty string', () => {
    for (const [dept, courses] of Object.entries(KCL_DEPARTMENTS)) {
      for (const course of courses) {
        expect(typeof course, `Course in ${dept} should be a string`).toBe('string');
        expect(course.length, `Course in ${dept} should not be empty`).toBeGreaterThan(0);
      }
    }
  });

  it('Arts & Humanities includes English Literature', () => {
    expect(KCL_DEPARTMENTS['Arts & Humanities']).toContain('English Literature');
  });

  it('Arts & Humanities includes History', () => {
    expect(KCL_DEPARTMENTS['Arts & Humanities']).toContain('History');
  });

  it('Arts & Humanities includes Philosophy', () => {
    expect(KCL_DEPARTMENTS['Arts & Humanities']).toContain('Philosophy');
  });

  it('Business includes Economics', () => {
    expect(KCL_DEPARTMENTS['Business']).toContain('Economics');
  });

  it('Business includes Accounting & Finance', () => {
    expect(KCL_DEPARTMENTS['Business']).toContain('Accounting & Finance');
  });

  it('Law department contains Law', () => {
    expect(KCL_DEPARTMENTS['Law']).toContain('Law');
    expect(KCL_DEPARTMENTS['Law'].length).toBe(1);
  });

  it('Natural, Mathematical & Engineering Sciences includes Computer Science', () => {
    expect(KCL_DEPARTMENTS['Natural, Mathematical & Engineering Sciences']).toContain('Computer Science');
  });

  it('Natural, Mathematical & Engineering Sciences includes Artificial Intelligence', () => {
    expect(KCL_DEPARTMENTS['Natural, Mathematical & Engineering Sciences']).toContain('Artificial Intelligence');
  });

  it('Natural, Mathematical & Engineering Sciences includes Mathematics', () => {
    expect(KCL_DEPARTMENTS['Natural, Mathematical & Engineering Sciences']).toContain('Mathematics');
  });

  it('Life Sciences & Medicine includes Medicine', () => {
    expect(KCL_DEPARTMENTS['Life Sciences & Medicine']).toContain('Medicine');
  });

  it('Life Sciences & Medicine includes Biomedical Science', () => {
    expect(KCL_DEPARTMENTS['Life Sciences & Medicine']).toContain('Biomedical Science');
  });

  it('Nursing, Midwifery & Palliative Care includes Nursing and Midwifery', () => {
    expect(KCL_DEPARTMENTS['Nursing, Midwifery & Palliative Care']).toContain('Nursing');
    expect(KCL_DEPARTMENTS['Nursing, Midwifery & Palliative Care']).toContain('Midwifery');
  });

  it('Psychiatry, Psychology & Neuroscience includes Psychology', () => {
    expect(KCL_DEPARTMENTS['Psychiatry, Psychology & Neuroscience']).toContain('Psychology');
  });

  it('Social Science & Public Policy includes Politics', () => {
    expect(KCL_DEPARTMENTS['Social Science & Public Policy']).toContain('Politics');
  });

  it('Social Science & Public Policy includes International Relations', () => {
    expect(KCL_DEPARTMENTS['Social Science & Public Policy']).toContain('International Relations');
  });

  it('Dentistry, Oral & Craniofacial Sciences includes Dentistry', () => {
    expect(KCL_DEPARTMENTS['Dentistry, Oral & Craniofacial Sciences']).toContain('Dentistry');
  });
});

describe('ALL_KCL_COURSES', () => {
  it('is an array', () => {
    expect(Array.isArray(ALL_KCL_COURSES)).toBe(true);
  });

  it('is non-empty', () => {
    expect(ALL_KCL_COURSES.length).toBeGreaterThan(0);
  });

  it('contains the correct total number of courses (flat of all departments)', () => {
    const expectedTotal = Object.values(KCL_DEPARTMENTS).reduce((sum, courses) => sum + courses.length, 0);
    expect(ALL_KCL_COURSES.length).toBe(expectedTotal);
  });

  it('contains all courses from every department', () => {
    for (const courses of Object.values(KCL_DEPARTMENTS)) {
      for (const course of courses) {
        expect(ALL_KCL_COURSES).toContain(course);
      }
    }
  });

  it('contains Computer Science', () => {
    expect(ALL_KCL_COURSES).toContain('Computer Science');
  });

  it('contains Medicine', () => {
    expect(ALL_KCL_COURSES).toContain('Medicine');
  });

  it('contains Law', () => {
    expect(ALL_KCL_COURSES).toContain('Law');
  });

  it('contains Psychology', () => {
    expect(ALL_KCL_COURSES).toContain('Psychology');
  });

  it('all items are non-empty strings', () => {
    for (const course of ALL_KCL_COURSES) {
      expect(typeof course).toBe('string');
      expect(course.length).toBeGreaterThan(0);
    }
  });

  it('Economics appears multiple times (present in multiple departments)', () => {
    const count = ALL_KCL_COURSES.filter(c => c === 'Economics').length;
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
