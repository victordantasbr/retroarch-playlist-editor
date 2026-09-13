export default function useSystemsList() {
  async function fetchSystemsList() {
    try {
      const response = await fetch(
        'https://api.github.com/repos/libretro/libretro-database/contents/rdb',
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const files = await response.json();

      const systems = files
        .filter(file => file.name.endsWith('.rdb'))
        .map(file => file.name.replace(/\.rdb$/, ''))
        .sort();

      return systems;
    } catch (err) {
      console.error('Erro ao buscar lista de sistemas:', err);
      throw new Error(`Não foi possível buscar a lista de sistemas: ${err.message}`);
    }
  }

  return { fetchSystemsList };
}
