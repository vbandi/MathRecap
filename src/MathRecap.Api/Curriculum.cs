using System.Text.Json;

namespace MathRecap.Api;

public sealed record Skill(string Id, string Name, string Description, IReadOnlyList<string> Prerequisites);

// The curriculum graph from the front end's data/curriculum.json, with the lookups of web/curriculum.mjs.
public sealed class Curriculum
{
    private readonly Dictionary<string, Skill> skillsById;
    private readonly Dictionary<string, List<string>> dependentIds;

    public Curriculum(IReadOnlyList<Skill> skills)
    {
        skillsById = skills.ToDictionary(skill => skill.Id);
        dependentIds = skills.ToDictionary(skill => skill.Id, _ => new List<string>());
        foreach (var skill in skills)
        {
            foreach (var prerequisiteId in skill.Prerequisites) dependentIds[prerequisiteId].Add(skill.Id);
        }
    }

    public static Curriculum Load(string path) =>
        new(JsonSerializer.Deserialize<List<Skill>>(File.ReadAllText(path), JsonSerializerOptions.Web) ?? throw new InvalidDataException($"Empty curriculum: {path}"));

    public Skill? Find(string skillId) => skillsById.GetValueOrDefault(skillId);

    // Skills that list skillId as a direct prerequisite, in curriculum order.
    public IReadOnlyList<string> DependentsOf(string skillId) => dependentIds.TryGetValue(skillId, out var ids) ? ids : [];

    // The skill with its prerequisites and dependents: the skills a worksheet prompt names.
    public IReadOnlySet<string> NeighborhoodOf(Skill skill) => new HashSet<string>([skill.Id, .. skill.Prerequisites, .. DependentsOf(skill.Id)]);
}
