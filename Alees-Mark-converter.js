/* ══════════════════════════════════════════
     STATE
  ══════════════════════════════════════════ */
  let students = [];
  let editIndex = -1;

  // Bulk upload state
  let parsedRows = [];      // raw rows from file
  let fileHeaders = [];     // column headers

  /* ══════════════════════════════════════════
     INIT
  ══════════════════════════════════════════ */
  window.onload = () => {
    const saved = localStorage.getItem('aleesStudents');
    if (saved) students = JSON.parse(saved);
    const cfg = localStorage.getItem('aleesCfg');
    if (cfg) {
      const c = JSON.parse(cfg);
      if (c.inputMax) document.getElementById('inputMax').value = c.inputMax;
      if (c.outputMax) document.getElementById('outputMax').value = c.outputMax;
      if (c.decimals) document.getElementById('decimals').value = c.decimals;
      if (c.gradingSystem) document.getElementById('gradingSystem').value = c.gradingSystem;
    }
    updateMaxLabel();
    refreshTable();
  };

  /* ══════════════════════════════════════════
     TABS
  ══════════════════════════════════════════ */
  function switchTab(name, el) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + name).classList.add('active');
    el.classList.add('active');
  }

  /* ══════════════════════════════════════════
     CONFIG HELPERS
  ══════════════════════════════════════════ */
  function saveData() {
    localStorage.setItem('aleesStudents', JSON.stringify(students));
    localStorage.setItem('aleesCfg', JSON.stringify({
      inputMax: document.getElementById('inputMax').value,
      outputMax: document.getElementById('outputMax').value,
      decimals: document.getElementById('decimals').value,
      gradingSystem: document.getElementById('gradingSystem').value,
    }));
  }

  function getInputMax() { return parseFloat(document.getElementById('inputMax').value) || 20; }
  function getOutputMax() { return parseFloat(document.getElementById('outputMax').value) || 40; }
  function getDecimals() { return parseInt(document.getElementById('decimals').value); }

  function convert(mark) {
    return (mark / getInputMax()) * getOutputMax();
  }

  function getGrade(pct) {
    const gs = document.getElementById('gradingSystem').value;
    if (gs === 'none') return { label: '—', color: 'var(--muted)' };
    if (gs === 'percentage') {
      if (pct >= 90) return { label: 'A+', color: 'var(--green)' };
      if (pct >= 80) return { label: 'A',  color: 'var(--cyan)' };
      if (pct >= 70) return { label: 'B+', color: 'var(--blue)' };
      if (pct >= 60) return { label: 'B',  color: 'var(--magenta)' };
      if (pct >= 50) return { label: 'C+', color: 'var(--purple)' };
      if (pct >= 40) return { label: 'C',  color: 'var(--yellow)' };
      if (pct >= 30) return { label: 'D+', color: 'var(--orange)' };
      if (pct >= 20) return { label: 'D',  color: 'var(--red)' };
      return { label: 'E', color: 'var(--red)' };
    }
    if (gs === 'letter') {
      if (pct >= 80) return { label: 'A', color: 'var(--green)' };
      if (pct >= 60) return { label: 'B', color: 'var(--blue)' };
      if (pct >= 40) return { label: 'C', color: 'var(--yellow)' };
      if (pct >= 30) return { label: 'D', color: 'var(--orange)' };
      return { label: 'E', color: 'var(--red)' };
    }
    if (gs === 'gpa') {
      if (pct >= 90) return { label: '4.0', color: 'var(--green)' };
      if (pct >= 80) return { label: '3.0', color: 'var(--blue)' };
      if (pct >= 70) return { label: '2.0', color: 'var(--accent)' };
      if (pct >= 60) return { label: '1.0', color: 'var(--accent2)' };
      return { label: '0.0', color: 'var(--red)' };
    }
    return { label: '—', color: 'var(--muted)' };
  }

  /* ══════════════════════════════════════════
     SINGLE ENTRY
  ══════════════════════════════════════════ */
  function updateMaxLabel() {
    document.getElementById('maxLabel').textContent = '/ ' + getInputMax();
  }

  function updatePreview() {
    updateMaxLabel();
    const v = parseFloat(document.getElementById('markInput').value);
    const prev = document.getElementById('preview');
    if (isNaN(v) || document.getElementById('markInput').value === '') {
      prev.classList.remove('show'); return;
    }
    const inputMax = getInputMax(), outputMax = getOutputMax();
    const conv = convert(v), pct = (v / inputMax) * 100, dec = getDecimals();
    const grade = getGrade(pct);
    document.getElementById('previewValue').textContent = conv.toFixed(dec);
    document.getElementById('previewFraction').textContent = `out of ${outputMax} · ${pct.toFixed(1)}%`;
    const gb = document.getElementById('previewGrade');
    if (document.getElementById('gradingSystem').value !== 'none') {
      gb.style.display = 'inline-block';
      gb.textContent = grade.label;
      gb.style.background = grade.color + '22';
      gb.style.color = grade.color;
      gb.style.border = '1px solid ' + grade.color + '55';
    } else { gb.style.display = 'none'; }
    document.getElementById('previewProg').style.width = Math.min(100, (v / inputMax) * 100) + '%';
    prev.classList.add('show');
    saveData();
  }

  function stepMark(delta) {
    const inp = document.getElementById('markInput');
    let val = parseFloat(inp.value) || 0;
    val = Math.max(0, Math.min(getInputMax(), val + delta));
    inp.value = val; updatePreview();
  }

  function handleMarkKey(e) {
    if (e.key === 'Enter') addStudent();
    if (e.key === 'ArrowUp') { e.preventDefault(); stepMark(1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); stepMark(-1); }
  }

  function handleNameKey(e) {
    if (e.key === 'Enter') document.getElementById('markInput').focus();
  }

  function addStudent() {
    const markRaw = document.getElementById('markInput').value;
    const mark = parseFloat(markRaw);
    const inputMax = getInputMax();
    if (markRaw === '' || isNaN(mark)) { showNotif('⚠️ Enter a mark first', '#f5a623'); return; }
    if (mark < 0 || mark > inputMax) { showNotif(`⚠️ Mark must be 0–${inputMax}`, '#f06a6a'); return; }
    const name = document.getElementById('studentName').value.trim() || `Student ${students.length + 1}`;
    const conv = convert(mark), pct = (mark / inputMax) * 100;
    if (editIndex >= 0) {
      students[editIndex] = { name, mark, converted: conv, pct, inputMax, outputMax: getOutputMax() };
      editIndex = -1;
      document.querySelector('#tab-single .btn-primary').textContent = '➕ Add Student';
      showNotif('✅ Updated!');
    } else {
      students.push({ name, mark, converted: conv, pct, inputMax, outputMax: getOutputMax() });
      showNotif('✅ Added — ' + name);
    }
    saveData(); clearEntry(false); refreshTable();
    document.getElementById('markInput').focus();
  }

  function clearEntry(focusName = true) {
    document.getElementById('markInput').value = '';
    document.getElementById('studentName').value = '';
    document.getElementById('preview').classList.remove('show');
    editIndex = -1;
    document.querySelector('#tab-single .btn-primary').textContent = '➕ Add Student';
    if (focusName) document.getElementById('studentName').focus();
  }

  function deleteStudent(i) {
    students.splice(i, 1); saveData(); refreshTable(); showNotif('🗑 Removed');
  }

  function editStudent(i) {
    const s = students[i];
    document.getElementById('studentName').value = s.name.startsWith('Student ') ? '' : s.name;
    document.getElementById('markInput').value = s.mark;
    editIndex = i;
    document.querySelector('#tab-single .btn-primary').textContent = '✏️ Update Student';
    updatePreview();
    document.getElementById('markInput').focus();
    document.getElementById('markInput').scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Switch to single tab
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-single').classList.add('active');
    document.querySelector('.tab-btn').classList.add('active');
  }

  function clearAll() {
    if (students.length === 0) return;
    if (!confirm('Clear all student records?')) return;
    students = []; saveData(); refreshTable(); showNotif('🗑 All cleared');
  }

  /* ══════════════════════════════════════════
     RESULTS TABLE
  ══════════════════════════════════════════ */
  function refreshTable() {
    renderStats();
    renderTable();
    document.getElementById('resultsSection').style.display = students.length > 0 ? 'block' : 'none';
  }

  function renderStats() {
    if (students.length === 0) return;
    const marks = students.map(s => s.converted);
    const avg = marks.reduce((a, b) => a + b, 0) / marks.length;
    const max = Math.max(...marks), min = Math.min(...marks);
    const pass = students.filter(s => s.pct >= 30).length;
    const dec = getDecimals();
    document.getElementById('statsRow').innerHTML = `
      <div class="stat-box"><div class="stat-label">Students</div><div class="stat-value" style="color:var(--blue)">${students.length}</div></div>
      <div class="stat-box"><div class="stat-label">Average</div><div class="stat-value" style="color:var(--accent)">${avg.toFixed(dec)}</div></div>
      <div class="stat-box"><div class="stat-label">Highest</div><div class="stat-value" style="color:var(--green)">${max.toFixed(dec)}</div></div>
      <div class="stat-box"><div class="stat-label">Lowest</div><div class="stat-value" style="color:var(--red)">${min.toFixed(dec)}</div></div>
      <div class="stat-box"><div class="stat-label">Pass (≥30%)</div><div class="stat-value" style="color:var(--green)">${pass}/${students.length}</div></div>
    `;
  }

  function renderTable() {
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const sort = document.getElementById('sortBy')?.value || 'entry';
    const dec = getDecimals();
    let list = students.map((s, i) => ({ ...s, _i: i }));
    if (search) list = list.filter(s => s.name.toLowerCase().includes(search));
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'mark_desc') list.sort((a, b) => b.converted - a.converted);
    else if (sort === 'mark_asc') list.sort((a, b) => a.converted - b.converted);
    const tbody = document.getElementById('tableBody');
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📭</div><p>${search ? 'No students match "' + search + '"' : 'No students yet. Add one above!'}</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = list.map((s, rank) => {
      const grade = getGrade(s.pct);
      const nameParts = search ? s.name.replace(new RegExp(`(${search})`, 'gi'), '<mark class="highlight">$1</mark>') : s.name;
      return `<tr>
        <td class="rank-cell">${rank + 1}</td>
        <td class="name-cell">${nameParts}</td>
        <td class="mark-cell">${s.mark} / ${s.inputMax}</td>
        <td class="conv-cell">${s.converted.toFixed(dec)} / ${s.outputMax}</td>
        <td class="mark-cell">${s.pct.toFixed(1)}%</td>
        <td><span class="grade-badge" style="background:${grade.color}22;color:${grade.color};border:1px solid ${grade.color}55;">${grade.label}</span></td>
        <td style="display:flex;gap:4px">
          <button class="edit-btn" onclick="editStudent(${s._i})" title="Edit">✏️</button>
          <button class="del-btn" onclick="deleteStudent(${s._i})" title="Delete">✕</button>
        </td>
      </tr>`;
    }).join('');
  }

  /* ══════════════════════════════════════════
     TEMPLATE DOWNLOAD
  ══════════════════════════════════════════ */
  function downloadTemplate(type) {
    const inputMax = getInputMax();

    if (type === 'csv') {
      const rows = [
        '# Alees Mark Converter — Bulk Upload Template',
        `# Instructions: Fill in StudentName and Mark columns. Max mark is ${inputMax}.`,
        '# Do NOT change the column headers in row 3.',
        'StudentName,Mark',
        'Ahmed Faaris,18',
        'Layla Hassan,15',
        'Omar Khalid,12',
        '# Add more rows below...',
      ];
      const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'alees_bulk_template.csv'; a.click();
      showNotif('📄 CSV template downloaded!');
      return;
    }

    if (type === 'xlsx') {
      const wb = XLSX.utils.book_new();

      // Data sheet
      const dataRows = [
        ['StudentName', 'Mark'],
        ['Ahmed Faaris', 18],
        ['Layla Hassan', 15],
        ['Omar Khalid', 12],
        ['Fatima Noor', 19],
        ['Zaid Siddiq', 10],
      ];
      const ws = XLSX.utils.aoa_to_sheet(dataRows);

      // Column widths
      ws['!cols'] = [{ wch: 28 }, { wch: 12 }];

      // Style header row (basic bold via XLSX utils)
      ws['A1'].s = { font: { bold: true }, fill: { fgColor: { rgb: 'F5A623' } } };
      ws['B1'].s = { font: { bold: true }, fill: { fgColor: { rgb: 'F5A623' } } };

      XLSX.utils.book_append_sheet(wb, ws, 'Marks');

      // Instructions sheet
      const instrRows = [
        ['Alees Mark Converter — Bulk Upload Instructions'],
        [''],
        ['COLUMN GUIDE:'],
        ['StudentName', 'Full name of the student (optional, can be left blank)'],
        ['Mark', `The student\'s raw mark (number between 0 and ${inputMax})`],
        [''],
        ['TIPS:'],
        ['• Do NOT change the column headers in row 1 of the Marks sheet.'],
        ['• You may add as many rows as needed.'],
        ['• Comment rows starting with # will be ignored.'],
        ['• Blank rows will be skipped automatically.'],
        ['• After filling, save the file and upload it in the Bulk Upload tab.'],
        [''],
        [`Current exam max mark: ${inputMax}`],
        [`Convert to: ${getOutputMax()}`],
      ];
      const wsInstr = XLSX.utils.aoa_to_sheet(instrRows);
      wsInstr['!cols'] = [{ wch: 30 }, { wch: 60 }];
      XLSX.utils.book_append_sheet(wb, wsInstr, 'Instructions');

      XLSX.writeFile(wb, 'alees_bulk_template.xlsx');
      showNotif('📊 Excel template downloaded!');
    }
  }

  /* ══════════════════════════════════════════
     BULK UPLOAD — FILE HANDLING
  ══════════════════════════════════════════ */
  function handleDragOver(e) { e.preventDefault(); document.getElementById('dropZone').classList.add('dragover'); }
  function handleDragLeave(e) { document.getElementById('dropZone').classList.remove('dragover'); }
  function handleDrop(e) {
    e.preventDefault();
    document.getElementById('dropZone').classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }
  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) processFile(file);
  }

  function processFile(file) {
    hideError();
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      showError('Unsupported file type. Please upload a .csv, .xlsx, or .xls file.'); return;
    }
    document.getElementById('fileNameLabel').textContent = '📎 ' + file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const wb = XLSX.read(data, { type: 'binary' });
        // Use first sheet (prefer 'Marks' if exists)
        let sheetName = wb.SheetNames[0];
        if (wb.SheetNames.includes('Marks')) sheetName = 'Marks';
        const ws = wb.Sheets[sheetName];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        parseRawData(raw, file.name);
      } catch (err) {
        showError('Could not read file: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  }

  function parseRawData(raw, filename) {
    // Skip comment rows & blank rows to find header
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(raw.length, 10); i++) {
      const row = raw[i];
      if (!row || row.length === 0) continue;
      const firstCell = String(row[0] || '').trim();
      if (firstCell.startsWith('#') || firstCell === '') continue;
      headerRowIdx = i; break;
    }

    if (headerRowIdx < 0) { showError('Could not find a header row in the file.'); return; }

    fileHeaders = raw[headerRowIdx].map(h => String(h).trim()).filter(h => h !== '');
    parsedRows = [];

    for (let i = headerRowIdx + 1; i < raw.length; i++) {
      const row = raw[i];
      if (!row || row.length === 0) continue;
      const firstCell = String(row[0] || '').trim();
      if (firstCell.startsWith('#')) continue;
      if (row.every(c => String(c).trim() === '')) continue;
      parsedRows.push(row);
    }

    if (parsedRows.length === 0) { showError('No data rows found after the header.'); return; }

    // Show preview section
    document.getElementById('previewSection').classList.add('show');
    document.getElementById('rowCountLabel').textContent = `${parsedRows.length} data rows found`;

    // Populate column selectors
    populateColSelects(fileHeaders);
  }

  function populateColSelects(headers) {
    const colName = document.getElementById('colName');
    const colMark = document.getElementById('colMark');
    colName.innerHTML = '<option value="-1">(No name column)</option>';
    colMark.innerHTML = '<option value="-1">— Select —</option>';

    headers.forEach((h, i) => {
      colName.innerHTML += `<option value="${i}">${h}</option>`;
      colMark.innerHTML += `<option value="${i}">${h}</option>`;
    });

    // Auto-detect
    const lh = headers.map(h => h.toLowerCase());
    const nameIdx = lh.findIndex(h => h.includes('name') || h.includes('student'));
    const markIdx = lh.findIndex(h => h.includes('mark') || h.includes('score') || h.includes('grade'));
    if (nameIdx >= 0) colName.value = nameIdx;
    if (markIdx >= 0) colMark.value = markIdx; else colMark.value = headers.length > 1 ? 1 : 0;

    renderPreviewTable();
  }

  function renderPreviewTable() {
    const nameCol = parseInt(document.getElementById('colName').value);
    const markCol = parseInt(document.getElementById('colMark').value);
    const inputMax = getInputMax();
    const tbody = document.getElementById('previewBody');

    let valid = 0, invalid = 0;

    const rows = parsedRows.map((row, idx) => {
      const name = nameCol >= 0 ? String(row[nameCol] || '').trim() : `Student ${idx + 1}`;
      const markRaw = markCol >= 0 ? row[markCol] : '';
      const mark = parseFloat(markRaw);
      const isValid = !isNaN(mark) && mark >= 0 && mark <= inputMax;
      if (isValid) valid++; else invalid++;

      const statusHtml = isValid
        ? `<span style="color:var(--green);font-weight:600">✓ Valid</span>`
        : `<span style="color:var(--red);font-weight:600">✗ ${isNaN(mark) ? 'Not a number' : mark < 0 ? 'Negative' : `Over max (${inputMax})`}</span>`;

      return `<tr class="${isValid ? '' : 'invalid-row'}">
        <td class="rank-cell">${idx + 1}</td>
        <td class="name-cell">${name || '<span style="color:var(--muted)">—</span>'}</td>
        <td class="mark-cell ${isValid ? '' : 'warn'}">${markRaw !== '' && markRaw !== undefined ? markRaw : '<span style="color:var(--muted)">—</span>'}</td>
        <td>${statusHtml}</td>
      </tr>`;
    });

    tbody.innerHTML = rows.join('');

    document.getElementById('importStats').innerHTML =
      `<span style="color:var(--green)">✓ ${valid} valid</span>${invalid > 0 ? ` &nbsp;·&nbsp; <span style="color:var(--red)">✗ ${invalid} will be skipped</span>` : ''}`;

    document.getElementById('importBtn').textContent = `✅ Import ${valid} Valid Row${valid !== 1 ? 's' : ''}`;
    document.getElementById('importBtn').disabled = valid === 0;
  }

  function importAll() {
    const nameCol = parseInt(document.getElementById('colName').value);
    const markCol = parseInt(document.getElementById('colMark').value);
    const inputMax = getInputMax();
    const outputMax = getOutputMax();

    const validRows = parsedRows.filter(row => {
      const mark = parseFloat(markCol >= 0 ? row[markCol] : '');
      return !isNaN(mark) && mark >= 0 && mark <= inputMax;
    });

    if (validRows.length === 0) { showError('No valid rows to import.'); return; }

    // Show progress
    const prog = document.getElementById('importProgress');
    const progBar = document.getElementById('importProgBar');
    const progLabel = document.getElementById('importProgressLabel');
    prog.classList.add('show');

    let i = 0;
    const total = validRows.length;

    const tick = () => {
      if (i >= total) {
        prog.classList.remove('show');
        saveData(); refreshTable();
        showNotif(`✅ Imported ${total} student${total !== 1 ? 's' : ''}!`);
        clearUpload();
        // Scroll to results
        setTimeout(() => document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
        return;
      }
      const row = validRows[i];
      const name = nameCol >= 0 ? (String(row[nameCol] || '').trim() || `Student ${students.length + 1}`) : `Student ${students.length + 1}`;
      const mark = parseFloat(row[markCol]);
      const conv = convert(mark);
      const pct = (mark / inputMax) * 100;
      students.push({ name, mark, converted: conv, pct, inputMax, outputMax });
      i++;
      const pct2 = Math.round((i / total) * 100);
      progBar.style.width = pct2 + '%';
      progLabel.textContent = `Importing… ${i} / ${total}`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function clearUpload() {
    parsedRows = []; fileHeaders = [];
    document.getElementById('previewSection').classList.remove('show');
    document.getElementById('fileInput').value = '';
    document.getElementById('errorBanner').classList.remove('show');
    document.getElementById('importProgress').classList.remove('show');
  }

  function showError(msg) {
    const b = document.getElementById('errorBanner');
    b.textContent = '⚠️ ' + msg; b.classList.add('show');
  }
  function hideError() { document.getElementById('errorBanner').classList.remove('show'); }

  /* ══════════════════════════════════════════
     EXPORT
  ══════════════════════════════════════════ */
  function exportCSV() {
    const dec = getDecimals();
    let csv = 'No.,Name,Original Mark,Input Max,Converted Mark,Output Max,Percentage,Grade\n';
    students.forEach((s, i) => {
      const grade = getGrade(s.pct);
      csv += `${i+1},"${s.name}",${s.mark},${s.inputMax},${s.converted.toFixed(dec)},${s.outputMax},${s.pct.toFixed(1)}%,${grade.label}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'alees_marks.csv'; a.click();
    showNotif('📁 CSV downloaded!');
  }

  function exportXLSX() {
    const dec = getDecimals();
    const wb = XLSX.utils.book_new();

    // Results sheet
    const dataRows = [
      ['No.', 'Student Name', 'Original Mark', 'Input Max', 'Converted Mark', 'Output Max', 'Percentage', 'Grade']
    ];
    students.forEach((s, i) => {
      const grade = getGrade(s.pct);
      dataRows.push([
        i + 1, s.name, s.mark, s.inputMax,
        parseFloat(s.converted.toFixed(dec)), s.outputMax,
        parseFloat(s.pct.toFixed(1)) + '%', grade.label
      ]);
    });

    // Add stats rows
    const marks = students.map(s => s.converted);
    const avg = marks.reduce((a, b) => a + b, 0) / marks.length;
    dataRows.push([]);
    dataRows.push(['', 'Average', '', '', parseFloat(avg.toFixed(dec))]);
    dataRows.push(['', 'Highest', '', '', parseFloat(Math.max(...marks).toFixed(dec))]);
    dataRows.push(['', 'Lowest', '', '', parseFloat(Math.min(...marks).toFixed(dec))]);
    dataRows.push(['', 'Pass (≥30%)', '', '', students.filter(s => s.pct >= 30).length + ' / ' + students.length]);

    const ws = XLSX.utils.aoa_to_sheet(dataRows);
    ws['!cols'] = [
      { wch: 5 }, { wch: 28 }, { wch: 14 }, { wch: 12 },
      { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 8 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Results');

    XLSX.writeFile(wb, 'alees_marks.xlsx');
    showNotif('📊 Excel file downloaded!');
  }

  function copyText() {
    const dec = getDecimals();
    let text = `Alees Mark Converter — Results\nInput: /${getInputMax()} → Output: /${getOutputMax()}\n\n`;
    students.forEach((s, i) => {
      const grade = getGrade(s.pct);
      text += `${i+1}. ${s.name}: ${s.mark}/${s.inputMax} → ${s.converted.toFixed(dec)}/${s.outputMax} (${s.pct.toFixed(1)}%) ${grade.label}\n`;
    });
    navigator.clipboard.writeText(text).then(() => showNotif('📋 Copied!'));
  }

  /* ══════════════════════════════════════════
     PRINT
  ══════════════════════════════════════════ */
  function printResults() {
    const dec = getDecimals(), inputMax = getInputMax(), outputMax = getOutputMax();
    const gs = document.getElementById('gradingSystem').value;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
    const marks = students.map(s => s.converted);
    const avg = marks.reduce((a,b)=>a+b,0)/marks.length;
    const highest = Math.max(...marks), lowest = Math.min(...marks);
    const pass = students.filter(s=>s.pct>=30).length, fail = students.length - pass;
    const rows = students.map((s, i) => {
      const grade = getGrade(s.pct), status = s.pct >= 30 ? 'Pass' : 'Fail';
      return `<tr class="${i%2===0?'even':'odd'}">
        <td class="center">${i+1}</td><td>${s.name}</td>
        <td class="center">${s.mark} / ${s.inputMax}</td>
        <td class="center bold">${s.converted.toFixed(dec)} / ${s.outputMax}</td>
        <td class="center">${s.pct.toFixed(1)}%</td>
        <td class="center">${gs!=='none' ? grade.label : '—'}</td>
        <td class="center ${status.toLowerCase()}">${status}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Alees Mark Converter — Print</title>
<style>
@page{size:A4 portrait;margin:18mm 15mm 20mm 15mm}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Times New Roman',Times,serif;font-size:11pt;color:#000;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page-header{display:block;width:100%;border-bottom:2px solid #000;padding-bottom:8pt;margin-bottom:14pt}
.header-top{display:flex;align-items:flex-end;justify-content:space-between}
.header-title{font-size:20pt;font-weight:700;letter-spacing:-0.5pt;line-height:1.1}
.header-sub{font-size:9pt;color:#444;margin-top:2pt}
.header-meta{text-align:right;font-size:9pt;color:#333;line-height:1.7}
.section-title{font-size:10pt;font-weight:700;text-transform:uppercase;letter-spacing:1.2pt;border-bottom:1px solid #000;padding-bottom:3pt;margin-bottom:10pt;margin-top:16pt}
.stats-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8pt;margin-bottom:16pt}
.stat-box{border:1px solid #ccc;border-radius:3pt;padding:8pt 6pt;text-align:center}
.stat-label{font-size:7.5pt;color:#555;text-transform:uppercase;letter-spacing:0.5pt;margin-bottom:3pt}
.stat-value{font-size:16pt;font-weight:700}
.conv-bar{display:flex;border:1px solid #ccc;border-radius:3pt;overflow:hidden;margin-bottom:16pt;font-size:9.5pt}
.conv-bar-item{flex:1;padding:7pt 10pt;border-right:1px solid #ccc}
.conv-bar-item:last-child{border-right:none}
.conv-bar-label{font-size:7.5pt;color:#666;text-transform:uppercase;margin-bottom:2pt}
.conv-bar-val{font-weight:700;font-size:11pt}
table{width:100%;border-collapse:collapse;font-size:10pt;page-break-inside:auto}
thead{display:table-header-group}
tfoot{display:table-footer-group}
tr{page-break-inside:avoid}
thead tr{background:#000!important;color:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
th{padding:7pt 8pt;text-align:left;font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.6pt;color:#fff}
td{padding:6pt 8pt;border-bottom:1px solid #ddd;vertical-align:middle}
tr.even td{background:#f8f8f8}
tr.odd td{background:#fff}
.center{text-align:center}.bold{font-weight:700}
.pass{font-weight:600}.fail{font-weight:600;font-style:italic}
.page-footer{margin-top:20pt;border-top:1px solid #bbb;padding-top:6pt;display:flex;justify-content:space-between;font-size:8pt;color:#555}
.formula-note{font-size:8.5pt;color:#444;border:1px dashed #bbb;border-radius:3pt;padding:6pt 10pt;margin-top:12pt;background:#fafafa}
</style></head><body>
<div class="page-header"><div class="header-top"><div><div class="header-title">Alees Mark Converter</div><div class="header-sub">Official Student Mark Conversion Report</div></div>
<div class="header-meta"><div>Date: <strong>${dateStr}</strong></div><div>Time: <strong>${timeStr}</strong></div><div>Total Students: <strong>${students.length}</strong></div></div></div></div>
<div class="section-title">Conversion Configuration</div>
<div class="conv-bar">
<div class="conv-bar-item"><div class="conv-bar-label">Exam Max Mark</div><div class="conv-bar-val">${inputMax}</div></div>
<div class="conv-bar-item"><div class="conv-bar-label">Converted To</div><div class="conv-bar-val">${outputMax}</div></div>
<div class="conv-bar-item"><div class="conv-bar-label">Conversion Ratio</div><div class="conv-bar-val">${(outputMax/inputMax).toFixed(4)}&times;</div></div>
<div class="conv-bar-item"><div class="conv-bar-label">Grading System</div><div class="conv-bar-val" style="text-transform:capitalize">${gs==='none'?'None':gs}</div></div>
<div class="conv-bar-item"><div class="conv-bar-label">Decimal Places</div><div class="conv-bar-val">${dec}</div></div>
</div>
<div class="formula-note"><strong>Formula:</strong>&nbsp;Converted = (Original &divide; ${inputMax}) &times; ${outputMax}</div>
<div class="section-title" style="margin-top:18pt">Summary Statistics</div>
<div class="stats-grid">
<div class="stat-box"><div class="stat-label">Students</div><div class="stat-value">${students.length}</div></div>
<div class="stat-box"><div class="stat-label">Average</div><div class="stat-value">${avg.toFixed(dec)}</div></div>
<div class="stat-box"><div class="stat-label">Highest</div><div class="stat-value">${highest.toFixed(dec)}</div></div>
<div class="stat-box"><div class="stat-label">Lowest</div><div class="stat-value">${lowest.toFixed(dec)}</div></div>
<div class="stat-box"><div class="stat-label">Pass / Fail</div><div class="stat-value">${pass} / ${fail}</div></div>
</div>
<div class="section-title">Student Results</div>
<table><thead><tr><th style="width:32pt">#</th><th>Student Name</th><th style="width:70pt" class="center">Original</th><th style="width:70pt" class="center">Converted</th><th style="width:48pt" class="center">Percent</th><th style="width:40pt" class="center">Grade</th><th style="width:40pt" class="center">Status</th></tr></thead>
<tbody>${rows}</tbody>
<tfoot><tr><td colspan="7" style="padding:6pt 8pt;border-top:2px solid #000;font-size:8pt;color:#444;text-align:right">End of Report | Alees Mark Converter | ${dateStr}</td></tr></tfoot></table>
<div class="page-footer"><span>Generated by Alees Mark Converter</span><span>Conversion: ${inputMax} &rarr; ${outputMax} | Pass Rate: ${students.length>0?((pass/students.length)*100).toFixed(1):0}%</span><span>${dateStr}, ${timeStr}</span></div>
<script>window.onload=()=>window.print();<\/script></body></html>`;
    const w = window.open('', '_blank', 'width=900,height=700');
    w.document.write(html); w.document.close();
  }

  /* ══════════════════════════════════════════
     NOTIFICATIONS
  ══════════════════════════════════════════ */
  function showNotif(msg, color) {
    const n = document.getElementById('notif');
    n.textContent = msg;
    n.style.background = color || 'var(--green)';
    n.style.color = '#000';
    n.classList.add('show');
    setTimeout(() => n.classList.remove('show'), 2400);
  }