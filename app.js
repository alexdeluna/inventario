// Configuração Supabase (Substitua pelas suas chaves)
const _supabase = supabase.createClient('SUA_URL_SUPABASE', 'SUA_KEY_ANON');

// 1. CAPTURA DE GPS
async function getGeo() {
    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(pos => {
            resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }, () => resolve({ lat: null, lng: null }));
    });
}

// 2. OCR COM IA (Tesseract.js)
async function startOCR() {
    const video = document.getElementById('camera-preview');
    video.style.display = 'block';
    // Lógica para capturar frame do vídeo e passar para Tesseract.recognize()
    // Após detectar: document.getElementById('serie').value = result.data.text;
}

// 3. VALIDAÇÃO DE DUPLICIDADE & SALVAMENTO
document.getElementById('inventory-form').onsubmit = async (e) => {
    e.preventDefault();
    const serie = document.getElementById('serie').value;
    const tombamento = document.getElementById('tombamento').value;

    // Verificar duplicidade no Supabase
    const { data: existente } = await _supabase
        .from('inventario')
        .select('setor, operador_id')
        .or(`numero_serie.eq.${serie},numero_tombamento.eq.${tombamento}`)
        .single();

    if (existente) {
        alert(`ALERTA: Equipamento já cadastrado no setor ${existente.setor}!`);
        return;
    }

    const geo = await getGeo();
    const payload = {
        setor: document.getElementById('setor').value,
        numero_serie: serie,
        latitude: geo.lat,
        longitude: geo.lng,
        data_registro: new Date().toISOString()
    };

    // Tenta enviar ou salva no IndexedDB se offline
    if (navigator.onLine) {
        await _supabase.from('inventario').insert([payload]);
        alert("Cadastrado com sucesso!");
    } else {
        saveToIndexedDB(payload);
        alert("Salvo localmente (Offline). Sincronizará ao conectar.");
    }
};

// Registro do Service Worker para PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}
