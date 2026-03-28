import { describe, expect, it } from "vitest";

import { getDisplayName } from "../../../../pages/group_work/utils/memberAvatarUtils";
import {
  compareProjectsBySort,
  getProjectCaption,
} from "../../../../pages/group_work/utils/projectRowUtils";
import { getCollaboratorCount } from "../../../../pages/group_work/utils/projectStatsUtils";
import { calcCompletionSegments } from "../../../../pages/group_work/utils/taskStatsUtils";

describe("group work utility coverage gaps", () => {
  it("falls back cleanly when members only have usernames and ignores numeric display-name noise", () => {
    expect(getDisplayName({ user_name: "study-buddy" })).toBe("study-buddy");
    expect(
      getDisplayName({
        first_name: "Alice",
        last_name: "Brown",
        name: "1234",
      }),
    ).toBe("Alice Brown");
  });

  it("uses the provided module name in generated project captions", () => {
    expect(
      getProjectCaption({
        name: "Poster Presentation",
        module_name: "Biology 101",
      }),
    ).toContain("Biology 101");
    expect(
      getProjectCaption({
        name: "Poster Presentation",
      }),
    ).toContain("the module");
  });

  it("uses due-date sort tie-breakers for completion first and names last", () => {
    const lessComplete = {
      name: "Beta",
      deadline: "2026-06-01",
      task_count: 10,
      completed_task_count: 1,
    };
    const moreComplete = {
      name: "Alpha",
      deadline: "2026-06-01",
      task_count: 10,
      completed_task_count: 8,
    };
    const sameCompletionA = {
      name: "Match",
      deadline: "2026-06-01",
      task_count: 10,
      completed_task_count: 5,
    };
    const sameCompletionB = {
      name: "Match",
      deadline: "2026-06-01",
      task_count: 10,
      completed_task_count: 5,
    };

    expect(compareProjectsBySort(lessComplete, moreComplete, "due-date-desc")).toBeGreaterThan(0);
    expect(compareProjectsBySort(sameCompletionA, sameCompletionB, "due-date-desc")).toBe(0);
  });

  it("counts a project with no explicit collaborators as a single default collaborator", () => {
    expect(getCollaboratorCount([{}])).toBe(1);
  });

  it("uses singular tooltip text for a single unassigned completed task", () => {
    const result = calcCompletionSegments(
      [{ completed: true, assignees_info: [] }],
      [],
    );

    expect(result.segments).toEqual([
      expect.objectContaining({
        id: "unassigned",
        tooltip: "Unassigned: 1 task completed",
      }),
    ]);
  });
});
