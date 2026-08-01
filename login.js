// Substitua pelas suas credenciais do Supabase que você já usa no app.js
const SUPABASE_URL = https://tocmqlsicxuxfkiptgaj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvY21xbHNpY3h1eGZraXB0Z2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNTIyODEsImV4cCI6MjA5OTYyODI4MX0.B-UKh4qMQG02guuJhIlI-ZB0d4OjlByFyfOoGISiqMY;

const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
