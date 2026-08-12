import { z } from "zod";

const modelId = z.string().trim().min(1).max(200).regex(/^[~A-Za-z0-9._:/-]+$/);
const shortText = (maximum) => z.string().trim().min(1).max(maximum);
const optionalProfileText = z.string().trim().max(500).optional().default("");
const skillId = z.string().trim().regex(/^[A-Z]{3}-\d{2}$/);

export const profileSchema = z.object({
  interests: optionalProfileText,
  background: optionalProfileText,
  goal: optionalProfileText,
}).strict();

export const modelIdSchema = modelId;

export const modelCatalogSchema = z.array(z.object({
  id: modelId,
  name: shortText(300),
  contextLength: z.number().int().positive().optional(),
}).strict()).max(10_000);

const skillContextSchema = z.object({
  id: skillId,
  name: shortText(240),
  description: shortText(2_000),
  prerequisites: z.array(skillId).max(30).default([]),
  relatedSkillIds: z.array(skillId).max(60).default([]),
}).strict();

export const usefulnessRequestSchema = z.object({
  modelId,
  profile: profileSchema,
  skill: skillContextSchema,
}).strict();

export const usefulnessResponseSchema = z.object({
  text: shortText(1_200),
}).strict();

const contentPartSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), value: shortText(4_000) }).strict(),
  z.object({ type: z.literal("inlineMath"), value: shortText(1_000) }).strict(),
  z.object({ type: z.literal("displayMath"), value: shortText(2_000) }).strict(),
]);
const contentSchema = z.array(contentPartSchema).min(1).max(40);

const problemSchema = z.object({
  id: z.string().trim().min(1).max(80).regex(/^[A-Za-z0-9_-]+$/),
  prompt: contentSchema,
}).strict();

const answerSchema = z.object({
  problemId: z.string().trim().min(1).max(80).regex(/^[A-Za-z0-9_-]+$/),
  answer: contentSchema,
  reasoning: contentSchema,
}).strict();

export const worksheetRequestSchema = z.object({
  modelId,
  profile: profileSchema,
  request: shortText(2_000),
  skill: skillContextSchema,
}).strict();

export const worksheetResponseSchema = z.object({
  title: shortText(240),
  explanation: contentSchema,
  assumedPrerequisites: z.array(shortText(240)).max(30),
  workedExamples: z.array(z.object({
    title: shortText(240),
    steps: contentSchema,
  }).strict()).min(1).max(2),
  whyThisMatters: contentSchema,
  exerciseGroups: z.array(z.object({
    title: shortText(240),
    problems: z.array(problemSchema).min(1).max(40),
  }).strict()).min(1).max(12),
  canChecklist: z.array(shortText(240)).min(1).max(20),
  answers: z.array(answerSchema).min(1).max(200),
  diagnosticNotes: z.array(z.object({
    skillId,
    note: shortText(1_000),
  }).strict()).max(100),
  suggestedNextSteps: z.array(shortText(500)).min(1).max(20),
}).strict().superRefine((worksheet, context) => {
  const problems = worksheet.exerciseGroups.flatMap((group) => group.problems);
  const problemIds = new Set();
  for (const problem of problems) {
    if (problemIds.has(problem.id)) {
      context.addIssue({ code: "custom", path: ["exerciseGroups"], message: `Duplicate problem ID: ${problem.id}` });
    }
    problemIds.add(problem.id);
  }

  const answerIds = new Set();
  for (const answer of worksheet.answers) {
    if (answerIds.has(answer.problemId)) {
      context.addIssue({ code: "custom", path: ["answers"], message: `Duplicate answer for problem ID: ${answer.problemId}` });
    }
    answerIds.add(answer.problemId);
    if (!problemIds.has(answer.problemId)) {
      context.addIssue({ code: "custom", path: ["answers"], message: `Orphan answer for problem ID: ${answer.problemId}` });
    }
  }
  for (const problemId of problemIds) {
    if (!answerIds.has(problemId)) {
      context.addIssue({ code: "custom", path: ["answers"], message: `Missing answer for problem ID: ${problemId}` });
    }
  }
});

export function parseWorksheetResponse(payload, validSkillIds) {
  const worksheet = worksheetResponseSchema.parse(payload);
  if (validSkillIds) {
    for (const diagnostic of worksheet.diagnosticNotes) {
      if (!validSkillIds.has(diagnostic.skillId)) {
        throw new z.ZodError([{ code: "custom", path: ["diagnosticNotes"], message: `Unknown diagnostic skill ID: ${diagnostic.skillId}` }]);
      }
    }
  }
  return worksheet;
}