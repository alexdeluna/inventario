const SUPABASE_URL = 'https://wzpaanrwayvkxiqpbblu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cGFhbnJ3YXl2a3hpcXBiYmx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzY2NDksImV4cCI6MjA4ODgxMjY0OX0.s-rMsbWCJUhv3z_O0zPA_2_yBy6ATJOEuLf1VqYMxjA';

let _supabase;

function inicializarSupabase() {
    // Tenta encontrar 'supabase' ou 'window.supabase'
    const supabaseLib = window.supabase || supabase;

    if (supabaseLib) {
        _supabase = supabaseLib.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("✅ Banco Conectado!");
        document.getElementById('status').innerText = "Sistema Online - Pronto.";
    } else {
        console.log("⏳ Aguardando biblioteca...");
        setTimeout(inicializarSupabase, 500);
    }
}

inicializarSupabase();

// Inicia o processo de conexão
inicializarSupabase();

// 3. LÓGICA DO FORMULÁRIO (SALVAR)
const form = document.getElementById('form-inventario');
const btnSalvar = document.getElementById('btn-salvar');

if (form) {
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        if (!_supabase) {
            alert("O banco de dados ainda não conectou. Verifique sua internet.");
            return;
        }

        btnSalvar.disabled = true;
        const statusMsg = document.getElementById('status');
        statusMsg.innerText = "Salvando registro...";

        const dados = {
            setor: document.getElementById('setor').value,
            tipo: document.getElementById('tipo').value,
            numero_serie: document.getElementById('serie').value,
            numero_tombamento: document.getElementById('tombamento').value,
            observacao: document.getElementById('obs').value
        };

        // Inserção no Supabase
        const { data, error } = await _supabase
            .from('inventario')
            .insert([dados])
            .select('codigo_inventario')
            .single();

        if (error) {
            if (error.code === '23505') {
                alert("ERRO: Este Número de Série ou Tombamento já existe no banco!");
            } else {
                console.error("Erro Supabase:", error);
                alert("Erro ao salvar: " + error.message);
            }
            statusMsg.innerText = "Erro ao processar.";
        } else {
            alert(`SUCESSO! Registro guardado como: ${data.codigo_inventario}`);
            statusMsg.innerText = `Último item: ${data.codigo_inventario}`;
            form.reset();
        }
        btnSalvar.disabled = false;
    };
}

// 4. LÓGICA DE EXPORTAÇÃO (EXCEL E PDF)
async function exportar(formato) {
    if (!_supabase) return alert("Banco não conectado!");
    
    document.getElementById('status').innerText = "Buscando dados...";
    
    const { data, error } = await _supabase
        .from('inventario')
        .select('*')
        .order('id', { ascending: true });

    if (error) return alert("Erro ao baixar dados: " + error.message);
    if (!data || data.length === 0) return alert("Não há dados para exportar.");

    if (formato === 'excel') {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Inventário Geral");
        XLSX.writeFile(wb, "Relatorio_Inventario.xlsx");
    } else {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.text("Inventário de Equipamentos - Órgão Público", 14, 10);
        
        const head = [["Código", "Setor", "Tipo", "Série", "Tombamento", "Data"]];
        const body = data.map(i => [
            i.codigo_inventario, 
            i.setor, 
            i.tipo, 
            i.numero_serie, 
            i.numero_tombamento, 
            new Date(i.data_registro).toLocaleDateString()
        ]);
        
        doc.autoTable({ head, body, startY: 15, theme: 'grid' });
        doc.save("Relatorio_Inventario.pdf");
    }
    document.getElementById('status').innerText = "Concluído.";
}


