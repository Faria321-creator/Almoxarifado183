// ==========================================
// CONFIGURAÇÃO DO SUPABASE
// ==========================================
const SUPABASE_URL = 'https://tocmqlsicxuxfkiptgaj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvY21xbHNpY3h1eGZraXB0Z2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNTIyODEsImV4cCI6MjA5OTYyODI4MX0.B-UKh4qMQG02guuJhIlI-ZB0d4OjlByFyfOoGISiqMY';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let inventario = [];
let abaAtiva = 'busca'; 
let filtroCategoriaAtivo = 'Todos';

let fotoBase64Cadastro = null;
let fotoBase64Edicao = null;

// ==========================================
// INICIALIZAÇÃO E CARREGAMENTO DE DADOS
// ==========================================

async function carregarDadosDoBanco() {
    try {
        const { data, error } = await supabaseClient
            .from('inventario')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        inventario = data || [];
        renderizarTabela();
    } catch (error) {
        console.error("Erro ao carregar dados do Supabase:", error.message);
        alert("Erro ao conectar com o banco de dados.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const fotoInput = document.getElementById('fotoInput');
    const editFotoInput = document.getElementById('edit-fotoInput');

    if (fotoInput) {
        fotoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    const img = new Image();
                    img.onload = function() {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 600;
                        const scaleSize = MAX_WIDTH / img.width;
                        canvas.width = MAX_WIDTH;
                        canvas.height = img.height * scaleSize;

                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        
                        fotoBase64Cadastro = canvas.toDataURL('image/jpeg', 0.7);
                        document.getElementById('previewCadastro').innerHTML = `<img src="${fotoBase64Cadastro}" alt="Preview" style="max-width:100px; border-radius:4px;">`;
                    };
                    img.src = evt.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (editFotoInput) {
        editFotoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    const img = new Image();
                    img.onload = function() {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 600;
                        const scaleSize = MAX_WIDTH / img.width;
                        canvas.width = MAX_WIDTH;
                        canvas.height = img.height * scaleSize;

                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        
                        fotoBase64Edicao = canvas.toDataURL('image/jpeg', 0.7);
                        document.getElementById('edit-preview').innerHTML = `<img src="${fotoBase64Edicao}" alt="Preview" style="max-width:100px; border-radius:4px;">`;
                    };
                    img.src = evt.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    carregarDadosDoBanco();
});

// ==========================================
// FUNÇÕES DE INTERFACE
// ==========================================

function mudarAba(aba) {
    abaAtiva = aba;
    document.getElementById('tab-busca').classList.remove('active');
    document.getElementById('tab-cadastro').classList.remove('active');
    document.getElementById('aba-pesquisa-conteudo').classList.remove('active');
    document.getElementById('aba-cadastro-conteudo').classList.remove('active');

    if (aba === 'busca') {
        document.getElementById('tab-busca').classList.add('active');
        document.getElementById('aba-pesquisa-conteudo').classList.add('active');
    } else {
        document.getElementById('tab-cadastro').classList.add('active');
        document.getElementById('aba-cadastro-conteudo').classList.add('active');
    }
    renderizarTabela();
}

function filtrarPorCategoria(categoria) {
    filtroCategoriaAtivo = categoria;
    const itensMenu = document.querySelectorAll('#listaCategorias li');
    itensMenu.forEach(li => {
        li.classList.remove('active');
        if (li.textContent.includes(categoria) || (categoria === 'Todos' && li.textContent === 'Todos os Itens')) {
            li.classList.add('active');
        }
    });
    renderizarTabela();
}

function executarBusca() {
    renderizarTabela();
}

function renderizarTabela() {
    const corpoTabela = document.getElementById('corpoTabela');
    const avisoVazio = document.getElementById('avisoVazio');
    const buscaTexto = (document.getElementById('buscaRapida')?.value || '').toLowerCase();

    if (!corpoTabela) return;
    corpoTabela.innerHTML = '';

    const itensFiltrados = inventario.filter(item => {
        const atendeCategoria = (filtroCategoriaAtivo === 'Todos' || item.categoria === filtroCategoriaAtivo);
        const atendeBusca = 
            (item.codigo || '').toLowerCase().includes(buscaTexto) ||
            (item.marca || '').toLowerCase().includes(buscaTexto) ||
            (item.modelo || '').toLowerCase().includes(buscaTexto) ||
            (item.sn || '').toLowerCase().includes(buscaTexto) ||
            (item.local || '').toLowerCase().includes(buscaTexto) ||
            (item.observacoes || '').toLowerCase().includes(buscaTexto);

        return atendeCategoria && atendeBusca;
    });

    if (itensFiltrados.length === 0) {
        if (avisoVazio) avisoVazio.style.display = 'block';
        return;
    }

    if (avisoVazio) avisoVazio.style.display = 'none';

    itensFiltrados.forEach(item => {
        const tr = document.createElement('tr');
        
        const botoesAcao = `<button class="btn-editar" onclick="abrirModalEdicao(${item.id})">✏️ Editar</button>
                            <button class="btn-excluir" onclick="removerItemDoInventario(${item.id})">Excluir</button>`;

        const tdFoto = item.foto 
            ? `<td><img src="${item.foto}" class="miniatura-tabela" onclick="abrirFotoGrande('${item.foto}')" alt="Foto" style="width:40px; height:40px; object-fit:cover; border-radius:4px; cursor:pointer;"></td>`
            : `<td style="text-align:center;"><span class="sem-foto-icon">📷</span></td>`;

        tr.innerHTML = `
            ${tdFoto}
            <td><span class="badge-categoria">${item.categoria}</span></td>
            <td><strong>${item.codigo}</strong></td>
            <td>${item.marca}</td>
            <td>${item.modelo}</td>
            <td><code>${item.sn}</code></td>
            <td><strong>${item.quantidade}</strong></td>
            <td><span class="badge-local">📍 ${item.local}</span></td>
            <td>${item.observacoes || ''}</td>
            <td class="txt-centro">${botoesAcao}</td>
        `;
        corpoTabela.appendChild(tr);
    });
}

// ==========================================
// OPERAÇÕES DO BANCO DE DADOS (CRUD)
// ==========================================

async function cadastrarNovoItem() {
    const categoria = document.getElementById('categoria').value;
    const codigo = document.getElementById('codigo').value.trim();
    const marca = document.getElementById('marca').value.trim();
    const modelo = document.getElementById('modelo').value.trim();
    const sn = document.getElementById('sn').value.trim() || 'S/N';
    const quantidade = parseInt(document.getElementById('quantidade').value) || 1;
    const local = document.getElementById('local').value.trim();
    const observacoes = document.getElementById('observacoes').value.trim();

    const novoItem = {
        categoria,
        codigo,
        marca,
        modelo,
        sn,
        quantidade,
        local,
        observacoes,
        foto: fotoBase64Cadastro
    };

    try {
        const { data, error } = await supabaseClient
            .from('inventario')
            .insert([novoItem])
            .select();

        if (error) throw error;

        document.getElementById('codigo').value = '';
        document.getElementById('marca').value = '';
        document.getElementById('modelo').value = '';
        document.getElementById('sn').value = '';
        document.getElementById('quantidade').value = '1';
        document.getElementById('local').value = '';
        document.getElementById('observacoes').value = '';
        document.getElementById('fotoInput').value = '';
        document.getElementById('previewCadastro').innerHTML = '';
        fotoBase64Cadastro = null;

        alert('Item cadastrado com sucesso na Nuvem!');
        
        await carregarDadosDoBanco();
        mudarAba('busca');

    } catch (error) {
        console.error("Erro ao cadastrar item:", error.message);
        alert("Erro ao salvar no banco de dados.");
    }
}

function abrirModalEdicao(idItem) {
    const item = inventario.find(i => i.id === idItem);
    if (!item) return;

    document.getElementById('edit-id').value = item.id;
    document.getElementById('edit-categoria').value = item.categoria;
    document.getElementById('edit-codigo').value = item.codigo;
    document.getElementById('edit-marca').value = item.marca;
    document.getElementById('edit-modelo').value = item.modelo;
    document.getElementById('edit-sn').value = item.sn;
    document.getElementById('edit-quantidade').value = item.quantidade;
    document.getElementById('edit-local').value = item.local;
    document.getElementById('edit-observacoes').value = item.observacoes || '';
    
    document.getElementById('edit-fotoInput').value = '';
    fotoBase64Edicao = item.foto;
    if (item.foto) {
        document.getElementById('edit-preview').innerHTML = `<img src="${item.foto}" alt="Preview" style="max-width:100px; border-radius:4px;">`;
    } else {
        document.getElementById('edit-preview').innerHTML = `<span class="sem-foto-icon">📷</span>`;
    }

    document.getElementById('modalEditar').classList.add('active');
}

function fecharModal() {
    document.getElementById('modalEditar').classList.remove('active');
}

async function salvarEdicaoItem() {
    const idItem = parseInt(document.getElementById('edit-id').value);

    const dadosAtualizados = {
        categoria: document.getElementById('edit-categoria').value,
        codigo: document.getElementById('edit-codigo').value.trim(),
        marca: document.getElementById('edit-marca').value.trim(),
        modelo: document.getElementById('edit-modelo').value.trim(),
        sn: document.getElementById('edit-sn').value.trim() || 'S/N',
        quantidade: parseInt(document.getElementById('edit-quantidade').value) || 0,
        local: document.getElementById('edit-local').value.trim(),
        observacoes: document.getElementById('edit-observacoes').value.trim(),
        foto: fotoBase64Edicao
    };

    try {
        const { error } = await supabaseClient
            .from('inventario')
            .update(dadosAtualizados)
            .eq('id', idItem);

        if (error) throw error;

        fecharModal();
        alert('Item atualizado com sucesso na Nuvem!');
        await carregarDadosDoBanco();

    } catch (error) {
        console.error("Erro ao atualizar item:", error.message);
        alert("Erro ao atualizar informações.");
    }
}

async function removerItemDoInventario(idItem) {
    if (confirm("Tem certeza que deseja excluir este item do inventário em nuvem?")) {
        try {
            const { error } = await supabaseClient
                .from('inventario')
                .delete()
                .eq('id', idItem);

            if (error) throw error;

            alert("Item removido!");
            await carregarDadosDoBanco();

        } catch (error) {
            console.error("Erro ao deletar item:", error.message);
            alert("Erro ao excluir.");
        }
    }
}

// ==========================================
// ZOOM DE FOTOS
// ==========================================
function abrirFotoGrande(src) {
    document.getElementById('imgGrande').src = src;
    document.getElementById('modalFotoGrande').classList.add('active');
}

function fecharFotoGrande() {
    document.getElementById('modalFotoGrande').classList.remove('active');
}