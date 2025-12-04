document.addEventListener("DOMContentLoaded", function () {
  // Elementos principais
  const mainPage = document.getElementById("mainPage");
  const cpfPage = document.getElementById("cpfPage");
  const btnAtivar = document.getElementById("btnAtivar");
  const btnVoltar = document.getElementById("btnVoltar");
  const btnAnalisar = document.getElementById("btnAnalisar");
  const btnSimular = document.getElementById("btnSimular");

  // Elementos de formulário
  const cpfInputPage = document.getElementById("cpfInputPage");
  const termsCheck = document.getElementById("termsCheck");

  // Elementos de resultado da consulta
  const consultaResultado = document.getElementById("consultaResultado");
  const loadingInfo = document.getElementById("loadingInfo");
  const userInfo = document.getElementById("userInfo");
  const errorInfo = document.getElementById("errorInfo");
  const errorMessage = document.getElementById("errorMessage");
  const btnConfirmar = document.getElementById("btnConfirmar");
  const btnCorrigir = document.getElementById("btnCorrigir");
  const btnTentarNovamente = document.getElementById("btnTentarNovamente");

  // Campos de informação do usuário
  const nomeUsuario = document.getElementById("nomeUsuario");
  const cpfUsuario = document.getElementById("cpfUsuario");
  const sexoUsuario = document.getElementById("sexoUsuario");
  const nomeMae = document.getElementById("nomeMae");

  // Obter parâmetros UTM
  function getUTMParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams = {};

    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "utm_id",
      "xcod",
    ].forEach((param) => {
      if (urlParams.has(param)) {
        utmParams[param] = urlParams.get(param);
      }
    });

    return utmParams;
  }

  // Formatação dos parâmetros UTM
  function formatUTMParams(params) {
    return Object.keys(params)
      .map(
        (key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
      )
      .join("&");
  }

  // Formatar CPF enquanto digita
  function formatCPF(input) {
    let value = input.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 9) {
      value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
    } else if (value.length > 6) {
      value = value.replace(/^(\d{3})(\d{3})(\d{1,3})$/, "$1.$2.$3");
    } else if (value.length > 3) {
      value = value.replace(/^(\d{3})(\d{1,3})$/, "$1.$2");
    }

    input.value = value;
  }

  // Validar CPF
  function validateCPF(cpf) {
    cpf = cpf.replace(/\D/g, "");
    return cpf.length === 11;
  }

  // Formatação de data (YYYYMMDD para DD/MM/YYYY ou deixa como está se já estiver formatada)
  function formatDate(dateString) {
    if (!dateString) return "Não informado";

    // Verifica se a data já está no formato DD/MM/YYYY
    if (dateString.includes("/")) {
      return dateString;
    }

    // Converte do formato YYYYMMDD para DD/MM/YYYY
    if (dateString.length === 8) {
      return dateString.replace(/^(\d{4})(\d{2})(\d{2})$/, "$3/$2/$1");
    }

    return dateString;
  }

  // 🔄 NOVA FUNÇÃO: Consultar CPF na API DATAGET
  async function consultarCPF(cpf) {
    const cpfLimpo = cpf.replace(/\D/g, "");

    // Mostrar resultados e estado de carregamento
    consultaResultado.classList.remove("hidden");
    loadingInfo.classList.remove("hidden");
    userInfo.classList.add("hidden");
    errorInfo.classList.add("hidden");

    // Rolar para baixo para mostrar o carregamento
    consultaResultado.scrollIntoView({ behavior: "smooth", block: "center" });

    try {
      const response = await fetch(
        `https://api.dataget.site/api/v1/cpf/${cpfLimpo}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer 5664016cd07486d17adea9f73884bf398a52b89593c33f114fd9c6bbddb3b26f",
          },
        }
      );

      // Ocultar loading quando tivermos resposta
      loadingInfo.classList.add("hidden");

      if (!response.ok) {
        console.error("❌ Erro ao consultar API:", response.status);
        errorMessage.textContent =
          "Não foi possível obter os dados para este CPF. Tente novamente.";
        errorInfo.classList.remove("hidden");
        errorInfo.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      const data = await response.json();
      console.log("📊 Dados da API:", data);

      const nome = data?.NOME || "";
      const sexo = data?.SEXO || "";
      const nomeMaeApi = data?.NOME_MAE || "";
      const nascApi = data?.NASC || "";

      if (nome) {
        const primeiroNome = nome.split(" ")[0];

        // sessionStorage
        sessionStorage.setItem("cpf", cpfLimpo);
        sessionStorage.setItem("primeiroNome", primeiroNome);
        sessionStorage.setItem("nomeCompleto", nome);
        sessionStorage.setItem("dataNascimento", nascApi);

        sessionStorage.setItem(
          "dadosAdicionais",
          JSON.stringify({
            cpf: cpfLimpo,
            sexo: sexo,
            nomeMae: nomeMaeApi,
            nascimento: nascApi,
          })
        );

        // Mantém compat com resto do fluxo (localStorage)
        const dadosUsuario = {
          nome: nome,
          nomeMae: nomeMaeApi,
          cpf: cpfLimpo,
          sexo: sexo,
          nascimento: nascApi,
        };

        localStorage.setItem("dadosUsuario", JSON.stringify(dadosUsuario));
        localStorage.setItem("nomeUsuario", nome);
        localStorage.setItem("cpfUsuario", cpfLimpo);

        // Preencher na tela
        nomeUsuario.textContent = nome || "Não informado";
        cpfUsuario.textContent = cpfLimpo
          ? cpfLimpo.replace(
              /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
              "$1.$2.$3-$4"
            )
          : "Não informado";
        sexoUsuario.textContent = sexo || "Não informado";
        nomeMae.textContent = nomeMaeApi || "Não informado";

        userInfo.classList.remove("hidden");

        setTimeout(() => {
          userInfo.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      } else {
        console.warn("⚠️ Dados incompletos retornados da API");
        errorMessage.textContent =
          "Não foi possível obter os dados para este CPF.";
        errorInfo.classList.remove("hidden");
        errorInfo.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } catch (error) {
      console.error("❌ Erro na requisição da API:", error);

      loadingInfo.classList.add("hidden");
      errorMessage.textContent =
        "Ocorreu um erro ao consultar seus dados. Por favor, tente novamente.";
      errorInfo.classList.remove("hidden");
      errorInfo.scrollIntoView({ behavior: "smooth", block: "center" });

      nomeUsuario.textContent = "Cliente";
    }
  }

  // Verificar se existe CPF na URL e salvar no localStorage
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("cpf")) {
    const cpfFromUrl = urlParams.get("cpf").replace(/\D/g, "");
    if (validateCPF(cpfFromUrl)) {
      localStorage.setItem("cpf", cpfFromUrl);
      console.log("CPF da URL salvo no localStorage:", cpfFromUrl);
    }
  }

  // Mostrar página de CPF
  function showCPFPage() {
    if (!mainPage || !cpfPage) return;

    mainPage.classList.add("fade-out");

    setTimeout(() => {
      mainPage.classList.add("hidden");
      cpfPage.classList.remove("hidden");

      // Trigger reflow
      void cpfPage.offsetWidth;

      cpfPage.classList.add("fade-in");
      cpfPage.classList.remove("opacity-0");

      if (cpfInputPage) cpfInputPage.focus();
    }, 400);
  }

  // Voltar para a página principal
  function showMainPage() {
    if (!mainPage || !cpfPage) return;

    cpfPage.classList.remove("fade-in");
    cpfPage.classList.add("opacity-0");

    setTimeout(() => {
      cpfPage.classList.add("hidden");
      mainPage.classList.remove("hidden");

      void mainPage.offsetWidth;

      mainPage.classList.remove("fade-out");
    }, 400);
  }

  // Processar o formulário de CPF
  function processForm() {
    if (!cpfInputPage) return;

    const cpf = cpfInputPage.value.replace(/\D/g, "");

    if (!validateCPF(cpf)) {
      alert("Por favor, digite um CPF válido (11 dígitos).");
      return;
    }

    if (!termsCheck || !termsCheck.checked) {
      alert(
        "Você precisa concordar com os Termos de Uso e Política de Privacidade para continuar."
      );
      return;
    }

    localStorage.setItem("cpf", cpf);
    console.log("CPF salvo no localStorage:", cpf);

    consultarCPF(cpf);
  }

  // Redirecionar para o chat após confirmar os dados
  function redirecionarParaChat() {
    const dadosUsuarioJSON = localStorage.getItem("dadosUsuario");
    if (!dadosUsuarioJSON) {
      alert("Dados do usuário não encontrados. Por favor, tente novamente.");
      return;
    }

    try {
      const dadosUsuario = JSON.parse(dadosUsuarioJSON);
      if (!dadosUsuario.cpf) {
        alert("CPF não encontrado. Por favor, tente novamente.");
        return;
      }

      const cpf = dadosUsuario.cpf.replace(/\D/g, "");

      const urlAtual = new URLSearchParams(window.location.search);
      const novaUrl = new URLSearchParams();

      for (const [chave, valor] of urlAtual.entries()) {
        novaUrl.append(chave, valor);
      }

      novaUrl.set("cpf", cpf);

      window.location.href = `./chat/index.html?${novaUrl.toString()}`;
    } catch (error) {
      console.error("Erro ao processar dados para redirecionamento:", error);
      alert(
        "Ocorreu um erro ao processar seus dados. Por favor, tente novamente."
      );
    }
  }

  // Limpar informações e voltar para digitar CPF
  function corrigirDados() {
    consultaResultado.classList.add("hidden");
    if (cpfInputPage) cpfInputPage.focus();
  }

  // Tentar novamente após erro
  function tentarNovamente() {
    consultaResultado.classList.add("hidden");
    if (cpfInputPage) cpfInputPage.focus();
  }

  // Event Listeners principais
  if (btnAtivar) btnAtivar.addEventListener("click", showCPFPage);
  if (btnSimular) btnSimular.addEventListener("click", showCPFPage);
  if (btnVoltar) btnVoltar.addEventListener("click", showMainPage);

  if (btnAnalisar) {
    btnAnalisar.addEventListener("click", function () {
      console.log("Botão Analisar clicado");
      console.log(
        "Valor do CPF antes do processamento:",
        cpfInputPage ? cpfInputPage.value : ""
      );
      processForm();
    });
  }

  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", redirecionarParaChat);
  }

  if (btnCorrigir) {
    btnCorrigir.addEventListener("click", corrigirDados);
  }

  if (btnTentarNovamente) {
    btnTentarNovamente.addEventListener("click", tentarNovamente);
  }

  // Formatação de CPF enquanto digita
  if (cpfInputPage) {
    cpfInputPage.addEventListener("input", function () {
      formatCPF(this);
      console.log("CPF formatado durante digitação:", this.value);
    });
  }

  // =========================
  // Carrossel Functionality
  // =========================
  const carousel = document.getElementById("carousel");
  const slides = document.querySelectorAll(".carousel-item");
  const indicators = document.querySelectorAll(".carousel-indicator");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  const stepNumbers = document.querySelectorAll(".step-number");
  const stepLines = document.querySelectorAll(".step-line");

  let currentSlide = 0;
  let autoSlideInterval;

  function showSlide(index) {
    if (!slides.length) return;

    if (index < 0) {
      index = slides.length - 1;
    } else if (index >= slides.length) {
      index = 0;
    }

    slides.forEach((slide) => {
      slide.classList.remove("active");
    });

    slides[index].classList.add("active");

    indicators.forEach((indicator, i) => {
      if (i === index) {
        indicator.classList.add("active");
      } else {
        indicator.classList.remove("active");
      }
    });

    updateSteps(index);
    currentSlide = index;
  }

  function updateSteps(index) {
    stepNumbers.forEach((step, i) => {
      step.classList.remove("active", "completed");

      if (i === index) {
        step.classList.add("active");
      } else if (i < index) {
        step.classList.add("completed");
      }
    });

    stepLines.forEach((line, i) => {
      if (i < index) {
        line.classList.add("active");
      } else {
        line.classList.remove("active");
      }
    });
  }

  function nextSlide() {
    showSlide(currentSlide + 1);
    resetAutoSlide();
  }

  function prevSlide() {
    showSlide(currentSlide - 1);
    resetAutoSlide();
  }

  function startAutoSlide() {
    if (!slides.length) return;
    autoSlideInterval = setInterval(nextSlide, 5000);
  }

  function resetAutoSlide() {
    clearInterval(autoSlideInterval);
    startAutoSlide();
  }

  if (carousel && prevBtn && nextBtn) {
    nextBtn.addEventListener("cl
