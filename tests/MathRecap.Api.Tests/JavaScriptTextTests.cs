namespace MathRecap.Api.Tests;

public sealed class JavaScriptTextTests
{
    // The characters " x".trim() removes in JavaScript (ECMAScript WhiteSpace and LineTerminator).
    private static readonly int[] EcmaScriptWhiteSpace =
        [0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x20, 0xA0, 0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x2028, 0x2029, 0x202F, 0x205F, 0x3000, 0xFEFF];

    [Fact]
    public void WhiteSpaceIsEcmaScriptWhiteSpace()
    {
        var whiteSpace = Enumerable.Range(0, char.MaxValue + 1).Where(code => JavaScriptText.IsWhiteSpace((char)code));

        Assert.Equal(EcmaScriptWhiteSpace, whiteSpace);
    }

    [Theory]
    [InlineData(" \t\n a b  ﻿　", "a b")]
    [InlineData("\u0085a\u0085", "\u0085a\u0085")]
    [InlineData("   ", "")]
    [InlineData("", "")]
    public void TrimRemovesEcmaScriptWhiteSpaceAtBothEnds(string value, string expected) => Assert.Equal(expected, JavaScriptText.Trim(value));
}
