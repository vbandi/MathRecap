namespace MathRecap.Api.Tests.TestHost;

public static class TestCurriculum
{
    // The curriculum the app serves, from the repository's web/data/curriculum.json.
    public static Curriculum Load()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (!File.Exists(Path.Combine(directory.FullName, "MathRecap.slnx"))) directory = directory.Parent ?? throw new DirectoryNotFoundException("Repository root not found.");
        return Curriculum.Load(Path.Combine(directory.FullName, "web", "data", "curriculum.json"));
    }
}
