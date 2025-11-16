// --- CONFIGURAÇÃO INTELIGENTE DA API ---
// Se estiver no Live Server (porta 5500), força o endereço do Python (5000)
// Se estiver no Ngrok ou rodando pelo Python direto, usa o caminho relativo
const API_URL = window.location.port === '5500' 
    ? 'http://127.0.0.1:5000/api' 
    : '/api';

document.addEventListener('DOMContentLoaded', () => {

    // --- NOVO: FRASES ALEATÓRIAS DO RODAPÉ ---
    const frasesRodape = [
        "Equipe alinhada (com a caçapa errada)",
        "Falir é fácil. Difícil é acertar uma tacada boa",
        "Taco firme, caixa fraco",
        "Encaçapando a falência desde sempre",
        "Tudo indo pro buraco (inclusive a gente)",
        "A equipe faz pontos; nós fazemos dívidas",
        "A bola cai e o saldo também",
        "A mesa chama, o dinheiro foge",
        "Jogamos por esporte; falimos por hábito",
        "O pano é verde; o nosso salário, não"
    ];

    function sortearFrase() {
        const elementoP = document.querySelector('.site-footer-final p');
        if (elementoP) {
            const indice = Math.floor(Math.random() * frasesRodape.length);
            const fraseEscolhida = frasesRodape[indice];
            // Mantém o Copyright e adiciona a frase sorteada
            elementoP.innerHTML = `Sinuquete © 2025 &nbsp;·&nbsp; ${fraseEscolhida}`;
        }
    }
    
    // Roda o sorteio assim que a página abre
    sortearFrase();
    // ------------------------------------------


    // Estado local para interface rápida
    const amigoStates = {};
    const localStats = { 'CT': 0, 'Artes': 0, 'Onofre': 0, 'Ed. Física': 0 };

    // 1. Inicializa cards e carrega dados do banco
    async function init() {
        // Prepara os objetos dos cards
        document.querySelectorAll('.amigo-card').forEach(card => {
            const idAmigo = card.querySelector('.botoes-local').dataset.amigo;
            // Pega o nome exato que está no HTML (removendo o ícone se tiver)
            const nomeTexto = card.querySelector('.nome-amigo').childNodes[0].textContent.trim();

            amigoStates[idAmigo] = {
                currentTotal: 0,
                selectedPrice: 0,
                selectedLocal: null,
                totalElement: card.querySelector('.total-gasto'),
                precoDisplayElement: card.querySelector('.preco-local'),
                cardElement: card,
                name: nomeTexto // "Augusto", "Daniel", etc.
            };
        });

        // Busca os dados salvos no Python/MySQL
        await carregarDadosDoServidor();
    }

    // --- COMUNICAÇÃO COM O PYTHON ---

    async function carregarDadosDoServidor() {
        try {
            const response = await fetch(`${API_URL}/totais`);
            const data = await response.json();

            // 1. Atualiza totais dos amigos
            data.amigos.forEach(item => {
                // Procura qual ID (augusto, daniel) corresponde ao nome do banco
                const idAmigo = Object.keys(amigoStates).find(key => amigoStates[key].name === item.nome);
                if (idAmigo) {
                    amigoStates[idAmigo].currentTotal = parseFloat(item.total);
                    atualizarVisualCard(idAmigo);
                }
            });

            // 2. Atualiza estatísticas dos locais
            data.locais.forEach(item => {
                if (localStats.hasOwnProperty(item.local)) {
                    localStats[item.local] = parseFloat(item.total);
                }
            });

            highlightTopSpender();
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            // Só mostra alerta se NÃO for a primeira carga (pra não assustar)
            // ou se o erro for crítico.
            console.log("Tentando conectar em: " + API_URL);
        }
    }

    async function enviarTransacao(nome, local, valor) {
        try {
            const response = await fetch(`${API_URL}/transacao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, local, valor })
            });
            
            const data = await response.json();
            
            if (data.mensagem !== 'Sucesso!') {
                alert(`⚠️ ERRO DO SERVIDOR:\n"${data.mensagem}"\n\nO banco de dados pode estar desatualizado.`);
            }

        } catch (error) {
            console.error("Erro ao salvar transação:", error);
        }
    }

    async function resetarBancoDeDados() {
        try {
            await fetch(`${API_URL}/resetar`, { method: 'POST' });
        } catch (error) {
            console.error("Erro ao resetar:", error);
        }
    }

    // --- LÓGICA VISUAL E INTERAÇÃO ---

    function atualizarVisualCard(idAmigo) {
        const state = amigoStates[idAmigo];
        state.totalElement.innerText = `Total: ${state.currentTotal.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        })}`;
    }

    // Função de destaque (Igual a anterior)
    function highlightTopSpender() {
        let maxGasto = 0;
        let idAmigoMaisGastou = null;

        for (const idAmigo in amigoStates) {
            const state = amigoStates[idAmigo];
            if (state.currentTotal > maxGasto) {
                maxGasto = state.currentTotal;
                idAmigoMaisGastou = idAmigo;
            }
        }

        for (const idAmigo in amigoStates) {
            const card = amigoStates[idAmigo].cardElement;
            if (idAmigo === idAmigoMaisGastou && maxGasto > 0) {
                card.classList.add('top-spender');
            } else {
                card.classList.remove('top-spender');
            }
        }
    }

    // Eventos dos Botões de Local
    document.querySelectorAll('.botoes-local').forEach(grupo => {
        grupo.addEventListener('click', (evento) => {
            if (evento.target.classList.contains('btn-local')) {
                const botao = evento.target;
                grupo.querySelectorAll('.btn-local').forEach(btn => btn.classList.remove('selecionado'));
                botao.classList.add('selecionado');

                const nomeLocal = botao.innerText;
                const preco = parseFloat(botao.dataset.preco);
                const idAmigo = grupo.dataset.amigo;

                amigoStates[idAmigo].selectedPrice = preco;
                amigoStates[idAmigo].selectedLocal = nomeLocal;
                
                const precoFormatado = preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                const display = amigoStates[idAmigo].precoDisplayElement;
                display.innerText = `${nomeLocal}: ${precoFormatado} / partida`;
                display.style.color = '#555';
            }
        });
    });

    // Eventos de + e -
    document.querySelector('.container-principal').addEventListener('click', (evento) => {
        let target = evento.target;
        // Garante que pegamos o botão mesmo se clicar no ícone dentro (se houver)
        if (!target.classList.contains('btn-acao')) target = target.closest('.btn-acao');
        if (!target) return;

        let acao = null;
        if (target.classList.contains('btn-mais')) acao = 'add';
        else if (target.classList.contains('btn-menos')) acao = 'subtract';

        if (!acao) return;

        const card = target.closest('.amigo-card');
        const idAmigo = card.querySelector('.botoes-local').dataset.amigo;
        const state = amigoStates[idAmigo];

        if (state.selectedPrice === 0) {
            state.precoDisplayElement.innerText = "Selecione um local!";
            state.precoDisplayElement.style.color = '#c62828';
            return;
        }

        const valorTransacao = state.selectedPrice;
        const nomeAmigo = state.name;
        const local = state.selectedLocal;

        if (acao === 'add') {
            state.currentTotal += valorTransacao;
            localStats[local] += valorTransacao;
            // Envia para o Python (valor positivo)
            enviarTransacao(nomeAmigo, local, valorTransacao);
        } else {
            // Permite subtração mesmo que vá para negativo no banco, mas visualmente travamos no 0 se quiser
            if (state.currentTotal - valorTransacao >= 0) {
                state.currentTotal -= valorTransacao;
                localStats[local] -= valorTransacao;
                // Envia para o Python (valor negativo)
                enviarTransacao(nomeAmigo, local, -valorTransacao);
            } else {
                return; // Não faz nada se for ficar negativo
            }
        }

        atualizarVisualCard(idAmigo);

        // Efeito Flash
        const flashClass = (acao === 'add') ? 'flash-effect' : 'flash-effect-red';
        state.totalElement.classList.add(flashClass);
        state.totalElement.addEventListener('animationend', () => {
            state.totalElement.classList.remove(flashClass);
        }, { once: true });

        highlightTopSpender();
    });

    // --- ESTATÍSTICAS E RESET ---

    const openMenuBtn = document.getElementById('openMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const statsModal = document.getElementById('statsModal');
    const statsContent = document.getElementById('stats-content');

    function updateStatsPanel() {
        let htmlLocais = '';
        let maxGastoLocal = -1;
        let localMaisGasto = 'Nenhum';
        let totalGeral = 0;
        let minGastoAmigo = Infinity;
        let nomeMaoDeVaca = 'Ninguém';

        // Totais por local
        for (const local in localStats) {
            const total = localStats[local];
            const totalFormatado = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const classeDestaque = (total === maxGastoLocal && maxGastoLocal > 0) ? 'top-local-item' : '';
            
            if (total > 0) {
                htmlLocais += `<p class="${classeDestaque}">Gasto em ${local}: ${totalFormatado}</p>`;
            }

            if (total > maxGastoLocal) {
                maxGastoLocal = total;
                localMaisGasto = local;
            }
            totalGeral += total;
        }
        if (htmlLocais === '') htmlLocais = '<p>Nenhum gasto registrado ainda.</p>';

        // Mão de Vaca
        for (const id in amigoStates) {
            const gasto = amigoStates[id].currentTotal;
            if (gasto < minGastoAmigo) {
                minGastoAmigo = gasto;
                nomeMaoDeVaca = amigoStates[id].name;
            } else if (gasto === minGastoAmigo) {
                nomeMaoDeVaca += ` e ${amigoStates[id].name}`;
            }
        }
        if (totalGeral === 0) nomeMaoDeVaca = "Todos";

        const totalGeralFormatado = totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        let htmlTopo = `
            <div class="stats-header-block">
                <h4>Total da Galera</h4>
                <div class="big-total">${totalGeralFormatado}</div>
            </div>
            <div class="stats-grid">
                <div class="stat-box blue">
                    <span>🏆</span>
                    <h3>Local Top</h3>
                    <p>${maxGastoLocal > 0 ? localMaisGasto : '...'}</p>
                </div>
                <div class="stat-box green">
                    <span>💸</span>
                    <h3>Mão de Vaca</h3>
                    <p>${nomeMaoDeVaca}</p>
                </div>
            </div>
            <h3>Detalhes por Local</h3>
        `;

        let htmlReset = `
            <div style="margin-top: 30px; text-align: center;">
                <button id="btnResetAll" class="btn-reset">🔄 Reiniciar Noite</button>
            </div>
        `;

        statsContent.innerHTML = htmlTopo + htmlLocais + htmlReset;
        document.getElementById('btnResetAll').addEventListener('click', resetarTudo);
    }

    function resetarTudo() {
        if(!confirm("Tem certeza? Isso apagará todo o histórico do banco de dados!")) return;

        // Zera visualmente
        for (const id in amigoStates) {
            amigoStates[id].currentTotal = 0;
            atualizarVisualCard(id);
        }
        for (const local in localStats) localStats[local] = 0;
        
        highlightTopSpender();
        resetarBancoDeDados(); // Avisa o Python para limpar o banco
        statsModal.classList.remove('active');
    }

    openMenuBtn.addEventListener('click', () => {
        updateStatsPanel();
        statsModal.classList.add('active');
    });
    closeMenuBtn.addEventListener('click', () => statsModal.classList.remove('active'));
    statsModal.addEventListener('click', (e) => {
        if (e.target === statsModal) statsModal.classList.remove('active');
    });

    // Inicializa tudo
    init();
});