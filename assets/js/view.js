class AttendanceView {
    constructor() {
        this.els = {
            dbStatus: document.getElementById('dbStatus'),
            studentList: document.getElementById('studentListContainer'),
            counter: document.getElementById('counter'),
            historyList: document.getElementById('historyList'),
            dbTableBody: document.getElementById('databaseTableBody'),
            dbSelectionCount: document.getElementById('dbSelectionCount'),
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
            if (item) {
                const opt = document.createElement('option');
                opt.value = item;
                opt.textContent = item;
                select.appendChild(opt);
            }
        });
        if (selectedValue && items.includes(selectedValue)) select.value = selectedValue;
    }

    populatePrintSelect(classes) {
        const select = this.els.selects.printCursoPeriodo;
        if (!select) return;

        const current = select.value;
        select.innerHTML = '<option value="all">Todas as Turmas Cadastradas</option>';

        classes.forEach(c => {
            const val = `${c.curso}|${c.periodo}`;
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = `${c.curso} - Período ${c.periodo}`;
            select.appendChild(opt);
        });

        if (current && Array.from(select.options).some(o => o.value === current)) {
            select.value = current;
        }
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
            this.els.studentList.appendChild(div);
        });
    }

    updateAttendanceCounter(count) {
        this.els.counter.textContent = `${count} presentes`;
    }

    renderHistory(records, onDelete, onDownload, onToggleType) {
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
                       ${dia}/${mes}/${ano} - ${rec.course || 'DSM'} <span style="color:#666">Período ${rec.period}</span>
                    </div>
                    <div style="margin-top:6px; display:flex; align-items:center; gap:10px;">
                        <span class="tag ${rec.type === 'Entrada' ? 'entrada' : 'saida'}" id="type-${rec.id}">
                            ${rec.type} <i class="fas fa-sync-alt" style="font-size:0.7rem; margin-left:4px; opacity:0.5"></i>
                        </span>
                        <span style="font-size:0.85rem; color:#666;">
                            ${rec.presentRAs.length} alunos
                        </span>
                    </div>
                </div>
                <div>
                   <button class="btn btn-outline btn-sm btn-download"><i class="fas fa-download"></i></button>
                   <button class="btn btn-outline btn-sm btn-delete" style="color:red; border-color:#fee2e2"><i class="fas fa-trash"></i></button>
                </div>
            `;

            div.querySelector('.tag').onclick = () => onToggleType(rec.id);
            div.querySelector('.btn-download').onclick = () => onDownload(rec.id);
            div.querySelector('.btn-delete').onclick = () => onDelete(rec.id);

            this.els.historyList.appendChild(div);
        });
    }

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

    // --- GERAÇÃO DE PDF (Atualizada com correções) ---
    async generatePDF(listsData, dateStr, type) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        const cpsRed = [178, 0, 0];
        const black = [0, 0, 0];

        // Pega as imagens do DOM
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

        // Lógica de Proporção (Aspect Ratio)
        const calculateDims = (img, fixedHeight) => {
            if (!img || img.naturalWidth === 0) return { w: 40, h: fixedHeight }; // Fallback
            const ratio = img.naturalWidth / img.naturalHeight;
            return { w: fixedHeight * ratio, h: fixedHeight };
        };

        const cpsDims = calculateDims(imgCps, 15); // Altura fixa de 15mm
        const govDims = calculateDims(imgGov, 15);

        const [a, m, d] = dateStr.split('-');
        const dataFormatada = `${d}/${m}/${a}`;

        listsData.forEach((list, index) => {
            if (index > 0) doc.addPage();

            // Logos (Posicionados com largura dinâmica para não distorcer)
            if (logoCpsData) doc.addImage(logoCpsData, 'PNG', 10, 10, cpsDims.w, cpsDims.h);

            // Logo do governo alinhado à direita (287mm é a margem direita aprox)
            if (logoGovData) doc.addImage(logoGovData, 'PNG', 287 - govDims.w, 10, govDims.w, govDims.h);

            // Cabeçalho Centralizado
            const centerX = 148.5; // Metade da folha A4 paisagem (297mm / 2)

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(...cpsRed);
            doc.text('LISTA DE PRESENÇA', centerX, 18, { align: 'center' });

            doc.setFontSize(11); // Fonte levemente menor
            doc.setTextColor(...black);
            doc.text(`Curso: ${list.curso} - Período: ${list.periodo}`, centerX, 25, { align: 'center' });

            // Linha com Data, Tipo e Quantidade
            const infoLine = `Data: ${dataFormatada}   |   Tipo: ${type}   |   Qtd: ${list.students.length} alunos`;
            doc.text(infoLine, centerX, 31, { align: 'center' });

            // Linha divisória fina
            doc.setDrawColor(...cpsRed);
            doc.setLineWidth(0.5);
            doc.line(10, 36, 287, 36);

            // Tabela Compacta
            const bodyData = list.students.map(s => [s.ra, s.nome, '']);

            doc.autoTable({
                startY: 40,
                head: [['RA', 'NOME DO ALUNO', 'ASSINATURA']],
                body: bodyData,
                theme: 'grid',
                headStyles: {
                    fillColor: cpsRed,
                    textColor: 255,
                    halign: 'center',
                    fontSize: 10, // Fonte do cabeçalho
                    cellPadding: 2
                },
                styles: {
                    fontSize: 9, // Fonte menor para economizar espaço
                    cellPadding: 1.5, // Menos "gordura" nas células
                    valign: 'middle',
                    lineColor: [200, 200, 200],
                    lineWidth: 0.1
                },
                columnStyles: {
                    0: { cellWidth: 35, halign: 'center' }, // RA
                    1: { cellWidth: 100 }, // Nome
                    2: { cellWidth: 'auto' } // Assinatura
                },
                didParseCell: function (data) {
                    // Altura da linha reduzida para 8.5mm (suficiente para assinar, mas econômico)
                    if (data.section === 'body') {
                        data.row.height = 8.5;
                    }
                },
                // Margem inferior para não bater no rodapé se a lista for longa
                margin: { bottom: 15 }
            });

            // Rodapé
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(`Centro Paula Souza - Governo do Estado de São Paulo`, centerX, 202, { align: 'center' });
        });

        doc.save(`Listas_Presenca_${dateStr}_${type}.pdf`);
    }
}