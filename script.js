// Wrap all JavaScript code in DOMContentLoaded to ensure DOM is fully loaded
  document.addEventListener('DOMContentLoaded', (event) => {
    // ---- Data --------------------------------------------------------------
    // لیست نمادهای پیش‌فرض
    const defaultSymbols = ['EURUSD', 'GBPUSD', 'BTCUSD', 'XAUUSD'];

    // لیست انواع تنظیمات پیش‌فرض
    const initialSetupTypes = [
      'FVG', 'CISD', 'MSS', '+OB', '-OB', 'IFVG', 'BPR', 'SMT', 'BB',
      '3PD Array', 'BSL', 'SSL', 'Silver Bullet', 'High Asia', 'Low Asia',
      'ITH', 'ITL', 'Unicorn', 'FS', 'TS', 'L Open NY', 'H Open NY',
      'Mitigation Block', 'Propulsion Block', 'Rejection Block', 'WICK 50%'
    ];

    // نمونه داده‌های اولیه شامل ستون جدید 'symbol' و 'setupTypes' و 'image'
    const sample = [
      {id:1,date:'2025-04-02',dow:'Tues',killzone:'LDN',direction:'Long',sdp:'2 / 2.5',win:true,rf:false,sl:false,rr:2.45,time:'04:15', comment: '', symbol: 'EURUSD', setupTypes: ['FVG', 'BSL'], image: null},
      {id:2,date:'2025-04-03',dow:'Wed',killzone:'LDN',direction:'Short',sdp:'',win:false,rf:true,sl:false,rr:null,time:'04:30', comment: 'Almost worked.', symbol: 'GBPUSD', setupTypes: ['CISD'], image: null},
      {id:3,date:'2025-04-10',dow:'Wed',killzone:'NY',direction:'Long',sdp:'2 / 2.5',win:true,rf:false,sl:false,rr:4.24,time:'08:50', comment: '', symbol: 'BTCUSD', setupTypes: ['MSS', '+OB'], image: null},
      {id:4,date:'2025-04-12',dow:'Fri',killzone:'NY',direction:'Short',sdp:'3.5 / 4',win:false,rf:true,sl:false,rr:null,time:'08:30', comment: '', symbol: 'EURUSD', setupTypes: ['Silver Bullet'], image: null},
      {id:5,date:'2025-04-15',dow:'Mon',killzone:'NY',direction:'Long',sdp:'2 / 2.5',win:true,rf:false,sl:false,rr:3.22,time:'07:10', comment: 'Perfect setup.', symbol: 'GBPUSD', setupTypes: ['ITH', 'Unicorn'], image: null},
      {id:6,date:'2025-04-16',dow:'Tues',killzone:'LDN',direction:'Short',sdp:'',win:false,rf:true,sl:false,rr:null,time:'03:15', comment: '', symbol: 'XAUUSD', setupTypes: ['BPR'], image: null},
      {id:7,date:'2025-04-16',dow:'Tues',killzone:'NY',direction:'Long',sdp:'3.5 / 4',win:true,rf:false,sl:false,rr:5.92,time:'07:45', comment: '', symbol: 'BTCUSD', setupTypes: ['High Asia'], image: null},
      {id:8,date:'2025-04-16',dow:'Tues',killzone:'LDN Close',direction:'Short',sdp:'',win:false,rf:true,sl:false,rr:null,time:'11:30', comment: '', symbol: 'EURUSD', setupTypes: ['L Open NY'], image: null},
      {id:9,date:'2025-04-17',dow:'Tues',killzone:'LDN Close',direction:'Long',sdp:'',win:true,rf:false,sl:false,rr:null,time:'11:55', comment: '', symbol: 'GBPUSD', setupTypes: ['Propulsion Block'], image: null},
      {id:10,date:'2025-04-24',dow:'Wed',killzone:'LDN',direction:'Long',sdp:'2 / 2.5',win:true,rf:false,sl:false,rr:2.65,time:'03:15', comment: '', symbol: 'XAUUSD', setupTypes: ['WICK 50%'], image: null}
    ];

    // کلید ذخیره‌سازی داده‌ها در Local Storage
    const storeKey = 'bt_rows_v18'; // Changed key to avoid conflicts with old versions
    const symbolsStoreKey = 'bt_symbols_v1'; 
    const setupTypesStoreKey = 'bt_setup_types_v1'; // New key for setup types

    const $ = sel => document.querySelector(sel);
    const tableBody = $('#table-body');
    const charts = {}; // To hold chart instances

    // Modals
    const commentModal = $('#comment-modal');
    const manageSymbolsModal = $('#manage-symbols-modal');
    const setupTypeSelectionModal = $('#setup-type-selection-modal');
    const manageSetupTypesModal = $('#manage-setup-types-modal');
    const confirmModal = $('#confirm-modal');
    const imageZoomModal = $('#image-zoom-modal'); // New: Image zoom modal


    // Input elements
    const commentTextarea = $('#comment-textarea');
    const newSymbolInput = $('#new-symbol-input');
    const addSymbolBtn = $('#add-symbol-btn');
    const symbolListContainer = $('#symbol-list-container');
    const newSetupTypeInput = $('#new-setup-type-input');
    const addNewSetupTypeBtn = $('#add-new-setup-type-btn');
    const availableSetupTypesList = $('#available-setup-types-list');
    const setupTypeCheckboxContainer = $('#setup-type-checkbox-container');
    const fSetupTypeChipsContainer = $('#f-setup-type-chips');
    const fSetupTypeInput = $('#f-setup-type-input'); // Hidden input for filter value

    // New: Image elements in comment modal
    const imageFileInput = $('#image-file-input');
    const imagePreview = $('#image-preview');
    const imagePreviewContainer = $('#image-preview-container');
    const uploadImageBtn = $('#upload-image-btn');
    const removeImageBtn = $('#remove-image-btn');
    const zoomedImage = $('#zoomed-image'); // New: element for zoomed image
    const imageZoomCloseBtn = $('#image-zoom-close-btn'); // New: close button for zoom modal


    // Confirmation modal elements
    const confirmTitle = $('#confirm-title');
    const confirmMessage = $('#confirm-message');
    const confirmOkBtn = $('#confirm-ok');
    const confirmCancelBtn = $('#confirm-cancel');
    const closeConfirmModalBtn = $('#close-confirm-modal');
    let confirmResolve; // To hold resolve Promise for confirmation modal

    // State management
    const state = { 
        rows: load() || sample, 
        sortKey:'id', 
        sortDir:'asc', 
        groupByWeek: false,
        collapsedWeeks: new Set(), 
        editingCommentId: null, // Still used for tracking the trade being commented on
        customSymbols: loadSymbols(),
        availableSetupTypes: loadAvailableSetupTypes() || initialSetupTypes, // Load or use default setup types
        editingSetupTypeId: null, // To track which row's setup types are being edited
        filterSetupTypes: [] // Array of selected setup types for filtering
    };

    function load(){ try{
        const loadedData = JSON.parse(localStorage.getItem(storeKey));
        // Ensure that 'image' field exists and is initialized to null if not present
        if (loadedData) {
            return loadedData.map(row => ({
                ...row,
                image: row.image || null // Initialize image to null if undefined
            }));
        }
        return null;
    }catch(e){ console.error("Error loading rows from local storage:", e); return null; } }
    function loadSymbols() { try { return JSON.parse(localStorage.getItem(symbolsStoreKey)) || []; } catch(e) { console.error("Error loading symbols from local storage:", e); return []; } }
    function loadAvailableSetupTypes() { try { return JSON.parse(localStorage.getItem(setupTypesStoreKey)) || []; } catch(e) { console.error("Error loading setup types from local storage:", e); return []; } }

    /**
     * Cleans up the customSymbols list.
     * Note: The cleanup for availableSetupTypes has been removed as it was causing persistence issues for newly added types.
     * User-added setup types are now only removed explicitly via the delete button in the management modal.
     */
    function cleanupDataLists() {
        // Cleanup customSymbols
        const symbolsInUse = new Set(state.rows.map(r => r.symbol).filter(s => s));
        state.customSymbols = state.customSymbols.filter(sym => 
            defaultSymbols.includes(sym) || symbolsInUse.has(sym)
        );
        state.customSymbols.sort();
    }

    /**
     * Gets all unique symbols from default, custom, and current rows.
     * @returns {string[]} Sorted array of all unique symbols.
     */
    function getAllSymbols() {
        const symbolsFromRows = new Set(state.rows.map(r => r.symbol).filter(s => s));
        const allSymbols = new Set([...defaultSymbols, ...state.customSymbols, ...symbolsFromRows]);
        return Array.from(allSymbols).sort();
    }

    /**
     * Gets all unique setup types from initial, availableSetupTypes (user-added), and current rows.
     * @returns {string[]} Sorted array of all unique setup types.
     */
    function getAllSetupTypes() {
      const setupTypesFromRows = new Set();
      state.rows.forEach(row => {
          if (Array.isArray(row.setupTypes)) {
              row.setupTypes.forEach(type => setupTypesFromRows.add(type));
          }
      });
      // Combine initial (hardcoded), available (user-managed), and from-rows (from imports/existing data)
      const allTypes = new Set([...initialSetupTypes, ...state.availableSetupTypes, ...setupTypesFromRows]);
      return Array.from(allTypes).sort();
    }

    /**
     * Saves current state to Local Storage.
     */
    function save(){ 
        cleanupDataLists(); // Clean up symbols before saving
        localStorage.setItem(storeKey, JSON.stringify(state.rows)); 
        localStorage.setItem(symbolsStoreKey, JSON.stringify(state.customSymbols)); 
        localStorage.setItem(setupTypesStoreKey, JSON.stringify(state.availableSetupTypes)); // Save setup types
        const statusEl = $('#save-status');
        statusEl.textContent = 'ذخیره شد!';
        statusEl.classList.add('saved');
        setTimeout(() => {
            statusEl.textContent = 'آماده';
            statusEl.classList.remove('saved');
        }, 1000);
        console.log("Data saved successfully."); // Debugging log
    }

    // Helper functions for date and style classes
    function getWeekId(d) {
      const date = new Date(d.getTime());
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
      const week1 = new Date(date.getFullYear(), 0, 4);
      return date.getFullYear() + '-W' + String(1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)).padStart(2, '0');
    }

    function getWeekDateRange(weekId) {
        const [year, week] = weekId.split('-W').map(Number);
        const simple = new Date(year, 0, 1 + (week - 1) * 7);
        const dow = simple.getDay();
        const ISOweekStart = simple;
        if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
        const ISOweekEnd = new Date(ISOweekStart);
        ISOweekEnd.setDate(ISOweekEnd.getDate() + 6);
        return `${fmtDate(ISOweekStart.toISOString().slice(0,10))} - ${fmtDate(ISOweekEnd.toISOString().slice(0,10))}`;
    }

    function fmtDate(iso){ if(!iso) return ''; const d=new Date(iso+'T00:00:00'); return d.toLocaleDateString('en-CA'); }
    const killCls = k => {
      if (k === 'LDN') return 'k-l';
      if (k === 'NY') return 'k-ny';
      if (k === 'LDN Close') return 'k-ldn-close';
      if (k === 'Silver bullet LDN') return 'k-sb-ldn';
      if (k === 'Silver bullet NY') return 'k-sb-ny';
      return '';
    };
    const dirCls = d => d==='Long'? 'dir-long': 'dir-short';

    /**
     * Template for building each table row.
     * @param {Object} r - The row data object.
     * @param {boolean} isHidden - Whether the row should be hidden (for collapsed weeks).
     * @returns {string} HTML string for a table row.
     */
    function rowTemplate(r, isHidden = false){
      const style = isHidden ? 'style="display: none;"' : '';
      const hasCommentClass = r.comment ? 'has-comment' : '';
      const hasImageClass = r.image ? 'has-image' : ''; // New class for image indicator
      const setupChips = Array.isArray(r.setupTypes) ? r.setupTypes.map(tag => `<span class="chip setup-chip">${tag}</span>`).join('') : '';

      return `<tr class="fade-in trade-row" data-id="${r.id}" ${style}>
        <td class="center num" data-field="id">${r.id}</td>
        <td class="editable" data-field="symbol"><span class="chip">${r.symbol || ''}</span></td>
        <td class="editable" data-field="setupTypes"><div class="setup-type-display-chips">${setupChips}</div></td> <!-- New column for setup types -->
        <td class="editable" data-field="date">${fmtDate(r.date)}</td>
        <td class="editable" data-field="dow"><span class="chip">${r.dow}</span></td>
        <td class="editable" data-field="killzone"><span class="chip ${killCls(r.killzone)}">${r.killzone}</span></td>
        <td class="editable" data-field="direction"><span class="chip ${dirCls(r.direction)}">${r.direction}</span></td>
        <td class="editable" data-field="sdp">${r.sdp? `<span class='chip zone'>${r.sdp}</span>`:''}</td>
        <td class="center"><input type="checkbox" data-field="win" ${r.win?'checked':''}></td>
        <td class="center"><input type="checkbox" data-field="rf" ${r.rf?'checked':''}></td>
        <td class="center"><input type="checkbox" data-field="sl" ${r.sl?'checked':''}></td>
        <td class="center num editable" data-field="rr">${r.rr ?? ''}</td>
        <td class="center editable" data-field="time">${r.time||''}</td>
        <td class="center">
          <div class="actions-cell">
            <button class="btn ghost ${hasCommentClass} ${hasImageClass}" data-action="comment" title="یادداشت و عکس"><i class="fas fa-note-sticky"></i>${r.image ? ' <i class="fas fa-image" style="font-size: 0.8em;"></i>' : ''}</button>
            <button class="btn" data-action="dup" title="کپی"><i class="fas fa-copy"></i></button>
            <button class="btn" data-action="del" title="حذف"><i class="fas fa-trash-alt"></i></button>
          </div>
        </td>
      </tr>`
    }

    /**
     * Main render function to display the table and apply filters and sorting.
     */
    function render(){
      const q=$('#search').value.trim().toLowerCase();
      const fdow=$('#f-dow').value;
      const fkill=$('#f-kill').value;
      const fstat=$('#f-status').value;
      const fsymbol=$('#f-symbol').value; 
      // Filter by setup types: all selected filter tags must be present in the row's setupTypes
      const fSetupTypes = state.filterSetupTypes; 

      let list = state.rows.filter(r=>{
        const inText = !q || [r.dow,r.killzone,r.direction,r.sdp,fmtDate(r.date),r.time,String(r.rr), r.symbol, (r.setupTypes || []).join(' ')].join(' ').toLowerCase().includes(q);
        const okDow=!fdow||r.dow===fdow;
        const okKill=!fkill||r.killzone===fkill;
        const okSymbol=!fsymbol||r.symbol===fsymbol; 
        const okStat= (fstat==='win' && r.win) || (fstat==='rf' && r.rf) || (fstat==='sl' && r.sl) || fstat==='';
        // Check if all selected filter setup types are present in the row's setupTypes
        const okSetupType = fSetupTypes.length === 0 || fSetupTypes.every(tag => (r.setupTypes || []).includes(tag));

        return inText && okDow && okKill && okStat && okSymbol && okSetupType; 
      });

      list.sort((a,b)=>{ 
          const k=state.sortKey; 
          const d=state.sortDir==='asc'?1:-1; 
          const va=a[k]??''; 
          const vb=b[k]??''; // Fixed: Changed b[k??''] to b[k]
          return (va>vb?1:va<vb?-1:0)*d; 
      });
      
      if (state.groupByWeek) {
          const grouped = list.reduce((acc, row) => {
              const weekId = getWeekId(new Date(row.date));
              if (!acc[weekId]) acc[weekId] = [];
              acc[weekId].push(row);
              return acc;
          }, {});

          let html = '';
          const sortedWeeks = Object.keys(grouped).sort().reverse();

          for (const weekId of sortedWeeks) {
              const weekTrades = grouped[weekId];
              const stats = getStatsForList(weekTrades);
              const isCollapsed = state.collapsedWeeks.has(weekId);
              html += `<tr class="week-header ${isCollapsed ? 'collapsed' : ''}" data-week-id="${weekId}">
                          <td colspan="14"> <!-- Updated colspan to 14 -->
                              <div style="display:flex; justify-content: space-between; align-items: center;">
                                  <span>
                                      <i class="fas fa-chevron-down chevron"></i>
                                      <strong>هفته ${weekId.split('-W')[1]}</strong> (${getWeekDateRange(weekId)})
                                  </span>
                                  <div class="stats" style="border:0; padding:0; font-size: 12px;">
                                      <span class="stat">Win%: ${stats.winPercent}</span>
                                      <span class="stat">RR Sum: ${stats.rrSum}</span>
                                      <span class="stat">Trades: ${stats.total}</span>
                                  </div>
                              </div>
                          </td>
                      </tr>
                  ${weekTrades.map(trade => rowTemplate(trade, isCollapsed)).join('')}`;
          }
          tableBody.innerHTML = html;
      } else {
          tableBody.innerHTML = list.map(row => rowTemplate(row, false)).join('');
      }

      calcFooter(list);
      markSortHeader();
      renderCharts(list);
    }
    
    function getStatsForList(list) {
        const total = list.length;
        if (total === 0) return { winPercent: '0.0', rrSum: '0.00', total: 0 };
        const wins = list.filter(r => r.win).length;
        const rrSum = list.reduce((s, r) => (r.win ? s + (Number(r.rr) || 0) : s), 0);
        return {
            winPercent: ((wins / total) * 100).toFixed(1),
            rrSum: rrSum.toFixed(2),
            total: total
        };
    }

    function calcFooter(list){
      const total=list.length;
      if (total === 0) {
          $('#stats').innerHTML = `<span class="stat">داده‌ای برای نمایش وجود ندارد</span>`;
          return;
      }
      const wins=list.filter(r=>r.win).length, rfs=list.filter(r=>r.rf).length, sls=list.filter(r=>r.sl).length;
      const rrSum=list.reduce((s,r)=>(r.win ? s + (Number(r.rr) || 0) : s), 0);
      
      const dates = list.map(r => new Date(r.date)).filter(d => !isNaN(d));
      let rangeDays = 0;
      if (dates.length > 0) {
          const min=new Date(Math.min.apply(null,dates)); 
          const max=new Date(Math.max.apply(null,dates));
          rangeDays = Math.round((max - min) / 86400000) + 1;
      }

      $('#stats').innerHTML=`
        <span class="stat">RANGE: <strong class="num">${rangeDays}</strong> days</span>
        <span class="stat">Win %: <strong class="num">${((wins/total)*100).toFixed(1)}</strong></span>
        <span class="stat">R‑F %: <strong class="num">${((rfs/total)*100).toFixed(1)}</strong></span>
        <span class="stat">SL %: <strong class="num">${((sls/total)*100).toFixed(1)}</strong></span>
        <span class="stat">SUM RR: <strong class="num">${rrSum.toFixed(2)}</strong></span>
        <span class="stat">تعداد: <strong class="num">${list.length}</strong></span>`
    }

    function markSortHeader(){
      document.querySelectorAll('#grid thead th').forEach(th=> th.classList.remove('sort-asc','sort-desc'));
      const th = document.querySelector(`#grid thead th[data-key="${state.sortKey}"]`);
      if(th) th.classList.add(state.sortDir==='asc'?'sort-asc':'sort-desc');
    }

    const selectOptions = { 
        dow:['Mon','Tues','Wed','Thu','Fri'], 
        killzone:['LDN','NY','LDN Close', 'Silver bullet LDN', 'Silver bullet NY'], 
        direction:['Long','Short'] 
    };
    /**
     * Function to start editing a table cell.
     * @param {HTMLElement} td - The table cell to edit.
     */
    function startEdit(td){
      const tr=td.closest('tr');
      const id=+tr.dataset.id;
      const row=state.rows.find(r=>r.id===id);
      const field=td.dataset.field;
      if(!field || td.querySelector('.cell-editor')) return;

      const finish=(commit)=>{
          if(commit){
              const val = input.value;
              if(field==='date'){
                  row.date = val || row.date;
                  if(row.date){
                      const date = new Date(row.date + 'T00:00:00');
                      row.dow = date.toLocaleDateString('en-US', { weekday: 'short' });
                  }
              } else if(field==='rr'){
                  row.rr = val? Number(val): null;
              } else if(field==='symbol') { 
                  row[field] = val.toUpperCase().trim(); 
                  if (!defaultSymbols.includes(row[field]) && !state.customSymbols.includes(row[field])) {
                      state.customSymbols.push(row[field]);
                      state.customSymbols.sort();
                  }
              } else if (field === 'setupTypes') {
                  // This field is handled by a separate modal, so no direct input value here.
                  // The modal's save logic will update row.setupTypes.
              }
              else { row[field]=val; }
              save(); 
              render();
          } else {
              render();
          }
      };

      let input;
      if(field==='date'){
          input=document.createElement('input'); input.type='date'; input.value=row.date;
      }else if(field==='rr'){
          input=document.createElement('input'); input.type='number'; input.step='0.01'; input.value=row.rr ?? '';
      }else if(field==='time'){
          input=document.createElement('input'); input.type='time'; input.value=row.time||'';
      }else if(field==='sdp'){
          input=document.createElement('input'); input.type='text'; input.placeholder='e.g., 2 / 2.5'; input.value=row.sdp||'';
      }else if(field==='symbol'){ 
          input=document.createElement('input'); input.type='text'; input.value=row.symbol||'';
          input.placeholder = 'مثال: EURUSD';
      }else if(field === 'setupTypes') {
          state.editingSetupTypeId = id; // Store the ID of the row being edited
          openSetupTypeSelectionModal(row.setupTypes || []); // Pass current setup types
          return; // Don't create an input element directly in the cell
      }else if(selectOptions[field]){
          input=document.createElement('select');
          selectOptions[field].forEach(opt=>{ const o=document.createElement('option'); o.value=opt; o.textContent=opt; if(opt===row[field]) o.selected=true; input.appendChild(o); });
      } else return;

      input.className='cell-editor'; td.innerHTML=''; td.appendChild(input); input.focus(); input.select?.();
      input.addEventListener('keydown',ev=>{ if(ev.key==='Enter') finish(true); else if(ev.key==='Escape') finish(false); });
      input.addEventListener('blur',()=>finish(true));
    }
    
    // Event listener for clicks on the table (delete, copy, edit, comment)
    tableBody.addEventListener('click',e=>{ 
      const weekHeader = e.target.closest('.week-header');
      if (weekHeader) {
          const weekId = weekHeader.dataset.weekId;
          if (state.collapsedWeeks.has(weekId)) {
              state.collapsedWeeks.delete(weekId);
          } else {
              state.collapsedWeeks.add(weekId);
          }
          render(); // Re-render to show/hide correctly
          return;
      }

      const tr=e.target.closest('tr.trade-row'); if(!tr) return; const id=+tr.dataset.id; const row=state.rows.find(r=>r.id===id); if(!row) return; 
      
      const actionBtn = e.target.closest('button[data-action]');
      if(actionBtn){ 
          const action = actionBtn.dataset.action; 
          if(action==='del'){ 
              showConfirmModal('تأیید حذف', 'آیا مطمئن هستید که می‌خواهید این ردیف را حذف کنید؟').then(result => {
                  if (result) {
                      state.rows = state.rows.filter(r=>r.id!==id); 
                      save(); 
                      render(); 
                  }
              });
              return; 
          } 
          if(action==='dup'){ 
              const copy=JSON.parse(JSON.stringify(row)); 
              copy.id=nextId(); 
              // Ensure setupTypes is copied as a new array, not a reference
              copy.setupTypes = Array.isArray(row.setupTypes) ? [...row.setupTypes] : [];
              copy.image = row.image || null; // Copy image data
              state.rows.push(copy); 
              save(); 
              buildOptions(); // Rebuild options to ensure new symbols/setups are caught
              render(); 
              return; 
          } 
          if(action==='comment'){ 
              console.log("Comment button clicked for ID:", id); // Debugging log
              openCommentModal(id); 
              return; 
          }
      }
      
      if(e.target.matches('input[type="checkbox"]')){ 
          const f=e.target.dataset.field; const isChecked = e.target.checked; row[f] = isChecked; 
          if(isChecked){ 
              if(f === 'win'){ row.rf = false; row.sl = false; } 
              if(f === 'rf'){ row.win = false; row.sl = false; } 
              if(f === 'sl'){ row.win = false; row.rf = false; } 
          } 
          save(); render(); return; 
      } 
      
      const editableTd = e.target.closest('td.editable');
      if (editableTd) {
          startEdit(editableTd);
      }
    });
    
    // Function to generate the next available ID for new rows
    function nextId(){ return (state.rows.reduce((m,r)=>Math.max(m,r.id),0) || 0) + 1 }
    
    // Event listeners for table header sorting
    document.querySelectorAll('#grid th[data-key]').forEach(th=>{ // Changed to select all th directly, not just thead th
      th.style.cursor='pointer'; 
      th.addEventListener('click',()=>{ 
          const k=th.dataset.key; 
          if (k === 'setupTypes') { // Prevent sorting by setupTypes as it's an array
              return; 
          }
          state.sortDir = state.sortKey===k && state.sortDir==='asc'?'desc':'asc'; 
          state.sortKey=k; 
          render(); 
      }); 
    });
    
    // Event listeners for filters
    // Note: f-setup-type-input is handled by custom chip logic below
    ['search','f-dow','f-kill','f-status', 'f-symbol'].forEach(id=> $("#"+id).addEventListener('input', render));

    /**
     * Function to build filter options (especially for symbol and setup type filters).
     */
    function buildOptions(){
      const dows=[...new Set(state.rows.map(r=>r.dow))];
      const kills=[...new Set(state.rows.map(r=>r.killzone))];
      
      cleanupDataLists(); // Clean up symbols before building options
      const symbols = getAllSymbols(); 
      const allSetupTypes = getAllSetupTypes(); // Get all unique setup types

      $('#f-dow').innerHTML = '<option value="">همه</option>' + dows.map(x=>`<option>${x}</option>`).join('');
      $('#f-kill').innerHTML = '<option value="">همه</option>' + kills.map(x=>`<option>${x}</option>`).join('');
      $('#f-symbol').innerHTML = '<option value="">همه</option>' + symbols.map(x=>`<option>${x}</option>`).join('');
      
      // Render filter chips for setup types
      renderFilterSetupTypeChips();
    }

    // Render filter chips for setup types
    function renderFilterSetupTypeChips() {
      fSetupTypeChipsContainer.innerHTML = '';
      if (state.filterSetupTypes.length === 0) {
          fSetupTypeChipsContainer.innerHTML = '<span style="color: var(--sub);">همه</span>';
      } else {
          state.filterSetupTypes.forEach(tag => {
              const chip = document.createElement('span');
              chip.className = 'chip setup-chip';
              chip.textContent = tag;
              const removeBtn = document.createElement('button');
              removeBtn.innerHTML = '&times;';
              removeBtn.style.background = 'none';
              removeBtn.style.border = 'none';
              removeBtn.style.color = 'inherit';
              removeBtn.style.marginLeft = '5px';
              removeBtn.style.cursor = 'pointer';
              removeBtn.onclick = (e) => {
                  e.stopPropagation();
                  state.filterSetupTypes = state.filterSetupTypes.filter(t => t !== tag);
                  fSetupTypeInput.value = state.filterSetupTypes.join(','); // Update hidden input
                  renderFilterSetupTypeChips(); // Re-render chips
                  render(); // Re-render table with new filter
              };
              chip.appendChild(removeBtn);
              fSetupTypeChipsContainer.appendChild(chip);
          });
      }
      // Update the hidden input value for filtering
      fSetupTypeInput.value = state.filterSetupTypes.join(',');
    }

    // Event listener for clicking the filter setup type chips container (to open selection modal)
    fSetupTypeChipsContainer.addEventListener('click', () => {
        openSetupTypeSelectionModal(state.filterSetupTypes, true); // Pass current filter types, and indicate it's for filtering
    });


    // Event listener for "Add New Row" button
    $('#addRow').addEventListener('click',()=>{ 
        const lastDate = state.rows[state.rows.length-1]?.date || new Date().toISOString().slice(0,10); 
        const newDate = new Date(lastDate + 'T00:00:00');
        const newDow = newDate.toLocaleDateString('en-US', { weekday: 'short' });
        const allSymbols = getAllSymbols();
        const defaultNewSymbol = allSymbols.length > 0 ? allSymbols[0] : 'EURUSD';
        state.rows.push({id:nextId(),date:lastDate,dow:newDow,killzone:'LDN',direction:'Long',sdp:'',win:false,rf:false,sl:false,rr:null,time:'', comment:'', symbol: defaultNewSymbol, setupTypes: [], image: null}); 
        save(); buildOptions(); render(); 
    });

    // Event listener for "Reset" button
    $('#reset').addEventListener('click',()=>{ 
        showConfirmModal('بازنشانی داده‌ها', 'آیا مطمئن هستید؟ تمام داده‌های فعلی با نمونه اولیه جایگزین خواهد شد.').then(result => {
            if (result) {
                state.rows = JSON.parse(JSON.stringify(sample)); 
                state.customSymbols = []; 
                state.availableSetupTypes = JSON.parse(JSON.stringify(initialSetupTypes)); // Reset setup types to initial
                state.filterSetupTypes = []; // Clear filter
                save(); 
                buildOptions(); 
                render(); 
            }
        });
    });
    
    // Event listener for "Clear All" button
    $('#clearAll').addEventListener('click', () => {
        showConfirmModal('پاک کردن همه داده‌ها', 'آیا مطمئن هستید که می‌خواهید تمام داده‌ها و نمادهای سفارشی را پاک کنید؟ این عمل غیرقابل بازگشت است.').then(result => {
            if (result) {
                state.rows = []; 
                state.customSymbols = []; 
                state.availableSetupTypes = JSON.parse(JSON.stringify(initialSetupTypes)); // Reset setup types to initial
                state.filterSetupTypes = []; // Clear filter
                save();
                buildOptions();
                render();
            }
        });
    });

    // Event listener for "Export CSV" button
    $('#exportCsv').addEventListener('click', () => {
        const csv = Papa.unparse(state.rows, { header: true });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'backtest.csv';
        a.click();
        URL.revokeObjectURL(url);
    });

    // Event listener for "Import CSV" button
    $('#importCsv').addEventListener('click',()=> $('#csvFile').click());
    $('#csvFile').addEventListener('change', e=>{ 
        const file=e.target.files[0]; 
        if(!file) return; 
        
        showConfirmModal('ورود فایل CSV', 'آیا مطمئن هستید؟ تمام داده‌های فعلی با محتوای فایل جایگزین خواهد شد.').then(result => {
            if (result) {
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function(results) {
                        try {
                            const items = results.data.map(o => ({
                                id: Number(o.id) || 0,
                                date: o.date || '',
                                dow: o.dow || '',
                                killzone: o.killzone || '',
                                direction: o.direction || '',
                                sdp: o.sdp || '',
                                win: String(o.win).toLowerCase() === 'true',
                                rf: String(o.rf).toLowerCase() === 'true',
                                sl: String(o.sl).toLowerCase() === 'true',
                                rr: o.rr ? Number(o.rr) : null,
                                time: o.time || '',
                                comment: o.comment || '',
                                symbol: o.symbol ? String(o.symbol).toUpperCase().trim() : 'EURUSD',
                                setupTypes: o.setupTypes ? String(o.setupTypes).split(',').map(s => s.trim()).filter(s => s !== '') : [],
                                image: o.image || null // Import image data
                            }));
                            state.rows = items;
                            // Collect and add new symbols/setupTypes from imported data
                            const importedSymbols = new Set(items.map(item => item.symbol).filter(s => s));
                            importedSymbols.forEach(s => {
                                if (!defaultSymbols.includes(s) && !state.customSymbols.includes(s)) {
                                    state.customSymbols.push(s);
                                }
                            });

                            const importedSetupTypes = new Set();
                            items.forEach(item => {
                                if (Array.isArray(item.setupTypes)) {
                                    item.setupTypes.forEach(type => importedSetupTypes.add(type));
                                }
                            });
                            importedSetupTypes.forEach(type => {
                                // Add to availableSetupTypes only if it's genuinely new
                                if (!getAllSetupTypes().includes(type)) {
                                    state.availableSetupTypes.push(type);
                                }
                            });
                            state.availableSetupTypes.sort();


                            save();
                            buildOptions();
                            render();
                        } catch (err) {
                            console.error("خطا در پردازش داده‌های فایل CSV:", err);
                            showConfirmModal('خطا', 'خطا در پردازش داده‌های فایل CSV.', false); 
                        }
                    },
                    error: function(err) {
                        console.error("خطا در خواندن فایل CSV:", err);
                        showConfirmModal('خطا', 'خطا در خواندن فایل CSV. لطفا از صحت فایل اطمینان حاصل کنید.', false);
                    }
                });
            }
        });
        e.target.value = ''; // Reset file input
    });

    // Event listener for "Clear Filters" button
    $('#clearFilters').addEventListener('click', () => {
        $('#search').value = '';
        $('#f-dow').value = '';
        $('#f-kill').value = '';
        $('#f-status').value = '';
        $('#f-symbol').value = ''; 
        state.filterSetupTypes = []; // Clear setup type filter
        buildOptions(); // Re-render filter chips
        render();
    });

    // Event listener for "Group by Week" toggle
    $('#group-by-week').addEventListener('change', (e) => { 
        state.groupByWeek = e.target.checked; 
        if (state.groupByWeek) {
            state.collapsedWeeks = new Set(state.rows.map(r => getWeekId(new Date(r.date))));
        }
        render(); 
    });

    // ---- Comment Modal Logic (including Image Attachment) ------------------------------------------------

    /**
     * Opens the comment modal for a specific trade.
     * @param {number} tradeId - The ID of the trade whose comment/image is to be edited.
     */
    function openCommentModal(tradeId) {
        state.editingCommentId = tradeId;
        const row = state.rows.find(r => r.id === tradeId);
        if (row) {
            commentTextarea.value = row.comment || '';
            
            // Handle image display
            if (row.image) {
                imagePreview.src = row.image;
                imagePreview.style.display = 'block';
                imagePreviewContainer.style.display = 'block';
                removeImageBtn.style.display = 'inline-flex';
                uploadImageBtn.textContent = 'تغییر عکس';
            } else {
                imagePreview.src = '#';
                imagePreview.style.display = 'none';
                imagePreviewContainer.style.display = 'none';
                removeImageBtn.style.display = 'none';
                uploadImageBtn.textContent = 'آپلود عکس';
            }
            imageFileInput.value = ''; // Clear file input
            commentModal.classList.add('visible');
        } else {
            console.error("Trade with ID", tradeId, "not found for commenting.");
        }
    }

    // Event listeners for comment modal
    $('#close-comment-modal').addEventListener('click', () => commentModal.classList.remove('visible'));
    $('#cancel-comment').addEventListener('click', () => commentModal.classList.remove('visible'));
    commentModal.addEventListener('click', (e) => {
        if (e.target === commentModal) {
            commentModal.classList.remove('visible');
        }
    });

    $('#save-comment').addEventListener('click', () => {
        if (state.editingCommentId !== null) {
            const row = state.rows.find(r => r.id === state.editingCommentId);
            row.comment = commentTextarea.value;
            // Image data is already updated by the file input change listener
            save();
            render();
        }
        commentModal.classList.remove('visible');
    });

    // New: Image upload and removal listeners
    uploadImageBtn.addEventListener('click', () => {
        imageFileInput.click(); // Trigger the hidden file input
    });

    imageFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (readEvent) => {
                const base64Image = readEvent.target.result;
                if (state.editingCommentId !== null) {
                    const row = state.rows.find(r => r.id === state.editingCommentId);
                    row.image = base64Image;
                    imagePreview.src = base64Image;
                    imagePreview.style.display = 'block';
                    imagePreviewContainer.style.display = 'block';
                    removeImageBtn.style.display = 'inline-flex';
                    uploadImageBtn.textContent = 'تغییر عکس';
                }
            };
            reader.readAsDataURL(file); // Convert image to Base64
        }
    });

    removeImageBtn.addEventListener('click', () => {
        showConfirmModal('تأیید حذف عکس', 'آیا مطمئن هستید که می‌خواهید این عکس را حذف کنید؟').then(result => {
            if (result) {
                if (state.editingCommentId !== null) {
                    const row = state.rows.find(r => r.id === state.editingCommentId);
                    row.image = null; // Remove image data
                    imagePreview.src = '#';
                    imagePreview.style.display = 'none';
                    imagePreviewContainer.style.display = 'none';
                    removeImageBtn.style.display = 'none';
                    uploadImageBtn.textContent = 'آپلود عکس';
                }
            }
        });
    });

    // New: Image zoom functionality
    imagePreview.addEventListener('click', () => {
        if (imagePreview.src && imagePreview.src !== window.location.href) { // Ensure there's an actual image
            zoomedImage.src = imagePreview.src;
            imageZoomModal.classList.add('visible');
        }
    });

    imageZoomCloseBtn.addEventListener('click', () => {
        imageZoomModal.classList.remove('visible');
    });

    imageZoomModal.addEventListener('click', (e) => {
        if (e.target === imageZoomModal || e.target === zoomedImage) {
            imageZoomModal.classList.remove('visible');
        }
    });
    
    // ---- Manage Symbols Modal Logic -----------------------------------------
    $('#manage-symbols-btn').addEventListener('click', openManageSymbolsModal);
    $('#close-manage-symbols-modal').addEventListener('click', closeManageSymbolsModal);
    $('#done-managing-symbols').addEventListener('click', closeManageSymbolsModal);
    manageSymbolsModal.addEventListener('click', (e) => {
        if (e.target === manageSymbolsModal) { 
            closeManageSymbolsModal();
        }
    });

    function openManageSymbolsModal() {
        renderSymbolList(); 
        manageSymbolsModal.classList.add('visible');
        newSymbolInput.focus();
    }

    function closeManageSymbolsModal() {
        manageSymbolsModal.classList.remove('visible');
        save(); 
        buildOptions(); 
        render(); 
    }

    function renderSymbolList() {
        symbolListContainer.innerHTML = '';
        const allUniqueSymbols = getAllSymbols(); 
        // Filter out empty strings before sorting to avoid weird ordering
        const filteredSymbols = allUniqueSymbols.filter(symbol => symbol.trim() !== '');

        filteredSymbols.forEach(symbol => {
            const isDefault = defaultSymbols.includes(symbol);
            const symbolItem = document.createElement('div');
            symbolItem.className = `symbol-item ${isDefault ? 'default-symbol' : ''}`;
            symbolItem.innerHTML = `
                <span>${symbol}</span>
                <button class="delete-symbol-btn" data-symbol="${symbol}" ${isDefault ? 'disabled' : ''}>
                    <i class="fas fa-times"></i>
                </button>
            `;
            symbolListContainer.appendChild(symbolItem);
        });
    }

    addSymbolBtn.addEventListener('click', addSymbolFromModal);
    newSymbolInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addSymbolFromModal();
        }
    });

    function addSymbolFromModal() {
        const symbol = newSymbolInput.value.toUpperCase().trim();
        if (symbol && !defaultSymbols.includes(symbol) && !state.customSymbols.includes(symbol)) { 
            state.customSymbols.push(symbol);
            state.customSymbols.sort();
            newSymbolInput.value = ''; 
            renderSymbolList(); 
        } else if (symbol) {
            showConfirmModal('خطا', 'این نماد از قبل موجود است یا ورودی نامعتبر است.', false); 
        }
    }

    symbolListContainer.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-symbol-btn');
        if (deleteBtn && !deleteBtn.disabled) { 
            const symbol = deleteBtn.dataset.symbol;
            deleteSymbol(symbol);
        }
    });

    function deleteSymbol(symbolToDelete) {
        showConfirmModal('تأیید حذف نماد', `آیا مطمئن هستید که می‌خواهید نماد ${symbolToDelete} را حذف کنید؟ این عمل بازگردانده نخواهد شد و ممکن است بر داده‌های جدول تأثیر بگذارد.`).then(result => {
            if (result) {
                state.customSymbols = state.customSymbols.filter(sym => sym !== symbolToDelete);
                state.rows.forEach(row => {
                    if (row.symbol === symbolToDelete) {
                        row.symbol = ''; 
                    }
                });
                renderSymbolList(); 
            }
        });
    }

    // ---- Setup Type Selection Modal Logic (for editing a trade's setup types) ----
    let currentEditingSetupTypes = []; // Temporary array to hold selections while modal is open
    let isFilterSelection = false; // Flag to determine if modal is for filtering or editing a trade

    /**
     * Opens the setup type selection modal.
     * @param {string[]} selectedTypes - The array of currently selected setup types for the trade/filter.
     * @param {boolean} forFilter - True if this modal is for selecting filter types, false for editing a trade.
     */
    function openSetupTypeSelectionModal(selectedTypes, forFilter = false) {
        currentEditingSetupTypes = [...selectedTypes]; // Copy to avoid direct modification
        isFilterSelection = forFilter;
        renderSetupTypeCheckboxes();
        setupTypeSelectionModal.classList.add('visible');
    }

    function closeSetupTypeSelectionModal() {
        setupTypeSelectionModal.classList.remove('visible');
    }

    function renderSetupTypeCheckboxes() {
        setupTypeCheckboxContainer.innerHTML = '';
        const allAvailableTypes = getAllSetupTypes(); // Get all available types
        // Filter out empty strings before sorting to avoid weird ordering
        const filteredSetupTypes = allAvailableTypes.filter(type => type.trim() !== '');

        filteredSetupTypes.forEach(type => {
            const isSelected = currentEditingSetupTypes.includes(type);
            const checkboxLabel = document.createElement('label');
            checkboxLabel.className = `setup-type-checkbox ${isSelected ? 'selected' : ''}`;
            checkboxLabel.innerHTML = `
                <input type="checkbox" value="${type}" ${isSelected ? 'checked' : ''}>
                ${type}
            `;
            checkboxLabel.addEventListener('click', (e) => {
                // Toggle selection
                const checkbox = checkboxLabel.querySelector('input');
                checkbox.checked = !checkbox.checked; // Manually toggle
                if (checkbox.checked) {
                    if (!currentEditingSetupTypes.includes(type)) {
                        currentEditingSetupTypes.push(type);
                    }
                } else {
                    currentEditingSetupTypes = currentEditingSetupTypes.filter(t => t !== type);
                }
                checkboxLabel.classList.toggle('selected', checkbox.checked);
            });
            setupTypeCheckboxContainer.appendChild(checkboxLabel);
        });
    }

    $('#save-setup-type-selection').addEventListener('click', () => {
        if (isFilterSelection) {
            state.filterSetupTypes = [...currentEditingSetupTypes];
            renderFilterSetupTypeChips(); // Update filter chips display
            render(); // Re-render table with new filter
        } else if (state.editingSetupTypeId !== null) {
            const row = state.rows.find(r => r.id === state.editingSetupTypeId);
            row.setupTypes = [...currentEditingSetupTypes]; // Update the trade's setup types
            save(); // Save changes
            render(); // Re-render table
        }
        closeSetupTypeSelectionModal();
    });

    $('#cancel-setup-type-selection').addEventListener('click', closeSetupTypeSelectionModal);
    $('#close-setup-type-selection-modal').addEventListener('click', closeSetupTypeSelectionModal);
    setupTypeSelectionModal.addEventListener('click', (e) => {
        if (e.target === setupTypeSelectionModal) {
            closeSetupTypeSelectionModal();
        }
    });

    // ---- Manage Setup Types Modal Logic (for adding/removing available setup types) ----
    $('#manage-setup-types-btn').addEventListener('click', openManageSetupTypesModal);
    $('#close-manage-setup-types-modal').addEventListener('click', closeManageSetupTypesModal);
    $('#done-managing-setup-types').addEventListener('click', closeManageSetupTypesModal);
    manageSetupTypesModal.addEventListener('click', (e) => {
        if (e.target === manageSetupTypesModal) {
            closeManageSetupTypesModal();
        }
    });

    function openManageSetupTypesModal() {
        renderAvailableSetupTypesList();
        manageSetupTypesModal.classList.add('visible');
        newSetupTypeInput.focus();
    }

    function closeManageSetupTypesModal() {
        manageSetupTypesModal.classList.remove('visible');
        save(); // Save changes made in this modal
        buildOptions(); // Rebuild options for all filters (including setup types)
        render(); // Re-render table
    }

    function renderAvailableSetupTypesList() {
        availableSetupTypesList.innerHTML = '';
        const allCurrentAvailableTypes = getAllSetupTypes(); // Get all types including those from trades
        // Filter out empty strings before sorting to avoid weird ordering
        const filteredAvailableTypes = allCurrentAvailableTypes.filter(type => type.trim() !== '');


        filteredAvailableTypes.forEach(type => {
            const isInitial = initialSetupTypes.includes(type);
            const typeItem = document.createElement('div');
            typeItem.className = `setup-type-item ${isInitial ? 'default-type' : ''}`;
            typeItem.innerHTML = `
                <span>${type}</span>
                <button class="delete-btn" data-type="${type}" ${isInitial ? 'disabled' : ''}>
                    <i class="fas fa-times"></i>
                </button>
            `;
            availableSetupTypesList.appendChild(typeItem);
        });
    }

    addNewSetupTypeBtn.addEventListener('click', addAvailableSetupType);
    newSetupTypeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addAvailableSetupType();
        }
    });

    function addAvailableSetupType() {
        const type = newSetupTypeInput.value.toUpperCase().trim();
        // Check if the type already exists in the comprehensive list of all setup types
        if (type && !getAllSetupTypes().includes(type)) {
            state.availableSetupTypes.push(type); // Add to the user-managed available types
            state.availableSetupTypes.sort();
            newSetupTypeInput.value = '';
            renderAvailableSetupTypesList(); // Re-render the list in the modal
        } else if (type) {
            showConfirmModal('خطا', 'این نوع تنظیمات از قبل موجود است یا ورودی نامعتبر است.', false);
        }
    }

    availableSetupTypesList.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn && !deleteBtn.disabled) {
            const type = deleteBtn.dataset.type;
            deleteAvailableSetupType(type);
        }
    });

    function deleteAvailableSetupType(typeToDelete) {
        showConfirmModal('تأیید حذف نوع تنظیمات', `آیا مطمئن هستید که می‌خواهید نوع تنظیمات ${typeToDelete} را حذف کنید؟ این عمل بازگردانده نخواهد شد و ممکن است بر داده‌های جدول تأثیر بگذارد.`).then(result => {
            if (result) {
                // Remove from the user-managed available types
                state.availableSetupTypes = state.availableSetupTypes.filter(type => type !== typeToDelete);
                // Also remove from any rows that explicitly use this setup type
                state.rows.forEach(row => {
                    if (Array.isArray(row.setupTypes)) {
                        row.setupTypes = row.setupTypes.filter(t => t !== typeToDelete);
                    }
                });
                renderAvailableSetupTypesList(); // Re-render the list in the modal
            }
        });
    }

    // ---- Generic Confirmation Modal Logic -----------------------------------
    function showConfirmModal(title, message, showCancel = true) {
        confirmTitle.textContent = title;
        confirmMessage.textContent = message;
        confirmCancelBtn.style.display = showCancel ? 'inline-flex' : 'none'; 
        confirmModal.classList.add('visible');

        return new Promise(resolve => {
            confirmResolve = resolve;
        });
    }

    function closeConfirmModal(result) {
        confirmModal.classList.remove('visible');
        if (confirmResolve) {
            confirmResolve(result);
            confirmResolve = null; 
        }
    }

    confirmOkBtn.addEventListener('click', () => closeConfirmModal(true));
    confirmCancelBtn.addEventListener('click', () => closeConfirmModal(false));
    closeConfirmModalBtn.addEventListener('click', () => closeConfirmModal(false)); 
    confirmModal.addEventListener('click', (e) => { 
        if (e.target === confirmModal) {
            closeConfirmModal(false);
        }
    });


    // ---- Charts Logic -------------------------------------------------------
    $('#charts-panel .panel-header').addEventListener('click', () => {
        $('#charts-panel').classList.toggle('collapsed');
    });
    
    // Set Chart.js global defaults for dark theme
    Chart.defaults.color = '#9aa5b3'; // --sub color
    Chart.defaults.borderColor = 'rgba(154, 165, 179, 0.1)';


    function renderCharts(list) {
        if (list.length === 0) return;

        // --- Equity Curve ---
        let equity = 0;
        const equityData = list.map(trade => {
            if (trade.win) equity += (trade.rr || 0);
            else if (trade.sl) equity -= 1; 
            return equity;
        });
        
        const ctxEquity = $('#equity-curve-chart').getContext('2d');
        const gradient = ctxEquity.createLinearGradient(0, 0, 0, ctxEquity.canvas.clientHeight);
        gradient.addColorStop(0, 'rgba(77, 212, 172, 0.5)');
        gradient.addColorStop(1, 'rgba(77, 212, 172, 0)');

        if (charts.equity) charts.equity.destroy();
        charts.equity = new Chart(ctxEquity, {
            type: 'line',
            data: {
                labels: list.map((t, i) => `Trade ${i + 1}`),
                datasets: [{
                    label: 'منحنی سود (R)',
                    data: equityData,
                    borderColor: 'rgba(77, 212, 172, 1)',
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(77, 212, 172, 1)',
                    pointRadius: 2,
                    pointHoverRadius: 5
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        // --- DOW Performance ---
        const dowOrder = ['Mon', 'Tues', 'Wed', 'Thu', 'Fri'];
        const dowData = dowOrder.map(day => {
            return list.filter(t => t.dow === day).reduce((acc, trade) => {
                if (trade.win) return acc + (trade.rr || 0);
                if (trade.sl) return acc - 1;
                return acc;
            }, 0);
        });
        
        if (charts.dow) charts.dow.destroy();
        charts.dow = new Chart($('#dow-chart'), {
            type: 'bar',
            data: {
                labels: dowOrder,
                datasets: [{
                    label: 'سود خالص (R) بر اساس روز',
                    data: dowData,
                    backgroundColor: dowData.map(d => d >= 0 ? 'rgba(77, 212, 172, 0.7)' : 'rgba(255, 107, 107, 0.7)'),
                    borderRadius: 4,
                    hoverBackgroundColor: dowData.map(d => d >= 0 ? 'rgba(77, 212, 172, 1)' : 'rgba(255, 107, 107, 1)')
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } } } }
        });

        // --- Outcome Distribution ---
        const outcomes = {
            wins: list.filter(t => t.win).length,
            losses: list.filter(t => t.sl).length,
            rf: list.filter(t => t.rf).length
        };

        if (charts.outcome) charts.outcome.destroy();
        charts.outcome = new Chart($('#outcome-chart'), {
            type: 'doughnut',
            data: {
                labels: ['برد', 'باخت', 'سر به سر'],
                datasets: [{
                    data: [outcomes.wins, outcomes.losses, outcomes.rf],
                    backgroundColor: ['rgba(77, 212, 172, 0.8)', 'rgba(255, 107, 107, 0.8)', 'rgba(154, 165, 179, 0.8)'],
                    borderColor: 'var(--panel)',
                    hoverOffset: 8
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
        });
    }


    // ---- Initialization --------------------------------------------------------------
    buildOptions();
    render();

  }); // End of DOMContentLoaded
