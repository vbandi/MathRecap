namespace MathRecap.Api.Tests.TestHost;

public static class TestCurriculum
{
    // The curriculum the app serves, from the repository's web/data/curriculum.json.
    public static Curriculum Load() => Curriculum.Load(Repository.PathOf("web", "data", "curriculum.json"));
}
