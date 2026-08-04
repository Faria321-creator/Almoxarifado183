// ==========================================
// CONFIGURAÇÃO DO SUPABASE
// ==========================================
const SUPABASE_URL = 'https://tocmqlsicxuxfkiptgaj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvY21xbHNpY3h1eGZraXB0Z2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNTIyODEsImV4cCI6MjA5OTYyODI4MX0.B-UKh4qMQG02guuJhIlI-ZB0d4OjlByFyfOoGISiqMY'
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// VERIFICAÇÃO DE USUÁRIO LOGADO
// ==========================================
async function verificarSessao() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
        // Se não tiver sessão ativa, volta para o login
        window.location.href = 'login.html';
    } else {
        console.log("Usuário logado:", session.user.email);
        const elementoResponsavel = document.getElementById('responsavelNome');
        if (elementoResponsavel) {
            elementoResponsavel.textContent = `Operador: ${session.user.email}`;
        }
    }
}

// Chame após inicializar o supabaseClient
verificarSessao();

let inventario = [];
let abaAtiva = 'busca'; 
let filtroCategoriaAtivo = 'Todos';

let fotoFileCadastro = null;
let fotoFileEdicao = null;

// ==========================================
// UPLOAD DE FOTO PARA O STORAGE DO SUPABASE
// ==========================================
// ==========================================
// UPLOAD DE FOTO CORRIGIDO PARA O SUPABASE
// ==========================================
// ==========================================
// UPLOAD DE FOTO COM CONVERSÃO AUTOMÁTICA
// ==========================================
async function uploadFotoParaSupabase(file) {
    if (!file) return null;

    // Função que converte HEIC/PNG/qualquer formato para JPEG leve
    const converterParaJpeg = (arquivo) => {
        return new Promise((resolve) => {
            if (typeof Compressor === 'undefined') {
                resolve(arquivo); // Fallback caso a biblioteca não carregue
                return;
            }

            new Compressor(arquivo, {
                quality: 0.8,             // Mantém ótima qualidade visual
                mimeType: 'image/jpeg',   // Converte HEIC/PNG para JPG universal
                maxWidth: 1200,           // Redimensiona para não pesar no banco
                maxHeight: 1200,
                success(resultado) {
                    resolve(resultado);
                },
                error(err) {
                    console.warn("Erro na conversão, enviando original:", err);
                    resolve(arquivo);
                },
            });
        });
    };

    try {
        // 1. Processa a foto (converte HEIC para JPG)
        const fotoPronta = await converterParaJpeg(file);

        // 2. Garante o nome final em .jpg
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

        // 3. Envia para o Supabase Storage
        const { data, error } = await supabaseClient
            .storage
            .from('fotos')
            .upload(fileName, fotoPronta, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // 4. Pega o Link Público da imagem
        const { data: publicUrlData } = supabaseClient
            .storage
            .from('fotos')
            .getPublicUrl(fileName);

        return publicUrlData.publicUrl;

    } catch (err) {
        console.error("Falha ao subir imagem para o Storage:", err);
        alert("Aviso: Não foi possível enviar a foto. O item será cadastrado sem imagem.");
        return null;
    }
}
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
                fotoFileCadastro = file;
                // Cria uma miniatura temporária na tela usando URL do objeto local
                const objectUrl = URL.createObjectURL(file);
                document.getElementById('previewCadastro').innerHTML = `<img src="${objectUrl}" alt="Preview" style="max-width:100px; border-radius:4px;">`;
            }
        });
    }

    if (editFotoInput) {
        editFotoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                fotoFileEdicao = file;
                const objectUrl = URL.createObjectURL(file);
                document.getElementById('edit-preview').innerHTML = `<img src="${objectUrl}" alt="Preview" style="max-width:100px; border-radius:4px;">`;
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
        
        const botoesAcao = `
            <button class="btn-editar" onclick="abrirModalEdicao('${item.id}')">✏️ Editar</button>
            <button class="btn-excluir" onclick="removerItemDoInventario('${item.id}')">🗑️ Excluir</button>
            <button class="btn-acao btn-duplicar" onclick="duplicarItem('${item.id}')" title="Duplicar Item">📋 Duplicar</button>
        `;

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

    let urlFoto = null;

    // Se o usuário tirou ou escolheu uma foto no celular
    if (fotoFileCadastro) {
        // Envia direto o arquivo da foto para o Storage do Supabase
        urlFoto = await uploadFotoParaSupabase(fotoFileCadastro);
    }

    const novoItem = {
        categoria,
        codigo,
        marca,
        modelo,
        sn,
        quantidade,
        local,
        observacoes,
        foto: urlFoto
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
        if (document.getElementById('previewCadastro')) {
            document.getElementById('previewCadastro').innerHTML = '';
        }
        fotoFileCadastro = null;

        alert('Item cadastrado com sucesso!');
        
        await carregarDadosDoBanco();
        mudarAba('busca');

    } catch (error) {
        console.error("Erro ao cadastrar item:", error.message);
        alert("Erro ao salvar no banco de dados.");
    }
}

// ==========================================
// MODAL DE EDIÇÃO E SALVAMENTO CORRIGIDOS
// ==========================================

function abrirModalEdicao(idItem) {
    // Usa String() para comparar sem ter problema de texto vs número
    const item = inventario.find(i => String(i.id) === String(idItem));

    if (!item) {
        console.error("Item não encontrado no inventário para o ID:", idItem);
        alert("Erro: Item não encontrado no sistema.");
        return;
    }

    // Preenche os campos do formulário modal de edição
    document.getElementById('edit-id').value = item.id;
    document.getElementById('edit-categoria').value = item.categoria || 'Outros';
    document.getElementById('edit-codigo').value = item.codigo || '';
    document.getElementById('edit-marca').value = item.marca || '';
    document.getElementById('edit-modelo').value = item.modelo || '';
    document.getElementById('edit-sn').value = item.sn || '';
    document.getElementById('edit-quantidade').value = item.quantidade || 1;
    document.getElementById('edit-local').value = item.local || '';
    document.getElementById('edit-observacoes').value = item.observacoes || '';
    
    // Limpa input de arquivo anterior
    if (document.getElementById('edit-fotoInput')) {
        document.getElementById('edit-fotoInput').value = '';
    }
    fotoFileEdicao = null;

    // Pré-visualização da foto existente
    const previewContainer = document.getElementById('edit-preview');
    if (previewContainer) {
        if (item.foto) {
            previewContainer.innerHTML = `<img src="${item.foto}" alt="Preview" style="max-width:100px; border-radius:4px;">`;
        } else {
            previewContainer.innerHTML = `<span class="sem-foto-icon">📷</span>`;
        }
    }

    // Exibe o modal na tela adicionando a classe 'active'
    const modal = document.getElementById('modalEditar');
    if (modal) {
        modal.classList.add('active');
    } else {
        console.error("Elemento #modalEditar não foi encontrado no HTML!");
    }
}

async function salvarEdicaoItem() {
    const idItem = document.getElementById('edit-id').value;
    const itemAtual = inventario.find(i => String(i.id) === String(idItem));

    let urlFoto = itemAtual ? itemAtual.foto : null;

    // Se uma nova foto foi selecionada no modal, faz o upload
    if (fotoFileEdicao) {
        urlFoto = await uploadFotoParaSupabase(fotoFileEdicao);
    }

    const dadosAtualizados = {
        categoria: document.getElementById('edit-categoria').value,
        codigo: document.getElementById('edit-codigo').value.trim(),
        marca: document.getElementById('edit-marca').value.trim(),
        modelo: document.getElementById('edit-modelo').value.trim(),
        sn: document.getElementById('edit-sn').value.trim() || 'S/N',
        quantidade: parseInt(document.getElementById('edit-quantidade').value) || 0,
        local: document.getElementById('edit-local').value.trim(),
        observacoes: document.getElementById('edit-observacoes').value.trim(),
        foto: urlFoto
    };

    try {
        const { error } = await supabaseClient
            .from('inventario')
            .update(dadosAtualizados)
            .eq('id', idItem);

        if (error) throw error;

        fecharModal();
        alert('Item atualizado com sucesso!');
        await carregarDadosDoBanco();

    } catch (error) {
        console.error("Erro ao atualizar item:", error.message);
        alert("Erro ao atualizar informações: " + error.message);
    }
}

async function removerItemDoInventario(idItem) {
    if (confirm("Tem certeza que deseja excluir este item do inventário?")) {
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

// ... seus códigos e funções anteriores ...


// ==========================================
// GERAR RELATÓRIO EM PDF DO INVENTÁRIO
// ==========================================
function gerarRelatorioPDF() {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const tabelaOriginal = document.querySelector("table");
    if (!tabelaOriginal) {
        alert("Nenhuma tabela encontrada para gerar o relatório.");
        return;
    }

    const elementoRelatorio = document.createElement("div");
    elementoRelatorio.style.padding = "20px";
    elementoRelatorio.style.fontFamily = "Arial, sans-serif";

    elementoRelatorio.innerHTML = `
        <div style="text-align: center; border-bottom: 2px solid #1a73e8; padding-bottom: 10px; margin-bottom: 20px;">
            <h1 style="margin: 0; color: #1a73e8; font-size: 22px;">Almoxarifado - Relatório de Estoque</h1>
            <p style="margin: 5px 0 0 0; color: #555; font-size: 12px;">Gerado em: ${dataAtual} às ${horaAtual}</p>
        </div>
        ${tabelaOriginal.outerHTML}
    `;

    // Remove botões de ação para não saírem no PDF
    const botoesAcao = elementoRelatorio.querySelectorAll(".btn-acao, th:last-child, td:last-child");
    botoesAcao.forEach(el => el.remove());

    const opcoes = {
        margin: [10, 10, 10, 10],
        filename: `Relatorio_Estoque_${dataAtual.replace(/\//g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opcoes).from(elementoRelatorio).save();
}
// ==========================================
// FUNÇÃO PARA DUPLICAR UM ITEM DO ALMOXARIFADO
// ==========================================
async function duplicarItem(id) {
    // 1. Procura o item no array 'inventario' pelo ID
    const itemOriginal = inventario.find(item => String(item.id) === String(id));

    if (!itemOriginal) {
        alert("Erro ao encontrar o item para duplicar.");
        return;
    }

    // 2. Preenche os campos da tela de CADASTRO com os dados existentes
    document.getElementById("categoria").value = itemOriginal.categoria || "Outros";
    document.getElementById("codigo").value = itemOriginal.codigo || "";
    document.getElementById("marca").value = itemOriginal.marca || "";
    document.getElementById("modelo").value = itemOriginal.modelo || "";
    document.getElementById("sn").value = itemOriginal.sn ? `${itemOriginal.sn} (CÓPIA)` : "S/N";
    document.getElementById("quantidade").value = itemOriginal.quantidade || 1;
    document.getElementById("local").value = itemOriginal.local || "";
    document.getElementById("observacoes").value = itemOriginal.observacoes || "";

    // 3. Prepara a pré-visualização da foto existente (se houver)
    const previewContainer = document.getElementById("previewCadastro");
    if (previewContainer) {
        if (itemOriginal.foto) {
            previewContainer.innerHTML = `
                <img src="${itemOriginal.foto}" id="imgPreviewDuplicada" style="max-width: 100px; max-height: 100px; border-radius: 4px; margin-top: 8px;">
                <p style="font-size: 11px; color: #666; margin: 2px 0 0 0;">Mantendo foto do item original</p>
            `;
            // Armazena a foto base64/URL na memória do preview
            previewContainer.dataset.fotoBase64 = itemOriginal.foto;
        } else {
            previewContainer.innerHTML = "";
            delete previewContainer.dataset.fotoBase64;
        }
    }

    // 4. Alterna automaticamente para a aba de cadastro
    if (typeof mudarAba === "function") {
        mudarAba("cadastro");
    }

    // 5. Rola a tela suavemente para o topo do formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
// ==========================================
// FUNÇÃO DE LOGOUT
// ==========================================
async function fazerLogout() {
    if (confirm("Deseja realmente sair do sistema?")) {
        await supabaseClient.auth.signOut();
        window.location.href = 'login.html';
    }
}
