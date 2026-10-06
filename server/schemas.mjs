import { z } from "zod";
import { findSkill } from "../poc/curriculum.mjs";
import { isValidExpression, MAX_EXPRESSION_LENGTH } from "../poc/figure-model.mjs";

// The response schemas are the single definition of the model output format: they validate the
// output, and their JSON Schema (descriptions included) is what the model is asked to follow.
// Descriptions are prompt text, so they are in Hungarian.

const modelId = z.string().trim().min(1).max(200).regex(/^[~A-Za-z0-9._:/-]+$/);
const shortText = (maximum) => z.string().trim().min(1).max(maximum);
const optionalProfileText = z.string().trim().max(500).optional().default("");
const skillId = z.string().trim().regex(/^[A-Z]{3}-\d{2}$/);
const knownSkillId = skillId.refine((id) => findSkill(id) !== null, "Unknown skill ID");

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

export const usefulnessRequestSchema = z.object({
  modelId,
  profile: profileSchema,
  skillId: knownSkillId,
}).strict();

export const usefulnessResponseSchema = z.object({
  text: shortText(1_200).describe("2-4 mondat."),
}).strict();

const coordinate = z.number().min(-1e6).max(1e6);
const point = z.tuple([coordinate, coordinate]).meta({ id: "point", description: "[x, y]" });
const range = z.tuple([coordinate, coordinate]).refine(([min, max]) => max > min, "Range minimum must be below maximum")
  .meta({ id: "range", description: "[min, max], ahol min < max." });
const label = shortText(40).meta({ id: "label", description: "Rövid sima szöveg, nem LaTeX, pl. \"A\", \"α\", \"60°\", \"5 cm\"." });
const optionalLabel = label.optional();
const dashed = z.boolean().optional().describe("Szaggatott vonal.");

const planeElementSchema = z.discriminatedUnion("shape", [
  z.object({ shape: z.literal("point"), at: point, label: optionalLabel, open: z.boolean().optional().describe("Üres karika.") }).strict(),
  z.object({ shape: z.literal("segment"), from: point, to: point, label: optionalLabel, dashed, ticks: z.number().int().min(0).max(3).optional().describe("Egyenlő hosszúságot jelölő vonalkák száma.") }).strict(),
  z.object({ shape: z.literal("line"), through: z.tuple([point, point]).describe("Két különböző pont az egyenesen."), label: optionalLabel, dashed }).strict()
    .refine(({ through: [first, second] }) => first[0] !== second[0] || first[1] !== second[1], "Line points must differ"),
  z.object({ shape: z.literal("vector"), from: point, to: point, label: optionalLabel }).strict(),
  z.object({ shape: z.literal("polygon"), points: z.array(point).min(3).max(20), label: optionalLabel, filled: z.boolean().optional().describe("Halvány kitöltés.") }).strict(),
  z.object({ shape: z.literal("circle"), center: point, radius: z.number().positive().max(1e6), label: optionalLabel, dashed }).strict(),
  z.object({
    shape: z.literal("angle"), vertex: point, from: point.describe("Pont az egyik száron."), to: point.describe("Pont a másik száron."),
    label: optionalLabel, right: z.boolean().optional().describe("Derékszög jelölése."),
  }).strict(),
  z.object({
    shape: z.literal("function"),
    expression: z.string().trim().min(1).max(MAX_EXPRESSION_LENGTH).refine(isValidExpression, "Unsupported expression")
      .describe("x változós kifejezés, pl. \"0.5*x^2 - 2\" vagy \"sin(x)\". Csak x, számok, + - * / ^, zárójel, pi, e és sin, cos, tan, sqrt, abs, ln, log, exp szerepelhet."),
    domain: range.optional().describe("Az ábrázolt x-tartomány; elhagyva a teljes xRange."), label: optionalLabel, dashed,
  }).strict(),
  z.object({ shape: z.literal("polyline"), points: z.array(point).min(2).max(200), label: optionalLabel, dashed, markers: z.boolean().optional().describe("Jelölők a töréspontokon.") }).strict(),
  z.object({ shape: z.literal("text"), at: point, value: label }).strict(),
]).meta({ id: "planeElement" });

const figureSize = z.enum(["small", "medium", "large"]).optional().describe("Az ábra szélessége; alapértelmezés: medium.");
const chartValue = z.number().min(-1e9).max(1e9);

const figureSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("plane"), size: figureSize, xRange: range, yRange: range,
    axes: z.boolean().optional(), grid: z.boolean().optional(),
    equalScale: z.boolean().optional().describe("false csak adatgrafikonhoz, ahol a két tengely más mennyiséget mér; egyébként a két tengely egysége azonos."),
    xLabel: optionalLabel, yLabel: optionalLabel,
    elements: z.array(planeElementSchema).min(1).max(60),
  }).strict().describe("Geometriai ábra vagy koordináta-rendszer. Tengelyek nélküli ábránál a tartomány hagyjon kis margót az alakzat körül."),
  z.object({
    kind: z.literal("barChart"), size: figureSize, categories: z.array(label).min(1).max(24),
    series: z.array(z.object({ name: optionalLabel, values: z.array(chartValue).min(1).max(24).describe("Kategóriánként egy érték, a categories sorrendjében.") }).strict()).min(1).max(4),
    xLabel: optionalLabel, yLabel: optionalLabel, showValues: z.boolean().optional(),
  }).strict().refine(({ categories, series }) => series.every(({ values }) => values.length === categories.length), "Every series needs one value per category")
    .describe("Oszlopdiagram."),
  z.object({
    kind: z.literal("pieChart"), size: figureSize,
    slices: z.array(z.object({ label, value: z.number().positive().max(1e9) }).strict()).min(2).max(12),
    showPercent: z.boolean().optional(),
  }).strict().describe("Kördiagram."),
  z.object({
    kind: z.literal("numberLine"), size: figureSize, range, tickStep: z.number().positive().max(1e6).optional().describe("A beosztás lépésköze; legfeljebb 60 beosztás."),
    points: z.array(z.object({ at: coordinate, label: optionalLabel, open: z.boolean().optional().describe("Üres karika.") }).strict()).max(20).default([]),
    intervals: z.array(z.object({
      from: coordinate.nullable().describe("null: −∞"), to: coordinate.nullable().describe("null: +∞"),
      fromClosed: z.boolean().optional(), toClosed: z.boolean().optional(),
    }).strict().refine(({ from, to }) => from === null || to === null || from < to, "Interval start must be below its end")).max(6).default([]),
  }).strict().refine(({ range: [min, max], tickStep }) => !tickStep || (max - min) / tickStep <= 60, "Too many ticks").describe("Számegyenes."),
]).meta({ id: "figure" });

const contentPartSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), value: shortText(4_000) }).strict(),
  z.object({ type: z.literal("inlineMath"), value: shortText(1_000).describe("KaTeX-kompatibilis LaTeX, $ jelek nélkül.") }).strict(),
  z.object({ type: z.literal("displayMath"), value: shortText(2_000).describe("Külön sorba kiemelt KaTeX-kompatibilis LaTeX, $ jelek nélkül.") }).strict(),
  z.object({ type: z.literal("figure"), figure: figureSchema, caption: shortText(300).optional() }).strict(),
]);
const contentSchema = z.array(contentPartSchema).min(1).max(40)
  .meta({ id: "content", description: "Tartalmi részek sorban: szöveg, képlet vagy ábra." });

const problemId = z.string().trim().min(1).max(80).regex(/^[A-Za-z0-9_-]+$/);

const problemSchema = z.object({
  id: problemId.describe("Egyedi azonosító, pl. \"p1\"."),
  prompt: contentSchema,
}).strict();

const answerSchema = z.object({
  problemId,
  answer: contentSchema,
  reasoning: contentSchema,
}).strict();

export const worksheetRequestSchema = z.object({
  modelId,
  profile: profileSchema,
  request: shortText(2_000),
  skillId: knownSkillId,
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
  answers: z.array(answerSchema).min(1).max(200).describe("Minden feladathoz pontosan egy válasz, a feladat azonosítójával."),
  diagnosticNotes: z.array(z.object({
    skillId: skillId.describe("A megadott készségazonosítók egyike."),
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

// Input mode, so fields with defaults are optional for the model; refinements are not representable
// and stay server-side checks. Tuples get explicit lengths, which prefixItems alone does not imply.
function modelJsonSchema(schema) {
  const { $schema, ...jsonSchema } = z.toJSONSchema(schema, {
    io: "input",
    override: ({ jsonSchema: node }) => {
      if (node.prefixItems) Object.assign(node, { minItems: node.prefixItems.length, maxItems: node.prefixItems.length });
    },
  });
  return jsonSchema;
}

export const worksheetJsonSchema = modelJsonSchema(worksheetResponseSchema);
export const usefulnessJsonSchema = modelJsonSchema(usefulnessResponseSchema);

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
