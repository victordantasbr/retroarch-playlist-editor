import { createApp, ref, computed, onMounted } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import PlaylistList from './src/components/PlaylistList.js';
import useFuzzyMatch from './src/composables/useFuzzyMatch.js';
import useSystemsList from './src/composables/useSystemsList.js';

const App = {
  components: { PlaylistList },
  setup() {
    const file = ref(null);
    const playlist = ref(null);
    const entries = ref([]);
    const systems = ref([]);
    const system = ref('');
    const threshold = ref(0.65);
    const summary = ref('Nenhum arquivo carregado.');
    const defaultCoreName = ref('');
    const defaultCorePath = ref('');

    const { fetchDatNames, matchLabel } = useFuzzyMatch();
    const { fetchSystemsList } = useSystemsList();

    onMounted(async () => {
      try {
        const systemsList = await fetchSystemsList();
        systems.value = systemsList;
        if (systemsList.length > 0) {
          system.value = systemsList[0];
        }
      } catch (err) {
        summary.value = 'Erro ao carregar lista de sistemas';
        console.error(err);
      }
    });

    function detectSystemFromCoreName(coreName) {
      if (!coreName || systems.value.length === 0) return null;
      // Tenta encontrar uma correspondência parcial
      const lower = coreName.toLowerCase();
      return systems.value.find(sys => lower.includes(sys.toLowerCase()));
    }

    function onFileChange(e) {
      const f = e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const json = JSON.parse(reader.result);
          playlist.value = json;
          entries.value = (json.items || json.files || []).map((it, idx) => ({
            index: idx + 1,
            original: it.label || '',
            suggestion: it.label || '',
            confidence: 0,
            raw: it
          }));
          
          // Extrair informações do núcleo padrão
          defaultCoreName.value = json.default_core_name || '';
          defaultCorePath.value = json.default_core_path || '';
          console.log('Core Name:', defaultCoreName.value, 'Core Path:', defaultCorePath.value);
          
          // Tentar detectar o sistema a partir do core_name
          const detectedSystem = detectSystemFromCoreName(defaultCoreName.value);
          if (detectedSystem) {
            system.value = detectedSystem;
          }
          
          summary.value = `Carregado ${entries.value.length} itens.`;
        } catch (err) {
          summary.value = 'Erro ao parsear o arquivo .lpl';
        }
      };
      reader.readAsText(f);
      file.value = f;
    }

    async function applyMatch() {
      if (!playlist.value) return;
      summary.value = 'Buscando database...';
      const names = await fetchDatNames(system.value);
      summary.value = `Database carregada (${names.length} nomes). Aplicando matches...`;
      for (const row of entries.value) {
        const res = matchLabel(row.original, names, threshold.value);
        if (res) {
          row.suggestion = res.best;
          row.confidence = res.score;
        } else {
          row.suggestion = '';
          row.confidence = 0;
        }
      }
      summary.value = 'Match aplicado.';
    }

    function exportLpl() {
      if (!playlist.value) return;
      // Update labels in playlist
      const itemsArray = playlist.value.items || playlist.value.files || [];
      for (let i = 0; i < entries.value.length; i++) {
        const r = entries.value[i];
        if (r.suggestion && r.confidence >= threshold.value) {
          itemsArray[i].label = r.suggestion;
        }
      }
      const blob = new Blob([JSON.stringify(playlist.value, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (file.value && file.value.name) ? file.value.name.replace(/\.lpl$/, '') + '.lpl' : 'playlist.lpl';
      a.click();
      URL.revokeObjectURL(url);
    }

    const thresholdPercent = computed({
      get: () => Math.round(threshold.value * 100),
      set: (v) => { threshold.value = Number(v) / 100; }
    });

    return { file, playlist, entries, systems, system, threshold, thresholdPercent, summary, defaultCoreName, defaultCorePath, onFileChange, applyMatch, exportLpl };
  },
  template: `
    <div>
      <div class="controls">
        <label class="small">Playlist (.lpl)</label>
        <input type="file" @change="onFileChange" accept=".lpl,application/json">

        <label class="small">Sistema</label>
        <select v-model="system">
          <option v-for="sys in systems" :key="sys" :value="sys">{{ sys }}</option>
        </select>

        <label class="small">Sensibilidade</label>
        <input type="range" min="0" max="100" v-model.number="thresholdPercent">
      </div>
      <div class="controls">
        <button @click="applyMatch">Buscar .dat & Aplicar Match</button>
        <button @click="exportLpl">Exportar .lpl</button>
      </div>
      <div id="summary" class="small note">{{ summary }}</div>
      <div v-if="defaultCoreName" id="coreInfo" class="small note" style="margin-top: 8px; color: #06b6d4;">
        <strong>Núcleo padrão:</strong> {{ defaultCoreName }}
      </div>
      <PlaylistList :items="entries" :threshold="threshold" />
    </div>
  `
};

createApp(App).mount('#app');
