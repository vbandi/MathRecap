using System.Text.Json;
using System.Text.Json.Nodes;

namespace MathRecap.Api.Ai;

// Generates worksheets and "why it is useful for you" texts with the model, and accepts only output
// that passes validation.
public sealed class ContentGenerator(OpenRouterClient openRouter, Prompts prompts, Curriculum curriculum, ILogger<ContentGenerator> logger)
{
    private const int MaxReportedIssues = 12;

    // The text of the "why it is useful for you" answer.
    public async Task<string> GenerateUsefulnessAsync(Profile profile, Skill skill, CancellationToken cancellationToken)
    {
        var usefulness = await CompleteAsync(ModelOutput.Usefulness, "usefulness", prompts.Usefulness(profile, skill), cancellationToken);
        if (ModelOutput.Usefulness.Validate(usefulness).Count > 0)
        {
            throw new ApiException(StatusCodes.Status502BadGateway, "invalid_upstream_response", "Az OpenRouter indoklása érvénytelen volt.");
        }
        return usefulness!["text"]!.GetValue<string>();
    }

    // An invalid first answer gets one correction attempt that lists what was wrong with it.
    public async Task<JsonNode> GenerateWorksheetAsync(Profile profile, WorksheetRequest request, CancellationToken cancellationToken)
    {
        var diagnosticSkillIds = curriculum.NeighborhoodOf(request.Skill);
        var worksheet = await CompleteAsync(ModelOutput.Worksheet, "worksheet", prompts.Worksheet(profile, request.Request, request.Skill), cancellationToken);
        var issues = ModelOutput.ValidateWorksheet(worksheet, diagnosticSkillIds);
        if (issues.Count == 0) return worksheet!;

        // Only the count is logged: issue messages may quote model output, which can echo the learner's
        // profile or request.
        logger.LogInformation("The worksheet failed validation with {IssueCount} issues; asking for a correction.", issues.Count);
        var correctionMessages = prompts.WorksheetCorrection(profile, request.Request, request.Skill, worksheet, [.. issues.Take(MaxReportedIssues)]);
        var corrected = await CompleteAsync(ModelOutput.Worksheet, "worksheet", correctionMessages, cancellationToken);
        var remainingIssues = ModelOutput.ValidateWorksheet(corrected, diagnosticSkillIds);
        if (remainingIssues.Count == 0) return corrected!;

        logger.LogWarning("The corrected worksheet failed validation too, with {IssueCount} issues.", remainingIssues.Count);
        throw new ApiException(StatusCodes.Status502BadGateway, "invalid_upstream_response", "Az OpenRouter feladatlapja hiányos vagy érvénytelen volt.");
    }

    private async Task<JsonNode?> CompleteAsync(JsonContract format, string formatName, IReadOnlyList<ChatMessage> messages, CancellationToken cancellationToken)
    {
        var content = await openRouter.CompleteAsync(formatName, format.SchemaText, messages, cancellationToken);
        try
        {
            return format.Parse(content);
        }
        catch (JsonException)
        {
            throw new ApiException(StatusCodes.Status502BadGateway, "invalid_upstream_response", "Az OpenRouter nem érvényes JSON-t adott vissza.");
        }
    }
}
