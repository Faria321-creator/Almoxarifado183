// CONFIGURAÇÃO DO SUPABASE
const SUPABASE_URL = "https://tocmqlsicxuxfkiptgaj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvY21xbHNpY3h1eGZraXB0Z2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNTIyODEsImV4cCI6MjA5OTYyODI4MX0.B-UKh4qMQG02guuJhIlI-ZB0d4OjlByFyfOoGISiqMY"; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let listaEquipamentos = [];

// 1. CARREGAR EQUIPAMENTOS DO SUPABASE
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

// 2. RENDERIZAR A TABELA MANTENDO O DESIGN ORIGINAL
function renderizarTabela(dados) {
    const tbody = document.querySelector("#tabelaEstoque tbody") || document.querySelector("tbody");
    if (!tbody) return;

    if (!dados || dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 20px;">Nenhum item encontrado no estoque.</td></tr>`;
        return;
    }

    let html = "";
    dados.forEach(item => {
        html += `
            <tr>
                <td style="text-align:center;"><span style="font-size:1.2rem;">📷</span></td>
                <td><span class="badge-cat">${item.classe || 'Geral'}</span></td>
                <td><strong>${item.patrimonio || ''}</strong></td>
                <td>${item.fabricante || ''}</td>
                <td>${item.modelo || ''}</td>
                <td>${item.num_serie || ''}</td>
                <td style="text-align:center;"><strong>1</strong></td>
                <td><span class="badge-setor">📍 ${item.codigo_local || '1 Sala / 183'}</span></td>
                <td>
                    <div style="display:flex; gap:4px; flex-direction:column;">
                        <button onclick="preencherFormularioEdicao('${item.patrimonio}')" class="btn-editar" style="background:#ffc107; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">✏️ Editar</button>
                        <button onclick="excluirEquipamento('${item.patrimonio}')" class="btn-excluir" style="background:#dc3545; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">🗑️ Excluir</button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// 3. SALVAR / EDITAR NO SUPABASE
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
        status: 'Em Almoxarifado'
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

// 4. EXCLUIR DO SUPABASE
async function excluirEquipamento(patrimonio) {
    if (!confirm(`Deseja realmente excluir o item ${patrimonio}?`)) return;

    const { error } = await _supabase
        .from('equipamentos')
        .delete()
        .eq('patrimonio', patrimonio);

    if (error) {
        alert("Erro ao excluir: " + error.message);
    } else {
        carregarEstoque();
    }
}

function limparFormulario() {
    const form = document.querySelector("form");
    if (form) form.reset();
}

document.addEventListener('DOMContentLoaded', carregarEstoque);
