export default function useSystemsList() {
  async function fetchSystemsList() {
    try {
      // Fetch the GitHub API to get the directory listing
      const response = await fetch(
        'https://api.github.com/repos/libretro/libretro-database/contents/metadat/no-intro',
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
      
      // Filter .dat files and extract system names
      const systems = files
        .filter(file => file.name.endsWith('.dat'))
        .map(file => file.name.replace(/\.dat$/, ''))
        .sort();

      return systems;
    } catch (err) {
      console.error('Erro ao buscar lista de sistemas:', err);
      throw new Error(`Não foi possível buscar a lista de sistemas: ${err.message}`);
    }
  }

  return { fetchSystemsList };
}
