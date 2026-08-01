// Substitua pelas suas credenciais do Supabase que você já usa no app.js
const SUPABASE_URL = "SUA_SUPABASE_URL_AQUI";
const SUPABASE_KEY = "SUA_SUPABASE_KEY_AQUI";

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Evento de Login
document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const erroMsg = document.getElementById('erroMsg');

    erroMsg.style.display = 'none';

    // Fazer login no Supabase
    const { data, error } = await _supabase.auth.signInWithPassword({
        email: email,
        password: senha,
    });

    if (error) {
        erroMsg.textContent = "Erro de acesso: " + error.message;
        erroMsg.style.display = 'block';
    } else {
        // Redirecionar para a página principal após login bem-sucedido
        window.location.href = 'index.html';
    }
});