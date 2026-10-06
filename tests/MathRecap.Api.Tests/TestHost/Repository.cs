namespace MathRecap.Api.Tests.TestHost;

// Files of the repository, found from the test assembly upwards (the folder of MathRecap.slnx).
public static class Repository
{
    private static readonly Lazy<string> Root = new(() =>
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (!File.Exists(Path.Combine(directory.FullName, "MathRecap.slnx"))) directory = directory.Parent ?? throw new DirectoryNotFoundException("Repository root not found.");
        return directory.FullName;
    });

    public static string PathOf(params string[] parts) => Path.Combine([Root.Value, .. parts]);
}
