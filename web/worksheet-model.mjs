export function orderedProblemPairs(worksheet) {
  const answersByProblemId = new Map(worksheet.answers.map((answer) => [answer.problemId, answer]));
  return worksheet.exerciseGroups.flatMap((group) => group.problems.map((problem) => {
    const answer = answersByProblemId.get(problem.id);
    if (!answer) throw new Error(`Hiányzó megoldás: ${problem.id}`);
    return { problem, answer };
  }));
}

export function studentProblems(worksheet) {
  return worksheet.exerciseGroups.flatMap((group) => group.problems.map((problem) => ({
    groupTitle: group.title,
    id: problem.id,
    prompt: problem.prompt,
  })));
}

export function needsInlineMathSeparator(previousPart, nextPart) {
  if (!previousPart || !nextPart) return false;
  const previousValue = previousPart.value.trimEnd();
  const nextValue = nextPart.value.trimStart();
  return Boolean(previousValue && nextValue && !/\s$/.test(previousPart.value) && !/^[.,;:!?)}\]]/.test(nextValue));
}

// The worksheet page of a skill, opening a saved worksheet when its id is given.
export function worksheetPageUrl(skillId, worksheetId = null) {
  const query = new URLSearchParams({ skill: skillId });
  if (worksheetId) query.set("worksheet", worksheetId);
  return `worksheet.html?${query}`;
}
