🎱 Sinuquete App
Um gestor financeiro de sinuca desenvolvido para acabar com a dúvida de "quem deve quanto" no final da noite. Desenvolvido com Python (Flask) e JavaScript puro.

🚀 Funcionalidades
- Gestão de Gastos: Adicione ou remova partidas por pessoa.
- Preços Dinâmicos: Suporte a múltiplos locais (CT, Artes, Onofre, Ed. Física) com preços diferentes.
- Estatísticas em Tempo Real:
    - 🏆 Identificação automática de quem gastou mais (Top Spender).
    - 💸 Identificação do "Mão de Vaca" da noite.
    - 📊 Total geral gasto pelo grupo.
- Interface Responsiva: Funciona perfeitamente no telemóvel e PC.
- Persistência de Dados: Banco de dados SQLite integrado.

🛠️ Tecnologias Utilizadas
- Backend: Python, Flask
- Frontend: HTML5, CSS3 (Modular), JavaScript (Vanilla)
- Banco de Dados: SQLite
- Deploy: Render + Gunicorn

📦 Como rodar localmente
1. Clone o repositório:
git clone [https://github.com/SEU-USUARIO/sinuquete.git](https://github.com/SEU-USUARIO/sinuquete.git)
cd sinuquete
2. Crie um ambiente virtual (opcional, mas recomendado):
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
3. Instale as dependências:pip install -r requirements.txt
Rode o projeto:python app.py
4. Acesse em http://localhost:5000

Feito com 🎱 e código por Fernanda Coutinho.