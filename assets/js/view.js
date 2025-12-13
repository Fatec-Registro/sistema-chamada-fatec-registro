class AttendanceView {
    constructor() {
        this.els = {
            dbStatus: document.getElementById('dbStatus'),
            studentList: document.getElementById('studentListContainer'),
            counter: document.getElementById('counter'),
            historyList: document.getElementById('historyList'),
            dbTableBody: document.getElementById('databaseTableBody'),
            dbSelectionCount: document.getElementById('dbSelectionCount'),
            modal: document.getElementById('appModal'),
            modalTitle: document.getElementById('modalTitle'),
            modalBody: document.getElementById('modalBody'),
            modalActionBtn: document.getElementById('modalActionBtn'),
            selects: {
                chamadaCurso: document.getElementById('chamadaCurso'),
                chamadaPeriodo: document.getElementById('chamadaPeriodo'),
                manageCurso: document.getElementById('manageCurso'),
                managePeriodo: document.getElementById('managePeriodo'),
                historyFilter: document.getElementById('historyFilterPeriod'),
                printCursoPeriodo: document.getElementById('printCursoPeriodo')
            }
        };
    }

    updateStatus(count) {
        this.els.dbStatus.textContent = count > 0 ? `${count} Alunos na Base` : 'Base Vazia';
    }

    populateSelect(elementId, items, selectedValue = null) {
        const select = document.getElementById(elementId);
        if (!select) return;
        const firstText = select.options[0] ? select.options[0].text : 'Selecione...';
        select.innerHTML = `<option value="">${firstText}</option>`;
        items.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item;
            opt.textContent = item;
            select.appendChild(opt);
        });
        if (selectedValue && items.includes(selectedValue)) select.value = selectedValue;
    }

    populatePrintSelect(classes) {
        const select = this.els.selects.printCursoPeriodo;
        if (!select) return;
        select.innerHTML = '<option value="all">Todas as Turmas Cadastradas</option>';
        classes.forEach(c => {
            const val = `${c.curso}|${c.periodo}`;
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = `${c.curso} - Período ${c.periodo}`;
            select.appendChild(opt);
        });
    }

    renderStudentList(students) {
        this.els.studentList.innerHTML = '';
        if (students.length === 0) {
            this.els.studentList.innerHTML = '<div class="empty-state">Nenhum aluno encontrado.</div>';
            return;
        }
        students.forEach(student => {
            const div = document.createElement('div');
            div.className = 'student-item';
            div.innerHTML = `
                <input type="checkbox" value="${student.ra}" data-name="${student.nome}" class="attendance-check" style="margin-right:12px; transform:scale(1.2)">
                <div style="display:flex; flex-direction:column">
                    <span style="font-weight:bold; color:var(--cps-grey)">${student.nome}</span>
                    <span style="font-size:0.75rem; color:#888">RA: ${student.ra}</span>
                </div>
            `;

            // UX: Clique na linha inteira para marcar
            div.addEventListener('click', (e) => {
                if (e.target.type === 'checkbox') return;
                const checkbox = div.querySelector('.attendance-check');
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            });

            this.els.studentList.appendChild(div);
        });
    }

    updateAttendanceCounter(count) {
        this.els.counter.textContent = `${count} presentes`;
    }

    // --- HISTÓRICO COM NOVOS BOTÕES ---
    renderHistory(records, actions) {
        this.els.historyList.innerHTML = '';
        if (records.length === 0) {
            this.els.historyList.innerHTML = '<p style="text-align:center; padding:20px;">Nenhum histórico encontrado.</p>';
            return;
        }

        records.forEach(rec => {
            const [ano, mes, dia] = rec.date.split('-');
            const div = document.createElement('div');
            div.className = 'history-card student-item';
            div.style.justifyContent = 'space-between';

            div.innerHTML = `
                <div>
                    <div style="font-weight:bold; color:var(--cps-black);">
                       ${dia}/${mes}/${ano} - ${rec.course} <span style="color:#666">Período ${rec.period}</span>
                    </div>
                    <div style="margin-top:6px; display:flex; align-items:center; gap:10px;">
                        <span class="tag ${rec.type === 'Entrada' ? 'entrada' : 'saida'}">
                            ${rec.type}
                        </span>
                        <span style="font-size:0.85rem; color:#666;">
                            ${rec.presentRAs.length} presentes
                        </span>
                    </div>
                </div>
                <div style="display:flex; gap:5px;">
                   <button class="btn btn-outline btn-sm btn-view" title="Ver/Logs"><i class="fas fa-eye"></i></button>
                   <button class="btn btn-outline btn-sm btn-edit-hist" title="Editar"><i class="fas fa-edit"></i></button>
                   <button class="btn btn-outline btn-sm btn-download" title="Baixar TXT"><i class="fas fa-download"></i></button>
                   <button class="btn btn-outline btn-sm btn-delete" style="color:red; border-color:#fee2e2"><i class="fas fa-trash"></i></button>
                </div>
            `;

            div.querySelector('.btn-view').onclick = () => actions.onView(rec.id);
            div.querySelector('.btn-edit-hist').onclick = () => actions.onEdit(rec.id);
            div.querySelector('.btn-download').onclick = () => actions.onDownload(rec.id);
            div.querySelector('.btn-delete').onclick = () => actions.onDelete(rec.id);

            this.els.historyList.appendChild(div);
        });
    }

    // --- MODAL LOGIC ---
    openModal(title) {
        this.els.modalTitle.textContent = title;
        this.els.modal.classList.add('open');
        this.els.modalActionBtn.style.display = 'none';
    }

    closeModal() {
        this.els.modal.classList.remove('open');
    }

    // Modal de Pré-visualização
    renderPreviewModal(record, studentNames) {
        this.openModal(`Detalhes da Chamada - ${record.date}`);
        let html = `
            <div style="margin-bottom:15px; padding:10px; background:#f8fafc; border-radius:6px;">
                <strong>Curso:</strong> ${record.course} | <strong>Período:</strong> ${record.period} | <strong>Tipo:</strong> ${record.type}
            </div>
            <h4>Alunos Presentes (${studentNames.length})</h4>
            <ul style="max-height:200px; overflow-y:auto; padding-left:20px; margin-bottom:20px;">
                ${studentNames.map(name => `<li>${name}</li>`).join('')}
            </ul>
            <h4>Histórico de Alterações</h4>
            <div style="background:#fff; border:1px solid #eee; border-radius:6px; padding:5px;">
        `;

        if (record.logs && record.logs.length > 0) {
            record.logs.forEach(log => {
                html += `<div class="log-entry"><strong>${log.action}</strong> <small>${log.time}</small></div>`;
            });
        } else {
            html += `<div class="log-entry">Sem registros de log.</div>`;
        }

        html += `</div>`;
        this.els.modalBody.innerHTML = html;
    }

    // Modal de Edição
    renderEditModal(record, allStudents, onSave) {
        this.openModal(`Editar Chamada - ${record.date}`);

        this.els.modalActionBtn.style.display = 'block';
        this.els.modalActionBtn.textContent = 'Salvar Alterações';
        this.els.modalActionBtn.onclick = onSave;

        let html = `
            <div style="margin-bottom:10px;">Marque ou desmarque os alunos:</div>
            <div id="editListContainer" style="max-height:300px; overflow-y:auto; border:1px solid black; padding:10px; border-radius:6px;">
        `;

        allStudents.forEach(s => {
            const isPresent = record.presentRAs.includes(s.ra);
            html += `
                <div class="student-item" style="padding:5px;">
                    <label style="display:flex; align-items:center; width:100%; cursor:pointer;">
                        <input type="checkbox" class="edit-check" value="${s.ra}" ${isPresent ? 'checked' : ''}>
                        <span style="margin-left:8px">${s.nome}</span>
                    </label>
                </div>
            `;
        });
        html += `</div>`;
        this.els.modalBody.innerHTML = html;
    }

    // --- DB TABLE & PDF ---
    renderDatabaseTable(students, onEdit, onDelete, onSelect) {
        const tbody = this.els.dbTableBody;
        tbody.innerHTML = '';
        if (students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Nada encontrado.</td></tr>';
            return;
        }
        students.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="checkbox" class="db-check" value="${s.ra}"></td>
                <td>${s.ra}</td>
                <td>${s.nome}</td>
                <td>${s.curso}</td>
                <td>${s.periodo}</td>
                <td class="text-right">
                    <button class="btn btn-outline btn-sm btn-edit"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm btn-del"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tr.querySelector('.db-check').onchange = onSelect;
            tr.querySelector('.btn-edit').onclick = () => onEdit(s.ra);
            tr.querySelector('.btn-del').onclick = () => onDelete(s.ra);
            tbody.appendChild(tr);
        });
    }

    updateDbSelectionCount(count) {
        this.els.dbSelectionCount.textContent = `${count} selecionados`;
    }

    toggleTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
        const target = document.getElementById(`tab-${tabId}`);
        if (target) target.classList.add('active');
        const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (btn) btn.classList.add('active');
    }

    async generatePDF(listsData, dateStr, type) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const cpsRed = [178, 0, 0];
        const black = [0, 0, 0];
        const imgCps = document.querySelector('.logo-cps');
        const imgGov = document.querySelector('.logo-gov');

        const getBase64Image = (img) => {
            if (!img) return null;
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            return canvas.toDataURL("image/png");
        };

        const logoCpsData = getBase64Image(imgCps);
        const logoGovData = getBase64Image(imgGov);

        // Ajuste de proporção
        const calculateDims = (img, fixedHeight) => {
            if (!img || img.naturalWidth === 0) return { w: 40, h: fixedHeight };
            const ratio = img.naturalWidth / img.naturalHeight;
            return { w: fixedHeight * ratio, h: fixedHeight };
        };
        const cpsDims = calculateDims(imgCps, 15);
        const govDims = calculateDims(imgGov, 15);

        const [a, m, d] = dateStr.split('-');
        const dataFormatada = `${d}/${m}/${a}`;

        listsData.forEach((list, index) => {
            if (index > 0) doc.addPage();
            if (logoCpsData) doc.addImage(logoCpsData, 'PNG', 10, 10, cpsDims.w, cpsDims.h);
            if (logoGovData) doc.addImage(logoGovData, 'PNG', 287 - govDims.w, 10, govDims.w, govDims.h);

            const centerX = 148.5;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(...cpsRed);
            doc.text('LISTA DE PRESENÇA', centerX, 18, { align: 'center' });
            doc.setFontSize(11);
            doc.setTextColor(...black);
            doc.text(`Curso: ${list.curso} - Período: ${list.periodo}`, centerX, 25, { align: 'center' });
            const infoLine = `Data: ${dataFormatada}   |   Tipo: ${type}   |   Qtd: ${list.students.length} alunos`;
            doc.text(infoLine, centerX, 31, { align: 'center' });
            doc.setDrawColor(...cpsRed);
            doc.setLineWidth(0.5);
            doc.line(10, 36, 287, 36);

            const bodyData = list.students.map(s => [s.ra, s.nome, '']);
            doc.autoTable({
                startY: 40,
                head: [['RA', 'NOME DO ALUNO', 'ASSINATURA']],
                body: bodyData,
                theme: 'grid',
                headStyles: { fillColor: cpsRed, textColor: 255, halign: 'center', fontSize: 10, cellPadding: 2 },
                styles: {
                    fontSize: 9,
                    cellPadding: 1.5,
                    valign: 'middle',
                    lineColor: [0, 0, 0], // Cor da borda: Preto
                    lineWidth: 0.1,
                    textColor: [0, 0, 0]  // Cor do texto: Preto (NOVO)
                },
                columnStyles: { 0: { cellWidth: 35, halign: 'center' }, 1: { cellWidth: 100 }, 2: { cellWidth: 'auto' } },
                didParseCell: function (data) { if (data.section === 'body') { data.row.height = 8.5; } },
                margin: { bottom: 15 }
            });
            doc.setFontSize(8);
            doc.setTextColor(0);
            doc.text(`Centro Paula Souza - Governo do Estado de São Paulo`, centerX, 202, { align: 'center' });
        });
        doc.save(`Listas_Presenca_${dateStr}_${type}.pdf`);
    }
}

// Global para fechar modal
window.closeModal = () => document.getElementById('appModal').classList.remove('open');