using MathRecap.Api.Ai;
using MathRecap.Api.Tests.TestHost;

namespace MathRecap.Api.Tests;

// The cases of tests/fixtures/figure-expressions.json, shared with the browser's expression parser. The
// sampled values are checked by the JS tests; the server only decides validity.
public sealed class FunctionExpressionTests
{
    private const string Cases = "figure-expressions.json";

    public static TheoryData<string> ValidExpressions => [.. Fixtures.Load(Cases)["valid"]!.AsArray().Select(entry => (string)entry!["expression"]!)];

    public static TheoryData<string> InvalidExpressions => [.. Fixtures.Load(Cases)["invalid"]!.AsArray().Select(entry => (string)entry!["expression"]!)];

    [Theory]
    [MemberData(nameof(ValidExpressions))]
    public void SupportedExpressionsAreValid(string expression) => Assert.True(FunctionExpression.IsValid(expression));

    [Theory]
    [MemberData(nameof(InvalidExpressions))]
    public void UnsupportedExpressionsAreInvalid(string expression) => Assert.False(FunctionExpression.IsValid(expression));
}
