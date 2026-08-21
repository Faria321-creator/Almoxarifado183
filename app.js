// CONFIGURAÇÃO DO SUPABASE
const SUPABASE_URL = "https://tocmqlsicxuxfkiptgaj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvY21xbHNpY3h1eGZraXB0Z2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNTIyODEsImV4cCI6MjA5OTYyODI4MX0.B-UKh4qMQG02guuJhIlI-ZB0d4OjlByFyfOoGISiqMY"; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let listaEquipamentos = [];

// 1. CARREGAR EQUIPAMENTOS DO BANCO DE DADOS
async function carregarEstoque() {
    try {
        const { data: equipamentos, error } = await _supabase
            .from('equipamentos')
            .select('*');

        if (error) {
            console.error("Erro ao buscar equipamentos:", error.message);
            return;
        }

        listaEquipamentos = equipamentos || [];
        renderizarTabela(listaEquipamentos);
    } catch (err) {
        console.error("Erro de conexão:", err);
    }
}

// 2. RENDERIZAR A TABELA NA TELA
function renderizarTabela(dados) {
    const tbody = document.querySelector("#tabelaEstoque tbody") || document.querySelector("tbody");
    if (!tbody) return;

    if (!dados || dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px;">Nenhum item encontrado no estoque.</td></tr>`;
        return;
    }

    let html = "";
    dados.forEach(item => {
        html += `
            <tr>
                <td><strong>${item.patrimonio || ''}</strong></td>
                <td>${item.classe || ''}</td>
                <td>${item.fabricante || ''}</td>
                <td>${item.modelo || ''}</td>
                <td>${item.num_serie || ''}</td>
                <td><span class="badge" style="background:#e2e8f0; padding: 4px 8px; border-radius:4px;">📍 ${item.codigo_local || 'Sem Local'}</span></td>
                <td>${item.status || 'Em Almoxarifado'}</td>
                <td>
                    <button onclick="preencherFormularioEdicao('${item.patrimonio}')" style="background:#ffc107; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">✏️ Editar</button>
                    <button onclick="excluirEquipamento('${item.patrimonio}')" style="background:#dc3545; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">🗑️ Excluir</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// 3. SALVAR / EDITAR ITEM NO SUPABASE
async function salvarEquipamento(event) {
    if (event) event.preventDefault();

    const patrimonio = document.getElementById("patrimonio")?.value.trim();
    if (!patrimonio) {
        alert("O campo Patrimônio é obrigatório!");
        return;
    }

    const novoItem = {
        patrimonio: patrimonio,
        classe: document.getElementById("classe")?.value.trim() || '',
        fabricante: document.getElementById("fabricante")?.value.trim() || '',
        modelo: document.getElementById("modelo")?.value.trim() || '',
        num_serie: document.getElementById("num_serie")?.value.trim() || '',
        codigo_local: document.getElementById("codigo_local")?.value.trim() || '',
        status: document.getElementById("status")?.value || 'Em Almoxarifado'
    };

    const { error } = await _supabase
        .from('equipamentos')
        .upsert(novoItem, { onConflict: 'patrimonio' });

    if (error) {
        alert("Erro ao salvar no banco: " + error.message);
    } else {
        alert("✅ Item salvo com sucesso no banco de dados!");
        limparFormulario();
        carregarEstoque();
    }
}

// 4. PREENCHER FORMULÁRIO PARA EDIÇÃO
function preencherFormularioEdicao(patrimonio) {
    const item = listaEquipamentos.find(i => i.patrimonio === patrimonio);
    if (!item) return;

    if (document.getElementById("patrimonio")) document.getElementById("patrimonio").value = item.patrimonio || '';
    if (document.getElementById("classe")) document.getElementById("classe").value = item.classe || '';
    if (document.getElementById("fabricante")) document.getElementById("fabricante").value = item.fabricante || '';
    if (document.getElementById("modelo")) document.getElementById("modelo").value = item.modelo || '';
    if (document.getElementById("num_serie")) document.getElementById("num_serie").value = item.num_serie || '';
    if (document.getElementById("codigo_local")) document.getElementById("codigo_local").value = item.codigo_local || '';
    if (document.getElementById("status")) document.getElementById("status").value = item.status || 'Em Almoxarifado';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 5. EXCLUIR ITEM DO SUPABASE
async function excluirEquipamento(patrimonio) {
    if (!confirm(`Deseja realmente excluir o item ${patrimonio}?`)) return;

    const { error } = await _supabase
        .from('equipamentos')
        .delete()
        .eq('patrimonio', patrimonio);

    if (error) {
        alert("Erro ao excluir: " + error.message);
    } else {
        alert("Item excluído com sucesso!");
        carregarEstoque();
    }
}

function limparFormulario() {
    const form = document.querySelector("form");
    if (form) form.reset();
}

// Inicia o carregamento quando a página abre
document.addEventListener('DOMContentLoaded', carregarEstoque);
