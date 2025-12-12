class AttendanceModel {
    constructor() {
        this.DB = {
            students: [],
            attendance: []
        };
        this.load();
    }

    load() {
        try {
            const saved = localStorage.getItem('chamada_db_v3');
            if (saved) {
                this.DB = JSON.parse(saved);
                // Migração: garante que registros antigos tenham array de logs
                this.DB.attendance.forEach(r => {
                    if (!r.logs) r.logs = [{ action: 'Importado/Criado', time: r.timestamp }];
                });
            }
        } catch (e) {
            console.error("Erro ao carregar dados locais:", e);
            this.DB = { students: [], attendance: [] };
        }
    }

    save() {
        localStorage.setItem('chamada_db_v3', JSON.stringify(this.DB));
    }

    // --- ALUNOS ---
    addStudents(newStudents) {
        const map = new Map();
        this.DB.students.forEach(s => map.set(s.ra, s));
        newStudents.forEach(s => map.set(s.ra, s));
        this.DB.students = Array.from(map.values());
        this.save();
    }

    // Nova função manual com validação
    addStudentManual(ra, nome, curso, periodo) {
        if (this.DB.students.some(s => s.ra === ra)) {
            return { success: false, message: 'RA já cadastrado!' };
        }
        this.DB.students.push({ ra, nome, curso, periodo });
        this.save();
        return { success: true };
    }

    deleteStudent(ra) {
        this.DB.students = this.DB.students.filter(s => s.ra !== ra);
        this.save();
    }

    deleteBulkStudents(raList) {
        this.DB.students = this.DB.students.filter(s => !raList.includes(s.ra));
        this.save();
    }

    updateStudent(ra, data) {
        const student = this.DB.students.find(s => s.ra === ra);
        if (student) {
            student.nome = data.nome || student.nome;
            student.curso = data.curso || student.curso;
            student.periodo = data.periodo || student.periodo;
            this.save();
        }
    }

    // --- CHAMADA (Lógica Atualizada) ---

    // UPSERT: Atualiza se existir, Cria se não
    saveAttendanceRecord(recordData) {
        const { date, course, period, type, presentRAs } = recordData;

        const existingIndex = this.DB.attendance.findIndex(r =>
            r.date === date &&
            r.period === period &&
            r.course === course &&
            r.type === type
        );

        const now = new Date().toLocaleString('pt-BR');

        if (existingIndex >= 0) {
            // ATUALIZAR
            const record = this.DB.attendance[existingIndex];
            record.presentRAs = presentRAs;
            record.logs.push({ action: 'Atualizado (Sobrescrito)', time: now });
            this.save();
            return { action: 'updated', id: record.id };
        } else {
            // CRIAR NOVO
            const newRecord = {
                id: Date.now(),
                date, course, period, type, presentRAs,
                timestamp: new Date().toISOString(),
                logs: [{ action: 'Criado', time: now }]
            };
            this.DB.attendance.push(newRecord);
            this.save();
            return { action: 'created', id: newRecord.id };
        }
    }

    getRecordById(id) {
        return this.DB.attendance.find(r => r.id === id);
    }

    // Atualiza lista via edição no Histórico
    updateAttendanceList(id, newPresentRAs) {
        const record = this.getRecordById(id);
        if (record) {
            record.presentRAs = newPresentRAs;
            record.logs.push({ action: 'Editado Manualmente (Histórico)', time: new Date().toLocaleString('pt-BR') });
            this.save();
        }
    }

    removeAttendance(id) {
        this.DB.attendance = this.DB.attendance.filter(r => r.id !== id);
        this.save();
    }

    // --- GETTERS ---
    getStudents(filter = {}) {
        return this.DB.students.filter(s => {
            let match = true;
            if (filter.curso) match = match && s.curso === filter.curso;
            if (filter.periodo) match = match && String(s.periodo) === String(filter.periodo);
            if (filter.search) {
                const term = filter.search.toLowerCase();
                match = match && (s.nome.toLowerCase().includes(term) || String(s.ra).includes(term));
            }
            return match;
        }).sort((a, b) => a.nome.localeCompare(b.nome));
    }

    getAllCourses() {
        return [...new Set(this.DB.students.map(s => s.curso))].sort();
    }

    getAllPeriods(course = null) {
        let list = this.DB.students;
        if (course) list = list.filter(s => s.curso === course);
        return [...new Set(list.map(s => s.periodo))].sort();
    }

    getUniqueClasses() {
        const classes = new Set();
        this.DB.students.forEach(s => classes.add(`${s.curso}|${s.periodo}`));
        return Array.from(classes).map(str => {
            const [curso, periodo] = str.split('|');
            return { curso, periodo };
        }).sort((a, b) => {
            if (a.curso !== b.curso) return a.curso.localeCompare(b.curso);
            return a.periodo.localeCompare(b.periodo, undefined, { numeric: true });
        });
    }

    getAttendanceHistory(filter = {}) {
        let records = [...this.DB.attendance].reverse();
        if (filter.period) records = records.filter(r => String(r.period) === String(filter.period));
        if (filter.search) {
            const term = filter.search.toLowerCase();
            records = records.filter(r => {
                const [y, m, d] = r.date.split('-');
                const str = `${d}/${m}/${y} ${r.course} ${r.period} ${r.type}`.toLowerCase();
                return str.includes(term);
            });
        }
        return records;
    }

    checkDuplicity(date, course, period, type) {
        return this.DB.attendance.some(r =>
            r.date === date && r.period === period && r.course === course && r.type === type
        );
    }

    clearAll() {
        this.DB = { students: [], attendance: [] };
        localStorage.removeItem('chamada_db_v3');
    }
}