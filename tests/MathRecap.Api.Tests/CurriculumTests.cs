using MathRecap.Api.Tests.TestHost;

namespace MathRecap.Api.Tests;

public sealed class CurriculumTests
{
    private static readonly Curriculum Curriculum = TestCurriculum.Load();

    [Fact]
    public void SkillsAreFoundById()
    {
        var skill = Curriculum.Find("ALG-08");

        Assert.NotNull(skill);
        Assert.Equal("Betűs kifejezés, változó, együttható, helyettesítési érték", skill.Name);
        Assert.Equal(["SZA-05"], skill.Prerequisites);
        Assert.Null(Curriculum.Find("GEO-99"));
        Assert.Null(Curriculum.Find("alg-08"));
    }

    [Fact]
    public void DependentsAreTheSkillsThatListTheSkillAsPrerequisiteInCurriculumOrder()
    {
        Assert.Equal(["ALG-09", "ALG-12"], Curriculum.DependentsOf("ALG-08"));
        Assert.Empty(Curriculum.DependentsOf("GEO-99"));
    }

    [Fact]
    public void NeighborhoodIsTheSkillWithItsPrerequisitesAndDependents()
    {
        var skill = Curriculum.Find("ALG-08")!;

        Assert.Equal(new HashSet<string> { "ALG-08", "SZA-05", "ALG-09", "ALG-12" }, Curriculum.NeighborhoodOf(skill));
    }

    [Fact]
    public void DependentsAreDerivedFromPrerequisites()
    {
        var curriculum = new Curriculum([
            new Skill("A", "A", "", []),
            new Skill("B", "B", "", ["A"]),
            new Skill("C", "C", "", ["A", "B"]),
        ]);

        Assert.Equal(["B", "C"], curriculum.DependentsOf("A"));
        Assert.Equal(["C"], curriculum.DependentsOf("B"));
        Assert.Empty(curriculum.DependentsOf("C"));
    }
}
