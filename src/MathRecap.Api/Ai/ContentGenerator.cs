using System.Text.Json;
using System.Text.Json.Nodes;

namespace MathRecap.Api.Ai;

// Generates worksheets and "why it is useful for you" texts with the model, and accepts only output
// that passes validation.
public sealed class ContentGenerator(OpenRouterClient openRouter, Prompts prompts, Curriculum curriculum, ILogger<ContentGenerator> logger)
{
    private const int MaxReportedIssues = 12;

    public async Task<JsonNode> GenerateUsefulnessAsync(UsefulnessRequest request, CancellationToken cancellationToken)
    {
        var usefulness = await CompleteAsync(ModelOutput.Usefulness, "usefulness", prompts.Usefulness(request.Profile, request.Skill), cancellationToken);
        if (ModelOutput.Usefulness.Validate(usefulness).Count > 0)
        {
            throw new ApiException(StatusCodes.Status502BadGateway, "invalid_upstream_response", "Az OpenRouter indoklása érvénytelen volt.");
        }
        return usefulness!;
    }

    // An invalid first answer gets one correction attempt that lists what was wrong with it.
    public async Task<JsonNode> GenerateWorksheetAsync(WorksheetRequest request, CancellationToken cancellationToken)
    {
        var diagnosticSkillIds = curriculum.NeighborhoodOf(request.Skill);
        var worksheet = await CompleteAsync(ModelOutput.Worksheet, "worksheet", prompts.Worksheet(request.Profile, request.Request, request.Skill), cancellationToken);
        var issues = ModelOutput.ValidateWorksheet(worksheet, diagnosticSkillIds);
        if (issues.Count == 0) return worksheet!;

        // Issue messages may quote model output, so they are logged at Debug level only.
        logger.LogInformation("The worksheet failed validation with {IssueCount} issues; asking for a correction.", issues.Count);
        logger.LogDebug("Worksheet validation issues: {Issues}", issues);
        var correctionMessages = prompts.WorksheetCorrection(request.Profile, request.Request, request.Skill, worksheet, [.. issues.Take(MaxReportedIssues)]);
        var corrected = await CompleteAsync(ModelOutput.Worksheet, "worksheet", correctionMessages, cancellationToken);
        var remainingIssues = ModelOutput.ValidateWorksheet(corrected, diagnosticSkillIds);
        if (remainingIssues.Count == 0) return corrected!;

        logger.LogWarning("The corrected worksheet failed validation too, with {IssueCount} issues.", remainingIssues.Count);
        logger.LogDebug("Corrected worksheet validation issues: {Issues}", remainingIssues);
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
