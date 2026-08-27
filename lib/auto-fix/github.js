const API = 'https://api.github.com';

function headers() {
  return {
    Accept: 'application/vnd.github+json',
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  };
}

export async function inspectRepository(path) {
  const owner = process.env.GITHUB_REPO_OWNER || 'Afifarman';
  const repo = process.env.GITHUB_REPO_NAME || 'QuickToolBox';
  const ref = process.env.GITHUB_BASE_REF || 'main';
  const safePath = path.replace(/^\/+/, '').replace(/\.\./g, '');

  const response = await fetch(
    `${API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${safePath}?ref=${encodeURIComponent(ref)}`,
    { headers: headers(), cache: 'no-store' },
  );

  if (!response.ok) {
    return { ok: false, status: response.status, path: safePath, message: await response.text() };
  }

  const data = await response.json();
  if (Array.isArray(data)) {
    return {
      ok: true,
      path: safePath,
      type: 'directory',
      entries: data.map((entry) => ({ name: entry.name, path: entry.path, type: entry.type })),
    };
  }

  if (data.encoding !== 'base64') {
    return { ok: true, path: safePath, type: data.type, sha: data.sha, content: data.content || '' };
  }

  const content = Buffer.from(data.content || '', 'base64').toString('utf8');
  return { ok: true, path: safePath, type: data.type, sha: data.sha, content };
}
