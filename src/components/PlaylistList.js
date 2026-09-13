export default {
  name: 'PlaylistList',
  props: { 
    items: { type: Array, default: () => [] },
    threshold: { type: Number, default: 0.65 }
  },
  data() {
    return {
      columnWidths: {
        index: 50,
        original: 250,
        suggestion: 250,
        confidence: 100,
        actions: 150
      },
      resizing: null,
      startX: 0,
      startWidth: 0
    };
  },
  methods: {
    cls(score) {
      if (score >= 0.8) return 'green';
      if (score >= 0.5) return 'yellow';
      return 'red';
    },
    acceptSuggestion(item) {
      if (item.suggestion) item.raw.label = item.suggestion;
      item.original = item.raw.label;
    },
    reset(item) {
      item.suggestion = '';
      item.confidence = 0;
      item.raw.label = item.original;
    },
    acceptAll() {
      for (const item of this.items) {
        if (item.suggestion && item.confidence >= this.threshold) {
          this.acceptSuggestion(item);
        }
      }
    },
    startResize(e, column) {
      this.resizing = column;
      this.startX = e.clientX;
      this.startWidth = this.columnWidths[column];
      document.addEventListener('mousemove', this.onResize);
      document.addEventListener('mouseup', this.stopResize);
      e.preventDefault();
    },
    onResize: function(e) {
      if (!this.resizing) return;
      const delta = e.clientX - this.startX;
      this.columnWidths[this.resizing] = Math.max(50, this.startWidth + delta);
    }.bind(function() {}),
    stopResize: function() {
      document.removeEventListener('mousemove', this.onResize);
      document.removeEventListener('mouseup', this.stopResize);
      this.resizing = null;
    }.bind(function() {})
  },
  mounted() {
    this.onResize = this.onResize.bind(this);
    this.stopResize = this.stopResize.bind(this);
  },
  template: `
    <table id="playlistTable" class="resizable-table">
      <thead>
        <tr>
          <th :style="{ width: columnWidths.index + 'px' }">
            #
            <div class="resize-handle" @mousedown="startResize($event, 'index')"></div>
          </th>
          <th :style="{ width: columnWidths.original + 'px' }">
            Original
            <div class="resize-handle" @mousedown="startResize($event, 'original')"></div>
          </th>
          <th :style="{ width: columnWidths.suggestion + 'px' }">
            Sugestão
            <div class="resize-handle" @mousedown="startResize($event, 'suggestion')"></div>
          </th>
          <th :style="{ width: columnWidths.confidence + 'px' }">
            Confiança
            <div class="resize-handle" @mousedown="startResize($event, 'confidence')"></div>
          </th>
          <th :style="{ width: columnWidths.actions + 'px' }">Ação</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(it, idx) in items" :key="idx" :class="cls(it.confidence)">
          <td :style="{ width: columnWidths.index + 'px' }">{{ it.index }}</td>
          <td :style="{ width: columnWidths.original + 'px' }">{{ it.original }}</td>
          <td :style="{ width: columnWidths.suggestion + 'px' }"><input type="text" v-model="it.suggestion" placeholder="—" /></td>
          <td :style="{ width: columnWidths.confidence + 'px' }">{{ Math.round((it.confidence||0) * 100) }}%</td>
          <td :style="{ width: columnWidths.actions + 'px' }" class="row-actions">
            <button @click="acceptSuggestion(it)">Aceitar</button>
            <button @click="reset(it)">Reset</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div style="margin-top: 12px;">
      <button @click="acceptAll">Aceitar Tudo</button>
    </div>
  `
}
