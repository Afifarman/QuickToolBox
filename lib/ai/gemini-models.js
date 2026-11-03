export function selectGeminiModels(modelRecords, preferredModel, limit = 5) {
  if (!Array.isArray(modelRecords)) return [];

  const candidates = modelRecords
    .filter(item =>
      Array.isArray(item?.supportedGenerationMethods) &&
      item.supportedGenerationMethods.includes('generateContent')
    )
    .map(item => String(item.name || '').replace(/^models\//, '').trim())
    .filter(name =>
      /^gemini-/i.test(name) &&
      /flash/i.test(name) &&
      !/(audio|image|tts|embedding|robotics|computer-use|live)/i.test(name)
    );

  const stable = candidates.filter(name => !/(preview|experimental|latest|exp)/i.test(name));
  const ordered = [
    ...(preferredModel ? [String(preferredModel).replace(/^models\//, '').trim()] : []),
    ...stable,
    ...candidates,
  ].filter((name, index, all) => name && all.indexOf(name) === index && candidates.includes(name));

  return ordered.slice(0, Math.max(1, Math.min(Number(limit) || 5, 5)));
}
