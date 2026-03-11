const SUPABASE_URL = 'https://wzpaanrwayvkxiqpbblu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R901IMT2sfdRFf4ARo6qkA_3Geb8l0m';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById('form-inventario');
const btnSalvar = document.getElementById('btn-salvar');
const statusMsg = document.getElementById('status');

// Função de Salvar
form.onsubmit = async (e) => {
    e.preventDefault();
    
    btnSalvar.disabled = true;
    statusMsg.innerText = "Verificando e salvando...";

    const dados = {
        setor: document.getElementById('setor').value,
        tipo: document.getElementById('tipo').value,
        numero_serie: document.getElementById('serie').value,
        numero_tombamento: document.getElementById('tombamento').value,
        observacao: document.getElementById('obs').value
    };

    const { data, error } = await _supabase
        .from('inventario')
        .insert([dados])
        .select('codigo_inventario')
        .single();

    console.log("Resultado:", data, "Erro:", error);


    
    if (error) {
        if (error.code === '23505') {
            alert("ERRO: Este Número de Série ou Tombamento já existe no banco!");
        } else {
            alert("Erro: " + error.message);
        }
        statusMsg.innerText = "Erro ao processar.";
    } else {
        alert(`SUCESSO! Gerado código: ${data.codigo_inventario}`);
        statusMsg.innerText = `Último item: ${data.codigo_inventario}`;
        form.reset();
    }
    btnSalvar.disabled = false;
};

// Função Única de Exportação
async function exportar(formato) {
    statusMsg.innerText = "Buscando dados para exportação...";
    
    const { data, error } = await _supabase
        .from('inventario')
        .select('*')
        .order('id', { ascending: true });

    if (error) return alert("Erro ao baixar dados: " + error.message);
    if (data.length === 0) return alert("Banco de dados vazio.");

    if (formato === 'excel') {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Inventario");
        XLSX.writeFile(wb, "Inventario_Geral.xlsx");
    } else {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4'); // Horizontal para caber mais colunas
        doc.text("Relatório Geral de Inventário", 14, 10);
        
        const head = [["Código", "Setor", "Tipo", "Série", "Tombamento", "Data"]];
        const body = data.map(i => [i.codigo_inventario, i.setor, i.tipo, i.numero_serie, i.numero_tombamento, new Date(i.data_registro).toLocaleDateString()]);
        
        doc.autoTable({ head, body, startY: 15 });
        doc.save("Relatorio_Inventario.pdf");
    }
    statusMsg.innerText = "Exportação concluída.";
}

