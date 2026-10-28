// 1. Pegar os elementos da página pelo id
const formulario = document.getElementById("formulario");
const campoTecnologia = document.getElementById("tecnologia");
const campoHoras = document.getElementById("horas");
const campoData = document.getElementById("data");
const lista = document.getElementById("lista");
const totalHoras = document.getElementById("total-horas");
const mensagemVazia = document.getElementById("vazio");
const canvasDias = document.getElementById("grafico-dias");
const canvasTecnologias = document.getElementById("grafico-tecnologias");
const canvasPizza = document.getElementById("grafico-pizza");
const cartaoMaisEstudada = document.getElementById("mais-estudada");
const cartaoSequencia = document.getElementById("sequencia");
const rotuloSequencia = document.getElementById("rotulo-sequencia");

// Guardam os gráficos para podermos apagar e desenhar de novo
let graficoDias = null;
let graficoTecnologias = null;
let graficoPizza = null;

// Cores dos gráficos (as mesmas do style.css)
const COR_BARRA = "#5cc8d7";
const COR_TEXTO = "#8fa7b3";
const COR_CONTORNO = "#000000";

// Cada tecnologia tem a sua cor na pizza
const CORES_TECNOLOGIAS = {
  "HTML": "#f2a65a",
  "CSS": "#9b8cf2",
  "JavaScript": "#5cc8d7",
  "Python": "#6fd08c",
  "Node.js": "#f27d8c",
  "Git": "#e6c84f",
  "Outra": "#8fa7b3"
};

// Deixa os gráficos com a mesma fonte e cores da página
if (typeof Chart !== "undefined") {
  Chart.defaults.font.family = "'IBM Plex Sans', system-ui, sans-serif";
  Chart.defaults.color = COR_TEXTO;
}

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

// Troca o ponto pela vírgula: 1.5 vira "1,5"
function formatarNumero(numero) {
  return String(numero).replace(".", ",");
}

// Soma as horas agrupando por um campo ("tecnologia" ou "data")
// Exemplo com "tecnologia": { Python: 5, HTML: 2 }
function somarHorasPor(campo) {
  const soma = {};
  estudos.forEach(function (estudo) {
    const somaAtual = soma[estudo[campo]] || 0;
    soma[estudo[campo]] = somaAtual + estudo.horas;
  });
  return soma;
}

// Lista de [tecnologia, horas], da mais estudada para a menos estudada
// Object.entries transforma { Python: 5 } em [["Python", 5]]
function tecnologiasOrdenadas() {
  return Object.entries(somarHorasPor("tecnologia")).sort(function (a, b) {
    return b[1] - a[1];
  });
}

// 6. Cartões: tecnologia mais estudada e sequência de dias
function tecnologiaMaisEstudada() {
  const horasPorTecnologia = somarHorasPor("tecnologia");

  // Procura qual tem o maior total
  let maisEstudada = "-";
  let maiorTotal = 0;
  for (const nome in horasPorTecnologia) {
    if (horasPorTecnologia[nome] > maiorTotal) {
      maiorTotal = horasPorTecnologia[nome];
      maisEstudada = nome;
    }
  }
  return maisEstudada;
}

function calcularSequencia() {
  // Lista dos dias em que você estudou (sem repetir)
  const diasComEstudo = Object.keys(somarHorasPor("data"));

  // Começa a contar por hoje
  const dia = new Date();

  // Se você ainda não estudou hoje, começa por ontem
  if (!diasComEstudo.includes(dia.toLocaleDateString("en-CA"))) {
    dia.setDate(dia.getDate() - 1);
  }

  // Volta um dia de cada vez, enquanto tiver estudo naquele dia
  let dias = 0;
  while (diasComEstudo.includes(dia.toLocaleDateString("en-CA"))) {
    dias = dias + 1;
    dia.setDate(dia.getDate() - 1);
  }
  return dias;
}

function mostrarCartoes() {
  cartaoMaisEstudada.textContent = tecnologiaMaisEstudada();

  const dias = calcularSequencia();
  cartaoSequencia.textContent = dias;
  rotuloSequencia.textContent = dias === 1 ? "dia" : "dias";
}

// 7. Plugin simples: escreve o número de horas em cima de cada barra
const numerosNasBarras = {
  id: "numerosNasBarras",
  afterDatasetsDraw: function (chart) {
    const ctx = chart.ctx;
    const horizontal = chart.options.indexAxis === "y";

    ctx.save();
    ctx.fillStyle = "#e8f1f5";
    ctx.font = "600 12px 'IBM Plex Sans', system-ui, sans-serif";
    ctx.textAlign = horizontal ? "left" : "center";
    ctx.textBaseline = horizontal ? "middle" : "bottom";

    chart.getDatasetMeta(0).data.forEach(function (barra, i) {
      const texto = formatarNumero(chart.data.datasets[0].data[i]) + "h";
      if (horizontal) {
        ctx.fillText(texto, barra.x + 8, barra.y);
      } else {
        ctx.fillText(texto, barra.x, barra.y - 6);
      }
    });
    ctx.restore();
  }
};

// 8. Gráfico de barras: evolução diária (horas por dia)
function mostrarGraficoDias() {
  // Se o Chart.js não carregou (sem internet), não faz nada
  if (typeof Chart === "undefined") {
    return;
  }

  const horasPorDia = somarHorasPor("data");

  // Datas no formato 2026-10-22 ficam na ordem certa com .sort()
  const datas = Object.keys(horasPorDia).sort();

  const horas = datas.map(function (data) {
    return horasPorDia[data];
  });

  // Troca 2026-10-22 por 22/10/26 para caber embaixo da barra
  const nomes = datas.map(function (data) {
    const partes = data.split("-"); // ["2026", "10", "22"]
    return partes[2] + "/" + partes[1] + "/" + partes[0].slice(2);
  });

  // Se já existe um gráfico desenhado, apaga antes de criar outro
  if (graficoDias) {
    graficoDias.destroy();
  }

  graficoDias = new Chart(canvasDias, {
    type: "bar",
    data: {
      labels: nomes,
      datasets: [{
        label: "Horas",
        data: horas,
        backgroundColor: COR_BARRA,
        borderColor: COR_CONTORNO,
        borderWidth: 2,
        borderSkipped: false,
        borderRadius: 4,
        maxBarThickness: 40
      }]
    },
    options: {
      maintainAspectRatio: false,
      layout: { padding: { top: 18 } },
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { display: false, beginAtZero: true, grace: "10%" }
      }
    },
    plugins: [numerosNasBarras]
  });
}

// 9. Gráfico de barras na horizontal: horas por tecnologia (maior primeiro)
function mostrarGraficoTecnologias() {
  if (typeof Chart === "undefined") {
    return;
  }

  const ordenado = tecnologiasOrdenadas();

  const nomes = ordenado.map(function (par) {
    return par[0];
  });
  const horas = ordenado.map(function (par) {
    return par[1];
  });

  if (graficoTecnologias) {
    graficoTecnologias.destroy();
  }

  graficoTecnologias = new Chart(canvasTecnologias, {
    type: "bar",
    data: {
      labels: nomes,
      datasets: [{
        label: "Horas",
        data: horas,
        backgroundColor: COR_BARRA,
        borderColor: COR_CONTORNO,
        borderWidth: 2,
        borderSkipped: false,
        borderRadius: 4,
        maxBarThickness: 28
      }]
    },
    options: {
      indexAxis: "y",
      maintainAspectRatio: false,
      layout: { padding: { right: 36 } },
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false, beginAtZero: true },
        y: { grid: { display: false } }
      }
    },
    plugins: [numerosNasBarras]
  });
}

// 10. Gráfico de pizza: proporção de horas de cada tecnologia
function mostrarGraficoPizza() {
  if (typeof Chart === "undefined") {
    return;
  }

  const ordenado = tecnologiasOrdenadas();

  // A legenda mostra as horas: "JavaScript: 10h"
  const nomes = ordenado.map(function (par) {
    return par[0] + ": " + formatarNumero(par[1]) + "h";
  });
  const horas = ordenado.map(function (par) {
    return par[1];
  });

  // Pega a cor de cada tecnologia (se não tiver, usa cinza)
  const cores = ordenado.map(function (par) {
    return CORES_TECNOLOGIAS[par[0]] || COR_TEXTO;
  });

  if (graficoPizza) {
    graficoPizza.destroy();
  }

  graficoPizza = new Chart(canvasPizza, {
    type: "pie",
    data: {
      labels: nomes,
      datasets: [{
        label: "Horas",
        data: horas,
        backgroundColor: cores,
        borderColor: COR_CONTORNO,
        borderWidth: 2
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 12, padding: 12, color: "#e8f1f5" }
        },
        tooltip: {
          callbacks: {
            // Ao passar o mouse, mostra a porcentagem da fatia
            label: function (contexto) {
              const total = contexto.dataset.data.reduce(function (a, b) {
                return a + b;
              }, 0);
              const percentual = Math.round((contexto.parsed / total) * 100);
              return " " + percentual + "% do total";
            }
          }
        }
      }
    }
  });
}

// Cria um item do histórico: tecnologia, data, horas e botão de remover
function criarItem(estudo, posicao) {
  const item = document.createElement("li");

  // Troca 2026-10-22 por 22/10/2026
  const dataBr = estudo.data.split("-").reverse().join("/");

  const nome = document.createElement("strong");
  nome.textContent = estudo.tecnologia;

  const data = document.createElement("small");
  data.textContent = dataBr;

  const info = document.createElement("div");
  info.appendChild(nome);
  info.appendChild(data);

  const horas = document.createElement("span");
  horas.className = "hist-horas";
  horas.textContent = formatarNumero(estudo.horas) + "h";

  const botao = document.createElement("button");
  botao.textContent = "×";
  botao.setAttribute("aria-label", "Remover estudo de " + estudo.tecnologia + " em " + dataBr);
  botao.addEventListener("click", function () {
    remover(posicao);
  });

  item.appendChild(info);
  item.appendChild(horas);
  item.appendChild(botao);
  return item;
}

// 11. Desenhar tudo na tela
function mostrar() {
  lista.innerHTML = "";
  let total = 0;

  // Do último estudo registrado para o primeiro
  for (let posicao = estudos.length - 1; posicao >= 0; posicao--) {
    lista.appendChild(criarItem(estudos[posicao], posicao));
  }

  estudos.forEach(function (estudo) {
    total = total + estudo.horas;
  });
  totalHoras.textContent = formatarNumero(total);

  // Só mostra a mensagem "nenhum estudo" quando a lista está vazia
  mensagemVazia.hidden = estudos.length > 0;

  mostrarCartoes();
  mostrarGraficoDias();
  mostrarGraficoTecnologias();
  mostrarGraficoPizza();
}

// 12. Quando clicar em "Registrar estudo"
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

// 13. Mostrar o que já estava salvo assim que a página abre
mostrar();
