// 1. Pegar os elementos da página pelo id
const formulario = document.getElementById("formulario");
const campoTecnologia = document.getElementById("tecnologia");
const campoHoras = document.getElementById("horas");
const campoData = document.getElementById("data");
const lista = document.getElementById("lista");
const totalHoras = document.getElementById("total-horas");
const mensagemVazia = document.getElementById("vazio");
const areaGrafico = document.getElementById("area-grafico");
const canvasGrafico = document.getElementById("grafico-tecnologias");

const areaGraficoLinha = document.getElementById("area-grafico-linha");
const canvasLinha = document.getElementById("grafico-dias");

// Guardam os gráficos para podermos apagar e desenhar de novo
let grafico = null;
let graficoLinha = null;

// 2. Carregar os estudos salvos (se não tiver nada, começa com uma lista vazia)
let estudos = JSON.parse(localStorage.getItem("estudos")) || [];

// 3. Já deixar a data de hoje preenchida no formulário
campoData.value = new Date().toLocaleDateString("en-CA");

// 4. Salvar a lista no navegador
function salvar() {
  localStorage.setItem("estudos", JSON.stringify(estudos));
}

// 5. Remover um estudo pela posição na lista
function remover(posicao) {
  estudos.splice(posicao, 1);
  salvar();
  mostrar();
}

// 6. Desenhar o gráfico de barras (horas por tecnologia)
function mostrarGrafico() {
  // Se o Chart.js não carregou (sem internet), não faz nada
  if (typeof Chart === "undefined") {
    return;
  }

  // Soma as horas de cada tecnologia. Exemplo: { Python: 5, HTML: 2 }
  const horasPorTecnologia = {};
  estudos.forEach(function (estudo) {
    const somaAtual = horasPorTecnologia[estudo.tecnologia] || 0;
    horasPorTecnologia[estudo.tecnologia] = somaAtual + estudo.horas;
  });

  const nomes = Object.keys(horasPorTecnologia);   // ["Python", "HTML"]
  const horas = Object.values(horasPorTecnologia); // [5, 2]

  // Se já existe um gráfico desenhado, apaga antes de criar outro
  if (grafico) {
    grafico.destroy();
  }

  grafico = new Chart(canvasGrafico, {
    type: "bar",
    data: {
      labels: nomes,
      datasets: [{ label: "Horas", data: horas, backgroundColor: "#2f6fed" }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// 7. Desenhar o gráfico de linha (horas por dia)
function mostrarGraficoLinha() {
  if (typeof Chart === "undefined") {
    return;
  }

  // Soma as horas de cada dia. Exemplo: { "2026-10-22": 4, "2026-10-23": 1 }
  const horasPorDia = {};
  estudos.forEach(function (estudo) {
    const somaAtual = horasPorDia[estudo.data] || 0;
    horasPorDia[estudo.data] = somaAtual + estudo.horas;
  });

  // Datas no formato 2026-10-22 ficam na ordem certa com .sort()
  const datas = Object.keys(horasPorDia).sort();

  // Horas de cada dia, na mesma ordem das datas
  const horas = datas.map(function (data) {
    return horasPorDia[data];
  });

  // Troca 2026-10-22 por 22/10/2026 para mostrar no gráfico
  const nomes = datas.map(function (data) {
    return data.split("-").reverse().join("/");
  });

  if (graficoLinha) {
    graficoLinha.destroy();
  }

  graficoLinha = new Chart(canvasLinha, {
    type: "line",
    data: {
      labels: nomes,
      datasets: [{
        label: "Horas",
        data: horas,
        borderColor: "#2f6fed",
        backgroundColor: "#2f6fed",
        tension: 0.2
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// 8. Desenhar a lista e o total na tela
function mostrar() {
  lista.innerHTML = "";
  let total = 0;

  estudos.forEach(function (estudo, posicao) {
    total = total + estudo.horas;

    const item = document.createElement("li");

    // Troca 2026-10-22 por 22/10/2026
    const dataBr = estudo.data.split("-").reverse().join("/");
    const texto = document.createElement("span");
    texto.textContent = dataBr + " - " + estudo.tecnologia + " - " + estudo.horas + "h";

    const botao = document.createElement("button");
    botao.textContent = "Remover";
    botao.addEventListener("click", function () {
      remover(posicao);
    });

    item.appendChild(texto);
    item.appendChild(botao);
    lista.appendChild(item);
  });

  totalHoras.textContent = total;

  // Só mostra a mensagem "nenhum estudo" quando a lista está vazia
  mensagemVazia.hidden = estudos.length > 0;

  // O gráfico só aparece quando existe pelo menos um estudo
  areaGrafico.hidden = estudos.length === 0;
  areaGraficoLinha.hidden = estudos.length === 0;
  mostrarGrafico();
  mostrarGraficoLinha();
}

// 9. Quando clicar em "Registrar estudo"
formulario.addEventListener("submit", function (evento) {
  evento.preventDefault(); // impede a página de recarregar

  const novoEstudo = {
    tecnologia: campoTecnologia.value,
    horas: parseFloat(campoHoras.value),
    data: campoData.value
  };

  estudos.push(novoEstudo);
  salvar();
  mostrar();
});

// 10. Mostrar o que já estava salvo assim que a página abre
mostrar();
