
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

/* =========================================================
   VOLT — POWER YOUR GAME
   React + Supabase
========================================================= */

const FALLBACK_CATEGORIAS = [
  { id: "ps5", nome: "PlayStation 5", imagem: "" },
  { id: "ps4", nome: "PlayStation 4", imagem: "" },
  { id: "xbox", nome: "Xbox", imagem: "" },
  { id: "controles", nome: "Controles", imagem: "" },
  { id: "headsets", nome: "Headsets", imagem: "" },
  { id: "acessorios", nome: "Acessórios", imagem: "" },
];

// Imagens de reserva por categoria. Se uma URL externa falhar, o componente
// tenta as alternativas e termina em uma arte SVG local embutida (sem dependência externa).
const CATEGORY_IMAGE_FALLBACKS = {
  "playstation 5": [
    "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?auto=format&fit=crop&w=1000&q=85",
  ],
  "playstation 4": [
    "https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=1000&q=85",
  ],
  "xbox": [
    "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=1000&q=85",
  ],
  "controles": [
    "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1000&q=85",
  ],
  "headsets": [
    "https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85",
  ],
  "acessórios": [
    "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=1000&q=85",
  ],
};

function nomeCategoria(categoria) {
  return String(categoria?.nome || categoria?.name || categoria?.categoria || "Acessórios").trim();
}

function svgCategoriaFallback(categoria) {
  const nome = nomeCategoria(categoria);
  const lower = nome.toLowerCase();
  const sigla = lower.includes("xbox") ? "XBOX" : lower.includes("playstation 5") || lower.includes("ps5") ? "PS5" : lower.includes("playstation 4") || lower.includes("ps4") ? "PS4" : lower.includes("headset") ? "AUDIO" : lower.includes("controle") ? "GEAR" : "VOLT";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="560" viewBox="0 0 1000 560"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#10271a"/><stop offset="1" stop-color="#050906"/></linearGradient><radialGradient id="r"><stop stop-color="#59B37E" stop-opacity=".42"/><stop offset="1" stop-color="#59B37E" stop-opacity="0"/></radialGradient></defs><rect width="1000" height="560" fill="url(#g)"/><circle cx="780" cy="130" r="330" fill="url(#r)"/><path d="M640 0L1000 0 1000 560 830 560Z" fill="#337F58" opacity=".12"/><text x="64" y="340" fill="#59B37E" font-family="Arial,sans-serif" font-size="132" font-weight="900" letter-spacing="8">${sigla}</text><text x="70" y="405" fill="#ffffff" fill-opacity=".8" font-family="Arial,sans-serif" font-size="28" letter-spacing="7">POWER YOUR GAME</text><path d="M70 450H340" stroke="#59B37E" stroke-width="5" stroke-linecap="round"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function imagensFallbackCategoria(categoria) {
  const nome = nomeCategoria(categoria).toLowerCase();
  const chave = Object.keys(CATEGORY_IMAGE_FALLBACKS).find((item) => nome.includes(item) || (item === "playstation 5" && nome.includes("ps5")) || (item === "playstation 4" && nome.includes("ps4")));
  return [...(CATEGORY_IMAGE_FALLBACKS[chave] || CATEGORY_IMAGE_FALLBACKS["acessórios"]), svgCategoriaFallback(categoria)];
}

function imagemCategoria(categoria) {
  return categoria?.imagem || categoria?.imagem_url || categoria?.image_url || categoria?.url_imagem || imagensFallbackCategoria(categoria)[0];
}

const categoriaFallback = (produto) => {
  const texto = `${produto?.categoria || ""} ${produto?.nome || ""}`.toLowerCase();

  if (texto.includes("playstation 5") || texto.includes("ps5")) {
    return "PlayStation 5";
  }

  if (texto.includes("playstation 4") || texto.includes("ps4")) {
    return "PlayStation 4";
  }

  if (
    texto.includes("xbox") ||
    texto.includes("halo") ||
    texto.includes("forza") ||
    texto.includes("starfield")
  ) {
    return "Xbox";
  }

  if (
    texto.includes("controle") ||
    texto.includes("dualsense") ||
    texto.includes("fight stick")
  ) {
    return "Controles";
  }

  if (
    texto.includes("headset") ||
    texto.includes("hyperx") ||
    texto.includes("logitech g pro x") ||
    texto.includes("blackshark") ||
    texto.includes("arctis")
  ) {
    return "Headsets";
  }

  return "Acessórios";
};

function formatarPreco(valor) {
  const numero = Number(valor || 0);

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  if (!data) return "Não informado";

  const partes = String(data).split("-");

  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return data;
}

function imagemProduto(produto) {
  return (
    produto?.imagem_detalhe ||
    produto?.imagem ||
    produto?.image ||
    "https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=1400&q=85"
  );
}

function imagemCard(produto) {
  return (
    produto?.imagem ||
    produto?.image ||
    produto?.imagem_detalhe ||
    "https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=1200&q=85"
  );
}

function produtoEstoque(produto) {
  const estoque = Number(produto?.estoque);

  return Number.isFinite(estoque) ? estoque : 0;
}

function produtoAvaliacao(produto) {
  const valor = Number(produto?.avaliacao);

  return Number.isFinite(valor) && valor > 0 ? valor : 4.8;
}

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

function StoreApp() {
  const { user, signOut } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState(FALLBACK_CATEGORIAS);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState("Todas as categorias");

  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  const [favoritos, setFavoritos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);

  const [mostrarCarrinho, setMostrarCarrinho] = useState(false);
  const [mostrarFavoritos, setMostrarFavoritos] = useState(false);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);

  const [salvando, setSalvando] = useState(false);

  // O logo e o botão Início sempre limpam os filtros e mostram o catálogo completo.
  function irInicio() {
    setCategoriaSelecionada("Todas as categorias");
    setBusca("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* =======================================================
     FORMULÁRIO
  ======================================================= */

  const formularioInicial = {
    nome: "",
    categoria_id: "",
    categoria: "",
    preco: "",
    estoque: "10",
    avaliacao: "4.8",
    imagem: "",
    imagem_detalhe: "",
    descricao: "",
    classificacao: "Livre",
    desenvolvedora: "",
    lancamento: "",
  };

  const [formulario, setFormulario] = useState(formularioInicial);

  /* =======================================================
     CARREGAR PRODUTOS
  ======================================================= */

  async function carregarProdutos() {
    setCarregando(true);
    setErro("");

    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        console.error("Erro ao carregar produtos do Supabase:", error);
        setErro(error.message);
        setProdutos([]);
        return;
      }

      console.log("=================================");
      console.log("VOLT — PRODUTOS DO SUPABASE");
      console.log("Produtos carregados:", data);
      console.log("Quantidade:", data?.length || 0);
      console.log("=================================");

      setProdutos(data || []);
    } catch (err) {
      console.error("Erro inesperado:", err);
      setErro("Não foi possível carregar os produtos.");
    } finally {
      setCarregando(false);
    }
  }

  /* =======================================================
     CARREGAR CATEGORIAS
  ======================================================= */

  async function carregarCategorias() {
    try {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        console.warn("Não foi possível carregar categorias:", error);
        setCategorias(FALLBACK_CATEGORIAS);
        return;
      }

      console.log("VOLT — Categorias do Supabase:", data);

      if (data && data.length > 0) {
        setCategorias(data);
      }
    } catch (err) {
      console.error("Erro nas categorias:", err);
    }
  }

  useEffect(() => {
    carregarProdutos();
    carregarCategorias();
  }, []);

  /* =======================================================
     ESC
  ======================================================= */

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setProdutoSelecionado(null);
        setMostrarCarrinho(false);
        setMostrarFavoritos(false);
        setMostrarFormulario(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  /* =======================================================
     FILTRO DOS PRODUTOS
  ======================================================= */

  const produtosFiltrados = useMemo(() => {
    const texto = busca.trim().toLowerCase();

    return produtos.filter((produto) => {
      const nome = String(produto?.nome || "").toLowerCase();
      const categoria = String(
        produto?.categoria || categoriaFallback(produto)
      ).toLowerCase();

      const correspondeBusca =
        !texto ||
        nome.includes(texto) ||
        categoria.includes(texto) ||
        String(produto?.desenvolvedora || "")
          .toLowerCase()
          .includes(texto);

      const correspondeCategoria =
        categoriaSelecionada === "Todas as categorias" ||
        categoria === categoriaSelecionada.toLowerCase() ||
        categoriaFallback(produto).toLowerCase() ===
          categoriaSelecionada.toLowerCase();

      return correspondeBusca && correspondeCategoria;
    });
  }, [produtos, busca, categoriaSelecionada]);

  /* =======================================================
     FAVORITOS
  ======================================================= */

  function alternarFavorito(produto) {
    setFavoritos((anteriores) => {
      const existe = anteriores.some((item) => item.id === produto.id);

      if (existe) {
        return anteriores.filter((item) => item.id !== produto.id);
      }

      return [...anteriores, produto];
    });
  }

  function favoritoExiste(id) {
    return favoritos.some((item) => item.id === id);
  }

  /* =======================================================
     CARRINHO
  ======================================================= */

  function adicionarCarrinho(produto) {
    const estoque = produtoEstoque(produto);

    if (estoque <= 0) {
      alert("Este produto está fora de estoque.");
      return;
    }

    setCarrinho((anterior) => {
      const existente = anterior.find((item) => item.id === produto.id);

      if (existente) {
        return anterior.map((item) =>
          item.id === produto.id
            ? {
                ...item,
                quantidade: Math.min(
                  item.quantidade + 1,
                  produtoEstoque(produto)
                ),
              }
            : item
        );
      }

      return [
        ...anterior,
        {
          ...produto,
          quantidade: 1,
        },
      ];
    });
  }

  function alterarQuantidade(id, quantidade) {
    setCarrinho((anterior) =>
      anterior
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantidade: Math.max(
                  0,
                  Math.min(quantidade, produtoEstoque(item))
                ),
              }
            : item
        )
        .filter((item) => item.quantidade > 0)
    );
  }

  function removerCarrinho(id) {
    setCarrinho((anterior) => anterior.filter((item) => item.id !== id));
  }

  const totalCarrinho = carrinho.reduce(
    (total, item) => total + Number(item.preco || 0) * item.quantidade,
    0
  );

  const quantidadeCarrinho = carrinho.reduce(
    (total, item) => total + item.quantidade,
    0
  );

  /* =======================================================
     FORMULÁRIO
  ======================================================= */

  function abrirNovoProduto() {
    setProdutoEditando(null);
    setFormulario(formularioInicial);
    setMostrarFormulario(true);
  }

  function abrirEditarProduto(produto) {
    setProdutoEditando(produto);

    setFormulario({
      nome: produto?.nome || "",
      categoria_id: produto?.categoria_id ?? "",
      categoria: produto?.categoria || "",
      preco: produto?.preco ?? "",
      estoque: produto?.estoque ?? "10",
      avaliacao: produto?.avaliacao ?? "4.8",
      imagem: produto?.imagem || "",
      imagem_detalhe: produto?.imagem_detalhe || "",
      descricao: produto?.descricao || "",
      classificacao: produto?.classificacao || "Livre",
      desenvolvedora: produto?.desenvolvedora || "",
      lancamento: produto?.lancamento || "",
    });

    setMostrarFormulario(true);
  }

  function atualizarCampo(campo, valor) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  async function salvarProduto(event) {
    event.preventDefault();

    if (!formulario.nome.trim()) {
      alert("Digite o nome do produto.");
      return;
    }

    if (!formulario.preco) {
      alert("Digite o preço do produto.");
      return;
    }

    setSalvando(true);

    try {
      const categoriaId = Number(formulario.categoria_id);
      const categoriaSelecionada = categorias.find(
        (categoria) => Number(categoria.id) === categoriaId
      );

      if (!Number.isInteger(categoriaId) || categoriaId <= 0) {
        alert("Selecione uma categoria antes de salvar o produto.");
        setSalvando(false);
        return;
      }

      const dados = {
        nome: formulario.nome.trim(),
        categoria_id: categoriaId,
        categoria: categoriaSelecionada?.nome || formulario.categoria.trim(),
        preco: Number(formulario.preco),
        estoque: Number(formulario.estoque || 0),
        avaliacao: Number(formulario.avaliacao || 4.8),
        imagem: formulario.imagem.trim(),
        imagem_detalhe: formulario.imagem_detalhe.trim(),
        descricao: formulario.descricao.trim(),
        classificacao: formulario.classificacao.trim() || "Livre",
        desenvolvedora: formulario.desenvolvedora.trim(),
        lancamento: formulario.lancamento || null,
      };

      if (produtoEditando) {
        const { data, error } = await supabase
          .from("produtos")
          .update(dados)
          .eq("id", produtoEditando.id)
          .select()
          .single();

        if (error) throw error;

        console.log("Produto atualizado:", data);

        setProdutos((anterior) =>
          anterior.map((produto) =>
            produto.id === produtoEditando.id ? data : produto
          )
        );

        if (produtoSelecionado?.id === produtoEditando.id) {
          setProdutoSelecionado(data);
        }
      } else {
        const { data, error } = await supabase
          .from("produtos")
          .insert([dados])
          .select()
          .single();

        if (error) throw error;

        console.log("Produto criado:", data);

        setProdutos((anterior) => [...anterior, data]);
      }

      setMostrarFormulario(false);
      setProdutoEditando(null);
      setFormulario(formularioInicial);
    } catch (err) {
      console.error("Erro ao salvar produto:", err);

      alert(
        `Erro ao salvar produto:\n${
          err?.message || "Erro desconhecido"
        }`
      );
    } finally {
      setSalvando(false);
    }
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function excluirProduto(produto) {
    const confirmar = window.confirm(
      `Deseja realmente excluir "${produto.nome}"?`
    );

    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from("produtos")
        .delete()
        .eq("id", produto.id);

      if (error) throw error;

      console.log("Produto excluído:", produto);

      setProdutos((anterior) =>
        anterior.filter((item) => item.id !== produto.id)
      );

      if (produtoSelecionado?.id === produto.id) {
        setProdutoSelecionado(null);
      }

      setCarrinho((anterior) =>
        anterior.filter((item) => item.id !== produto.id)
      );

      setFavoritos((anterior) =>
        anterior.filter((item) => item.id !== produto.id)
      );
    } catch (err) {
      console.error("Erro ao excluir produto:", err);
      alert(`Erro ao excluir:\n${err?.message || "Erro desconhecido"}`);
    }
  }

  /* =======================================================
     ESTILOS
  ======================================================= */

  const styles = {
    app: {
      minHeight: "100vh",
      background:
        "radial-gradient(circle at 80% -10%, rgba(89,179,126,.10), transparent 28%), radial-gradient(circle at 0% 30%, rgba(89,179,126,.035), transparent 25%), #080D0A",
      color: "#fff",
      fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      overflowX: "hidden",
    },

    header: {
      position: "sticky",
      top: 0,
      zIndex: 100,
      height: 76,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 5vw",
      background: "rgba(8,13,10,.84)",
      backdropFilter: "blur(18px)",
      borderBottom: "1px solid rgba(255,255,255,.07)",
    },

    logo: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      cursor: "pointer",
    },

    logoImage: {
      width: 155,
      maxWidth: "42vw",
      height: 46,
      objectFit: "contain",
      objectPosition: "left center",
      display: "block",
      cursor: "pointer",
      filter: "drop-shadow(0 0 18px rgba(89,179,126,.22))",
      transition: "transform .28s ease, filter .28s ease",
    },

    logoFallback: {
      alignItems: "center",
      gap: 10,
    },

    logoBox: {
      width: 36,
      height: 36,
      borderRadius: 11,
      background: "#59B37E",
      color: "#080D0A",
      display: "grid",
      placeItems: "center",
      fontWeight: 950,
      fontSize: 17,
      boxShadow: "0 0 28px rgba(89,179,126,.28)",
    },

    logoTitle: {
      fontWeight: 950,
      letterSpacing: ".08em",
      fontSize: 19,
    },

    logoSub: {
      color: "#777",
      fontSize: 9,
      letterSpacing: ".16em",
      textTransform: "uppercase",
    },

    nav: {
      display: "flex",
      gap: 28,
      alignItems: "center",
    },

    navButton: {
      border: 0,
      background: "transparent",
      color: "#aaa",
      cursor: "pointer",
      fontSize: 13,
      fontWeight: 700,
    },

    hero: {
      position: "relative",
      minHeight: 500,
      display: "flex",
      alignItems: "center",
      padding: "80px 7vw",
      overflow: "hidden",
      background:
        "linear-gradient(90deg, rgba(5,14,9,.98) 4%, rgba(8,20,13,.88) 39%, rgba(8,20,13,.42) 72%, rgba(8,20,13,.18) 100%), url('/banner-volt.jpg'), url('https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=2000&q=90')",
      backgroundSize: "cover, cover, cover",
      backgroundPosition: "center, center, center",
      backgroundRepeat: "no-repeat, no-repeat, no-repeat",
      borderBottom: "1px solid rgba(89,179,126,.14)",
    },

    heroLogoMark: {
      position: "absolute",
      zIndex: 1,
      right: "-5vw",
      top: "50%",
      transform: "translateY(-50%)",
      width: "min(44vw, 660px)",
      opacity: .13,
      pointerEvents: "none",
      filter: "drop-shadow(0 0 52px rgba(89,179,126,.34)) saturate(.9)",
    },

    heroGlow: {
      position: "absolute",
      width: 500,
      height: 500,
      borderRadius: "50%",
      background: "rgba(89,179,126,.08)",
      filter: "blur(100px)",
      right: -180,
      top: -180,
      pointerEvents: "none",
    },

    heroContent: {
      position: "relative",
      zIndex: 2,
      maxWidth: 650,
    },

    eyebrow: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px",
      borderRadius: 100,
      background: "rgba(89,179,126,.08)",
      border: "1px solid rgba(89,179,126,.16)",
      color: "#59B37E",
      fontSize: 10,
      fontWeight: 900,
      letterSpacing: ".15em",
      textTransform: "uppercase",
    },

    heroTitle: {
      margin: "20px 0 14px",
      fontSize: "clamp(48px, 7vw, 92px)",
      lineHeight: .88,
      fontWeight: 1000,
      letterSpacing: "-.07em",
    },

    heroHighlight: {
      color: "#59B37E",
      textShadow: "0 0 35px rgba(89,179,126,.16)",
    },

    heroText: {
      color: "#aaa",
      maxWidth: 590,
      lineHeight: 1.7,
      fontSize: 15,
    },

    heroButtons: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
      marginTop: 28,
    },

    primaryButton: {
      border: 0,
      borderRadius: 12,
      background: "#59B37E",
      color: "#080D0A",
      padding: "14px 20px",
      fontWeight: 900,
      cursor: "pointer",
      boxShadow: "0 10px 30px rgba(89,179,126,.12)",
    },

    secondaryButton: {
      border: "1px solid rgba(255,255,255,.12)",
      borderRadius: 12,
      background: "rgba(255,255,255,.04)",
      color: "#fff",
      padding: "14px 20px",
      fontWeight: 800,
      cursor: "pointer",
    },

    stats: {
      display: "flex",
      gap: 35,
      marginTop: 40,
      flexWrap: "wrap",
    },

    statNumber: {
      fontSize: 25,
      fontWeight: 950,
      color: "#fff",
    },

    statLabel: {
      color: "#777",
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: ".12em",
    },

    section: {
      padding: "65px 5vw",
      maxWidth: 1500,
      margin: "0 auto",
    },

    sectionHeader: {
      display: "flex",
      alignItems: "end",
      justifyContent: "space-between",
      gap: 20,
      marginBottom: 25,
    },

    sectionTitle: {
      margin: 0,
      fontFamily: "Orbitron, Inter, ui-sans-serif, system-ui, sans-serif",
      fontSize: 30,
      fontWeight: 900,
      letterSpacing: ".055em",
      textShadow: "0 0 24px rgba(89,179,126,.18)",
    },

    sectionSubtitle: {
      color: "#59B37E",
      fontFamily: "Space Grotesk, Inter, ui-sans-serif, system-ui, sans-serif",
      fontSize: 15,
      fontWeight: 700,
      fontStyle: "italic",
      letterSpacing: ".12em",
      marginTop: 7,
      textShadow: "0 0 18px rgba(89,179,126,.18)",
    },

    categories: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: 13,
    },

    categoryCard: {
      position: "relative",
      height: 170,
      overflow: "hidden",
      borderRadius: 17,
      border: "1px solid rgba(89,179,126,.14)",
      background: "linear-gradient(135deg, #12251a, #080d0a)",
      cursor: "pointer",
      boxShadow: "0 12px 34px rgba(0,0,0,.18)",
      transition: "transform .35s cubic-bezier(.2,.8,.2,1), border-color .35s ease, box-shadow .35s ease",
    },

    categoryImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "center",
      display: "block",
      filter: "saturate(.88) contrast(1.06)",
      transition: "transform .65s cubic-bezier(.2,.8,.2,1), filter .65s ease",
    },

    categoryOverlay: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(0deg, rgba(4,12,7,.96), rgba(4,12,7,.12) 72%), linear-gradient(135deg, rgba(51,127,88,.10), transparent 58%)",
      display: "flex",
      alignItems: "end",
      padding: 17,
      borderTop: "1px solid rgba(89,179,126,.08)",
    },

    categoryName: {
      fontFamily: "Space Grotesk, Inter, ui-sans-serif, system-ui, sans-serif",
      fontWeight: 700,
      fontSize: 15,
      letterSpacing: ".01em",
      textShadow: "0 2px 16px rgba(0,0,0,.55)",
    },

    toolbar: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 25,
    },

    search: {
      flex: "1 1 300px",
      minWidth: 230,
      padding: "14px 16px",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,.09)",
      outline: "none",
      background: "#0d1118",
      color: "#fff",
      fontSize: 13,
    },

    select: {
      padding: "14px 16px",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,.09)",
      outline: "none",
      background: "#0d1118",
      color: "#fff",
      fontSize: 13,
    },

    productGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: 18,
    },

    productCard: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 19,
      background:
        "linear-gradient(145deg, rgba(255,255,255,.055), rgba(255,255,255,.018))",
      border: "1px solid rgba(255,255,255,.075)",
      transition: "transform .25s ease, border-color .25s ease, box-shadow .25s ease",
    },

    productImageWrap: {
      height: 185,
      position: "relative",
      overflow: "hidden",
      background: "#0c1015",
    },

    productImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
      transition: "transform .45s ease",
    },

    heart: {
      position: "absolute",
      right: 12,
      top: 12,
      width: 38,
      height: 38,
      borderRadius: "50%",
      border: "1px solid rgba(255,255,255,.15)",
      background: "rgba(0,0,0,.6)",
      color: "#fff",
      cursor: "pointer",
      fontSize: 17,
      zIndex: 2,
    },

    productBody: {
      padding: 17,
    },

    badge: {
      display: "inline-flex",
      padding: "5px 8px",
      borderRadius: 7,
      background: "rgba(89,179,126,.09)",
      color: "#59B37E",
      fontSize: 9,
      fontWeight: 900,
      textTransform: "uppercase",
      letterSpacing: ".08em",
    },

    productName: {
      margin: "12px 0 5px",
      fontSize: 17,
      fontWeight: 900,
      lineHeight: 1.15,
    },

    developer: {
      color: "#777",
      fontSize: 11,
      marginBottom: 12,
    },

    productBottom: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "end",
      gap: 10,
    },

    price: {
      color: "#59B37E",
      fontSize: 20,
      fontWeight: 950,
    },

    stock: {
      fontSize: 10,
      color: "#888",
      marginTop: 4,
    },

    cardActions: {
      display: "flex",
      gap: 7,
      marginTop: 16,
    },

    smallButton: {
      flex: 1,
      padding: "10px 9px",
      borderRadius: 9,
      border: "1px solid rgba(255,255,255,.08)",
      background: "rgba(255,255,255,.035)",
      color: "#fff",
      cursor: "pointer",
      fontSize: 10,
      fontWeight: 800,
    },

    addButton: {
      flex: 1,
      padding: "10px 9px",
      borderRadius: 9,
      border: 0,
      background: "#59B37E",
      color: "#080D0A",
      cursor: "pointer",
      fontSize: 10,
      fontWeight: 900,
    },

    floatingButtons: {
      position: "fixed",
      right: 20,
      bottom: 20,
      zIndex: 200,
      display: "flex",
      flexDirection: "column",
      gap: 10,
    },

    floatingButton: {
      width: 53,
      height: 53,
      borderRadius: 16,
      border: "1px solid rgba(89,179,126,.2)",
      background: "#10151c",
      color: "#fff",
      cursor: "pointer",
      fontSize: 18,
      boxShadow: "0 15px 40px rgba(0,0,0,.35)",
      position: "relative",
    },

    count: {
      position: "absolute",
      right: -4,
      top: -4,
      minWidth: 19,
      height: 19,
      padding: "0 5px",
      borderRadius: 20,
      display: "grid",
      placeItems: "center",
      background: "#59B37E",
      color: "#080D0A",
      fontSize: 9,
      fontWeight: 950,
    },

    overlay: {
      position: "fixed",
      inset: 0,
      zIndex: 1000,
      background: "rgba(0,0,0,.82)",
      backdropFilter: "blur(12px)",
      overflowY: "auto",
      padding: 20,
    },

    modal: {
      width: "min(100%, 1000px)",
      maxHeight: "calc(100vh - 40px)",
      overflowY: "auto",
      overflowX: "hidden",
      margin: "20px auto",
      borderRadius: 24,
      background: "#090c11",
      border: "1px solid rgba(255,255,255,.09)",
      boxShadow: "0 35px 120px rgba(0,0,0,.7)",
      animation: "voltModal .3s ease",
    },

    modalWallpaper: {
      position: "relative",
      width: "100%",
      height: 430,
      overflow: "hidden",
      background: "#080a0e",
    },

    modalWallpaperImage: {
      width: "100%",
      height: "100%",
      display: "block",
      objectFit: "cover",
      objectPosition: "center",
    },

    modalGradient: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(0deg, rgba(9,12,17,1), rgba(9,12,17,.03) 65%)",
    },

    closeButton: {
      position: "absolute",
      right: 18,
      top: 18,
      width: 42,
      height: 42,
      borderRadius: "50%",
      border: "1px solid rgba(255,255,255,.15)",
      background: "rgba(0,0,0,.62)",
      color: "#fff",
      cursor: "pointer",
      fontSize: 20,
      zIndex: 4,
    },

    modalContent: {
      padding: "25px 30px 35px",
    },

    modalTitle: {
      fontSize: "clamp(27px, 4vw, 45px)",
      margin: 0,
      fontWeight: 950,
      letterSpacing: "-.045em",
    },

    modalDescription: {
      color: "#999",
      lineHeight: 1.8,
      fontSize: 14,
      maxWidth: 800,
      marginTop: 15,
    },

    detailGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
      gap: 10,
      marginTop: 25,
    },

    detailBox: {
      padding: 15,
      borderRadius: 14,
      background: "rgba(255,255,255,.035)",
      border: "1px solid rgba(255,255,255,.06)",
    },

    detailLabel: {
      display: "block",
      color: "#666",
      fontSize: 9,
      fontWeight: 900,
      letterSpacing: ".1em",
      textTransform: "uppercase",
      marginBottom: 7,
    },

    detailValue: {
      color: "#fff",
      fontSize: 13,
      fontWeight: 800,
    },

    modalPriceBox: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 20,
      flexWrap: "wrap",
      marginTop: 25,
      padding: 20,
      borderRadius: 17,
      background: "rgba(89,179,126,.055)",
      border: "1px solid rgba(89,179,126,.11)",
    },

    formGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: 13,
    },

    formGroup: {
      display: "flex",
      flexDirection: "column",
      gap: 7,
    },

    formLabel: {
      color: "#999",
      fontSize: 10,
      fontWeight: 800,
    },

    input: {
      width: "100%",
      boxSizing: "border-box",
      padding: "13px 14px",
      borderRadius: 11,
      border: "1px solid rgba(255,255,255,.08)",
      background: "#0d1117",
      color: "#fff",
      outline: "none",
    },

    textarea: {
      width: "100%",
      minHeight: 110,
      resize: "vertical",
      boxSizing: "border-box",
      padding: "13px 14px",
      borderRadius: 11,
      border: "1px solid rgba(255,255,255,.08)",
      background: "#0d1117",
      color: "#fff",
      outline: "none",
    },

    cartItem: {
      display: "flex",
      gap: 13,
      padding: 13,
      borderRadius: 14,
      background: "rgba(255,255,255,.035)",
      marginBottom: 10,
    },

    cartImage: {
      width: 90,
      height: 65,
      objectFit: "cover",
      borderRadius: 9,
    },

    footer: {
      padding: "50px 5vw",
      borderTop: "1px solid rgba(255,255,255,.06)",
      color: "#555",
      textAlign: "center",
      fontSize: 11,
    },
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #080D0A;
          font-family: "Space Grotesk", Inter, ui-sans-serif, system-ui, sans-serif;
        }

        .volt-user-chip { display:flex; align-items:center; gap:8px; min-width:0; max-width:220px; color:#f5f7ef; font-size:11px; font-weight:700; }
        .volt-user-chip img, .volt-user-initial { width:30px; height:30px; border-radius:50%; object-fit:cover; border:1px solid rgba(89,179,126,.55); }
        .volt-user-initial { display:grid; place-items:center; background:#59B37E; color:#080D0A; font-weight:950; }
        .volt-user-name { overflow:hidden; white-space:nowrap; text-overflow:ellipsis; max-width:145px; }
        .volt-logout { border:1px solid rgba(89,179,126,.28); border-radius:10px; background:rgba(89,179,126,.06); color:#59B37E; padding:9px 11px; cursor:pointer; font-weight:800; font-size:11px; }
        .volt-logout:hover { background:rgba(89,179,126,.14); box-shadow:0 0 24px rgba(89,179,126,.08); }
        .volt-auth-shell { min-height:100vh; display:grid; grid-template-columns:minmax(0,1.08fr) minmax(360px,.92fr); background:#080D0A; color:#f6f7f2; font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif; overflow:hidden; }
        .volt-auth-visual { position:relative; min-height:100vh; display:flex; flex-direction:column; justify-content:space-between; padding:clamp(28px,5vw,72px); background:linear-gradient(90deg,rgba(8,13,10,.93),rgba(8,13,10,.55)),linear-gradient(0deg,rgba(8,13,10,.78),transparent 60%),url('/banner-volt.jpg') center/cover; isolation:isolate; }
        .volt-auth-visual::before { content:''; position:absolute; inset:0; z-index:-1; background:radial-gradient(circle at 75% 45%,rgba(89,179,126,.16),transparent 32%); animation:voltAuthGlow 7s ease-in-out infinite alternate; }
        .volt-auth-logo { width:min(210px,65%); max-height:76px; object-fit:contain; object-position:left center; filter:drop-shadow(0 0 22px rgba(89,179,126,.13)); }
        .volt-auth-copy { max-width:620px; animation:voltAuthIn .75s cubic-bezier(.2,.8,.2,1) both; }
        .volt-auth-copy h1 { margin:18px 0; font-size:clamp(42px,6.5vw,88px); line-height:.92; letter-spacing:-.075em; font-weight:950; }
        .volt-auth-copy h1 span { color:#59B37E; text-shadow:0 0 38px rgba(89,179,126,.12); }
        .volt-auth-copy p { max-width:440px; color:#a9afa2; font-size:15px; line-height:1.8; }
        .volt-auth-tag { display:inline-flex; align-items:center; gap:9px; border:1px solid rgba(89,179,126,.24); background:rgba(89,179,126,.06); border-radius:99px; padding:9px 13px; color:#59B37E; font-size:10px; font-weight:900; letter-spacing:.16em; text-transform:uppercase; }
        .volt-auth-tag i { width:6px; height:6px; border-radius:50%; background:#59B37E; box-shadow:0 0 12px #59B37E; }
        .volt-auth-side { display:grid; place-items:center; padding:34px; background:radial-gradient(circle at 50% 0%,rgba(89,179,126,.065),transparent 38%),#0A120D; }
        .volt-auth-card { width:min(100%,430px); padding:clamp(24px,4vw,42px); border:1px solid rgba(255,255,255,.09); border-radius:24px; background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.015)); box-shadow:0 30px 100px rgba(0,0,0,.32); animation:voltAuthIn .65s cubic-bezier(.2,.8,.2,1) both; }
        .volt-auth-card h2 { margin:0; font-size:29px; letter-spacing:-.05em; font-weight:900; }
        .volt-auth-muted { color:#92998e; font-size:13px; line-height:1.65; margin:10px 0 25px; }
        .volt-auth-label { display:block; margin:15px 0 7px; color:#c8cdc2; font-size:11px; font-weight:800; letter-spacing:.04em; }
        .volt-auth-input { width:100%; border:1px solid rgba(255,255,255,.11); border-radius:12px; outline:none; background:#0C1510; color:#fff; padding:14px 15px; font:inherit; font-size:13px; transition:border .2s,box-shadow .2s; }
        .volt-auth-input:focus { border-color:rgba(89,179,126,.65); box-shadow:0 0 0 3px rgba(89,179,126,.08); }
        .volt-auth-primary,.volt-auth-google { width:100%; display:flex; align-items:center; justify-content:center; gap:10px; border-radius:12px; padding:14px 16px; font:inherit; font-size:12px; font-weight:900; cursor:pointer; transition:transform .2s,box-shadow .2s,background .2s; }
        .volt-auth-primary { margin-top:18px; border:0; background:#59B37E; color:#090b0e; box-shadow:0 8px 26px rgba(89,179,126,.09); }
        .volt-auth-primary:hover { transform:translateY(-2px); box-shadow:0 12px 34px rgba(89,179,126,.19); }
        .volt-auth-primary:disabled,.volt-auth-google:disabled { opacity:.6; cursor:wait; }
        .volt-auth-google { border:1px solid rgba(255,255,255,.13); background:rgba(255,255,255,.035); color:#f6f7f2; }
        .volt-auth-google:hover { background:rgba(255,255,255,.07); transform:translateY(-1px); }
        .volt-auth-divider { display:flex; align-items:center; gap:12px; margin:21px 0; color:#666e63; font-size:10px; text-transform:uppercase; letter-spacing:.13em; }
        .volt-auth-divider::before,.volt-auth-divider::after { content:''; height:1px; flex:1; background:rgba(255,255,255,.09); }
        .volt-auth-switch { width:100%; border:0; background:transparent; color:#b4bbac; padding:18px 0 0; font:inherit; font-size:12px; cursor:pointer; }
        .volt-auth-switch strong { color:#59B37E; }
        .volt-auth-error,.volt-auth-success { margin-top:15px; padding:12px 13px; border-radius:10px; font-size:12px; line-height:1.55; }
        .volt-auth-error { color:#ff9c9c; background:rgba(255,77,77,.08); border:1px solid rgba(255,77,77,.2); }
        .volt-auth-success { color:#59B37E; background:rgba(89,179,126,.06); border:1px solid rgba(89,179,126,.18); }
        .volt-auth-small { margin-top:24px; color:#5e655b; font-size:10px; line-height:1.6; text-align:center; }
        @keyframes voltAuthIn { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes voltAuthGlow { from { opacity:.45; transform:scale(1); } to { opacity:1; transform:scale(1.04); } }
        @media (max-width:850px) { .volt-auth-shell { grid-template-columns:1fr; } .volt-auth-visual { display:none; } .volt-auth-side { min-height:100vh; padding:20px; } }
        @media (max-width:760px) { .volt-user-name { display:none; } .volt-user-chip { max-width:35px; } }

        button,
        input,
        textarea,
        select {
          font-family: inherit;
        }

        button {
          transition: transform .18s ease, opacity .18s ease, border-color .18s ease, background .18s ease;
        }

        button:hover {
          transform: translateY(-1px);
        }

        ::selection {
          background: #59B37E;
          color: #080D0A;
        }

        @keyframes voltModal {
          from {
            opacity: 0;
            transform: translateY(20px) scale(.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes voltFloat {
          0%, 100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-7px);
          }
        }

        @keyframes voltPulse {
          0%, 100% {
            box-shadow: 0 0 0 rgba(89,179,126,0);
          }

          50% {
            box-shadow: 0 0 35px rgba(89,179,126,.12);
          }
        }

        .volt-card:hover {
          transform: translateY(-6px);
          border-color: rgba(89,179,126,.2) !important;
          box-shadow: 0 25px 60px rgba(0,0,0,.3);
        }

        .volt-card:hover img {
          transform: scale(1.045);
        }

        .volt-section-heading h2,
        .volt-explore-word {
          font-family: 'Orbitron', 'Space Grotesk', sans-serif !important;
        }

        .volt-section-heading h2 {
          letter-spacing: .04em !important;
          font-weight: 900 !important;
          background: linear-gradient(100deg, #ffffff 10%, #59B37E 55%, #337F58 95%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 18px rgba(89,179,126,.12));
        }

        .volt-explore-word {
          font-weight: 600 !important;
          font-style: normal !important;
          letter-spacing: .22em !important;
          text-transform: uppercase;
        }

        .volt-category {
          animation: voltCategoryReveal .7s cubic-bezier(.2,.8,.2,1) both;
          isolation: isolate;
        }

        .volt-category::after {
          content: "";
          position: absolute;
          inset: -1px;
          z-index: 1;
          border-radius: inherit;
          pointer-events: none;
          background: linear-gradient(115deg, transparent 20%, rgba(89,179,126,.18) 48%, transparent 70%);
          transform: translateX(-130%);
          transition: transform .75s ease;
        }

        .volt-category:hover {
          transform: translateY(-7px) scale(1.012);
          border-color: rgba(89,179,126,.52) !important;
          box-shadow: 0 20px 48px rgba(0,0,0,.34), 0 0 26px rgba(89,179,126,.09);
        }

        .volt-category img {
          transition: transform .65s cubic-bezier(.2,.8,.2,1), filter .65s ease;
        }

        .volt-category:hover img {
          transform: scale(1.09);
          filter: saturate(1.08) contrast(1.08);
        }

        .volt-category:hover::after { transform: translateX(130%); }

        .volt-category:nth-child(2) { animation-delay: .07s; }
        .volt-category:nth-child(3) { animation-delay: .14s; }
        .volt-category:nth-child(4) { animation-delay: .21s; }
        .volt-category:nth-child(5) { animation-delay: .28s; }
        .volt-category:nth-child(6) { animation-delay: .35s; }

        .volt-section-heading { animation: voltHeadingIn .8s cubic-bezier(.2,.8,.2,1) both; }
        .volt-section-heading h2 { animation: voltTitleGlow 4.5s ease-in-out infinite; }
        .volt-section-heading .volt-explore-word { display:inline-block; transform-origin:left center; animation: voltExploreIn .9s .12s cubic-bezier(.2,.8,.2,1) both; }

        @keyframes voltCategoryReveal {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes voltHeadingIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes voltExploreIn {
          from { opacity: 0; transform: translateX(-10px) skewX(-8deg); }
          to { opacity: 1; transform: translateX(0) skewX(0); }
        }
        @keyframes voltTitleGlow {
          0%, 100% { text-shadow: 0 0 18px rgba(89,179,126,.10); }
          50% { text-shadow: 0 0 28px rgba(89,179,126,.28); }
        }

        .volt-loading {
          animation: voltFloat 1.4s ease-in-out infinite;
        }

        .volt-hero {
          isolation: isolate;
          background-size: cover, cover, cover !important;
          animation: voltHeroBackground 18s ease-in-out infinite alternate;
        }

        .volt-hero::before {
          content: "";
          position: absolute;
          z-index: 0;
          inset: 0;
          background:
            radial-gradient(ellipse at 78% 45%, rgba(89,179,126,.22), transparent 36%),
            linear-gradient(120deg, transparent 24%, rgba(51,127,88,.12), transparent 72%);
          pointer-events: none;
          animation: voltHeroPulse 5s ease-in-out infinite;
        }

        .volt-hero > * {
          position: relative;
          z-index: 1;
        }

        @keyframes voltHeroPulse {
          0%, 100% { opacity: .55; }
          50% { opacity: 1; }
        }

        @keyframes voltHeroBackground {
          from { background-position: center, center, center; }
          to { background-position: center, 54% center, 54% center; }
        }

        @keyframes voltLogoFloat {
          0%, 100% { transform: translateY(-50%) rotate(-2deg) scale(1); }
          50% { transform: translateY(calc(-50% - 10px)) rotate(1deg) scale(1.025); }
        }

        .volt-hero img {
          animation: voltLogoFloat 7s ease-in-out infinite;
        }

        .volt-hero::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background: linear-gradient(135deg, rgba(51,127,88,.08), transparent 48%, rgba(89,179,126,.04));
          mix-blend-mode: screen;
        }

        .volt-hero + * { scroll-margin-top: 90px; }

        /* Indicador de rolagem: aranha descendo pelo fio */
        .volt-spider-scroll {
          position: absolute !important;
          z-index: 5 !important;
          left: 50%;
          bottom: 18px;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          padding: 8px 12px 4px;
          border: 1px solid rgba(89,179,126,.18);
          border-radius: 999px;
          background: rgba(5,12,8,.42);
          color: #a6cbb2;
          font: 800 8px/1 'Space Grotesk', sans-serif;
          letter-spacing: .2em;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: border-color .25s, background .25s, box-shadow .25s;
        }
        .volt-spider-scroll:hover {
          border-color: rgba(89,179,126,.6);
          background: rgba(16,35,23,.78);
          box-shadow: 0 0 24px rgba(89,179,126,.15);
        }
        .volt-spider-thread {
          position: relative;
          width: 1px;
          height: 43px;
          background: linear-gradient(to bottom, rgba(89,179,126,.12), rgba(89,179,126,.8));
          box-shadow: 0 0 7px rgba(89,179,126,.28);
        }
        .volt-spider-thread::after {
          content: '';
          position: absolute;
          left: -3px;
          bottom: -1px;
          width: 7px;
          height: 7px;
          border-right: 1px solid #59B37E;
          border-bottom: 1px solid #59B37E;
          transform: rotate(45deg);
          opacity: .7;
        }
        .volt-spider {
          position: absolute;
          left: 50%;
          top: 0;
          transform: translate(-50%, -50%);
          display: block;
          font-size: 17px;
          line-height: 1;
          filter: drop-shadow(0 0 5px rgba(89,179,126,.65));
          animation: voltSpiderDescend 2.4s cubic-bezier(.45,0,.55,1) infinite;
          transform-origin: top center;
        }
        @keyframes voltSpiderDescend {
          0%, 100% { top: 2px; transform: translate(-50%, -50%) rotate(-8deg); }
          45% { top: 35px; transform: translate(-50%, -50%) rotate(8deg); }
          55% { top: 35px; transform: translate(-50%, -50%) rotate(-5deg); }
        }
        @media (max-width: 640px) {
          .volt-spider-scroll { bottom: 10px; transform: translateX(-50%) scale(.88); transform-origin: bottom center; }
          .volt-spider-thread { height: 31px; }
          @keyframes voltSpiderDescend {
            0%, 100% { top: 2px; transform: translate(-50%, -50%) rotate(-8deg); }
            45%, 55% { top: 25px; transform: translate(-50%, -50%) rotate(6deg); }
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .volt-spider { animation: none; top: 50%; }
        }

        /* Barra de rolagem VOLT: trilho escuro, polegar verde e aranha descendo */
        html, body, * { scrollbar-width: thin; scrollbar-color: #59B37E #0a100c; }
        ::-webkit-scrollbar { width: 11px; height: 11px; }
        ::-webkit-scrollbar-track { background: linear-gradient(180deg, #080d0a, #101a13, #080d0a); border-left: 1px solid rgba(89,179,126,.12); }
        ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #337F58, #59B37E, #337F58); border: 3px solid #080d0a; border-radius: 999px; box-shadow: 0 0 10px rgba(89,179,126,.28); }
        ::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #59B37E, #a0edb8, #59B37E); }
        .volt-page-spider { position: fixed; z-index: 950; right: 2px; top: 9vh; height: 82vh; width: 22px; pointer-events: none; display: flex; justify-content: center; opacity: .9; }
        .volt-page-spider::before { content: ""; position: absolute; top: 0; height: 100%; width: 1px; background: linear-gradient(180deg, transparent, rgba(89,179,126,.72), rgba(89,179,126,.18), transparent); box-shadow: 0 0 6px rgba(89,179,126,.25); }
        .volt-page-spider span { position: absolute; top: 0; font-size: 17px; line-height: 1; filter: drop-shadow(0 0 5px rgba(89,179,126,.8)); animation: voltSideSpider 5.5s ease-in-out infinite; }
        @keyframes voltSideSpider { 0%, 100% { top: 0; transform: translateX(-2px) rotate(-12deg); } 48% { top: calc(100% - 20px); transform: translateX(2px) rotate(12deg); } 52% { top: calc(100% - 20px); transform: translateX(-1px) rotate(-8deg); } }
        /* O mesmo detalhe aparece dentro de cada modal com rolagem própria */
        /* Carrinho e favoritos: experiência premium VOLT */
        .volt-cart-modal, .volt-favorites-modal {
          isolation: isolate;
          background: radial-gradient(ellipse at 8% 0%, rgba(89,179,126,.12), transparent 36%), linear-gradient(145deg,#0b130e 0%,#090c11 55%,#080d0a 100%) !important;
          border: 1px solid rgba(89,179,126,.28) !important;
          box-shadow: 0 35px 120px rgba(0,0,0,.76), 0 0 55px rgba(89,179,126,.08), inset 0 1px rgba(255,255,255,.045) !important;
          animation: voltModal .42s cubic-bezier(.16,1,.3,1), voltCartAura 5s ease-in-out .45s infinite;
        }
        .volt-cart-modal::after, .volt-favorites-modal::after {
          content: ""; position: absolute; inset: 0 0 auto; height: 2px; z-index: 5; pointer-events: none;
          background: linear-gradient(90deg,transparent,#337F58,#9cf5bd,#59B37E,transparent);
          background-size: 220% 100%; animation: voltModalBeam 3.8s linear infinite;
        }
        .volt-modal-heading { position: relative; padding: 5px 0 17px; }
        .volt-modal-kicker { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 9px; color: #59B37E; font: 800 9px/1 'Space Grotesk',sans-serif; letter-spacing: .24em; }
        .volt-modal-kicker::before { content: ''; width: 18px; height: 1px; background: #59B37E; box-shadow: 0 0 9px #59B37E; }
        .volt-modal-heading h2 { text-shadow: 0 0 28px rgba(89,179,126,.14); }
        .volt-modal-subtitle { margin: 8px 0 0; color: #89978b; font-size: 12px; letter-spacing: .01em; }
        .volt-heading-count { display: inline-grid; place-items: center; vertical-align: middle; min-width: 27px; height: 27px; margin-left: 5px; padding: 0 7px; border-radius: 9px; color: #07110a; background: linear-gradient(135deg,#9cf5bd,#59B37E); font: 900 12px 'Space Grotesk',sans-serif; box-shadow: 0 0 22px rgba(89,179,126,.24); animation: voltCountPop .45s cubic-bezier(.2,1.6,.4,1) both; }
        .volt-cart-modal .volt-modal-content, .volt-favorites-modal .volt-modal-content { position: relative; }
        .volt-cart-item { position: relative; overflow: hidden; align-items: center; border: 1px solid rgba(255,255,255,.065); background: linear-gradient(115deg,rgba(255,255,255,.045),rgba(89,179,126,.025)) !important; box-shadow: inset 0 1px rgba(255,255,255,.025); transition: transform .28s cubic-bezier(.2,.8,.2,1),border-color .28s,background .28s,box-shadow .28s !important; animation: voltItemEnter .48s cubic-bezier(.2,.8,.2,1) both; }
        .volt-cart-item::before { content: ''; position: absolute; inset: 0 auto 0 0; width: 2px; background: linear-gradient(180deg,transparent,#59B37E,transparent); transform: scaleY(.35); opacity: .55; transition: transform .3s,opacity .3s; }
        .volt-cart-item:hover { transform: translateY(-3px) translateX(2px); border-color: rgba(89,179,126,.3); background: linear-gradient(115deg,rgba(89,179,126,.09),rgba(255,255,255,.025)) !important; box-shadow: 0 14px 28px rgba(0,0,0,.18),0 0 22px rgba(89,179,126,.045); }
        .volt-cart-item:hover::before { transform: scaleY(1); opacity: 1; }
        .volt-cart-item img { flex-shrink: 0; border: 1px solid rgba(89,179,126,.18); box-shadow: 0 7px 20px rgba(0,0,0,.28); transition: transform .4s,filter .4s,border-color .4s !important; }
        .volt-cart-item:hover img { transform: scale(1.045); filter: saturate(1.15); border-color: rgba(89,179,126,.45); }
        .volt-favorite-card { position: relative; border-color: rgba(255,255,255,.075) !important; background: linear-gradient(145deg,rgba(255,255,255,.045),rgba(89,179,126,.025)) !important; box-shadow: 0 12px 28px rgba(0,0,0,.14),inset 0 1px rgba(255,255,255,.025); animation: voltItemEnter .52s cubic-bezier(.2,.8,.2,1) both; transition: transform .32s cubic-bezier(.2,.8,.2,1),border-color .3s,box-shadow .3s !important; }
        .volt-favorite-card::before { content: '♥'; position: absolute; top: 10px; right: 10px; z-index: 2; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 10px; color: #9cf5bd; background: rgba(7,17,10,.78); border: 1px solid rgba(89,179,126,.28); backdrop-filter: blur(10px); box-shadow: 0 0 18px rgba(89,179,126,.09); animation: voltHeartBeat 2.8s ease-in-out infinite; }
        .volt-favorite-card:hover { transform: translateY(-7px) scale(1.012); border-color: rgba(89,179,126,.38) !important; box-shadow: 0 22px 42px rgba(0,0,0,.32),0 0 30px rgba(89,179,126,.09); }
        .volt-favorite-card img { display: block; transition: transform .55s cubic-bezier(.2,.8,.2,1),filter .55s; }
        .volt-favorite-card:hover img { transform: scale(1.07); filter: saturate(1.18) contrast(1.04); }
        .volt-favorite-card > div { position: relative; }
        .volt-cart-modal .volt-modal-price-box, .volt-cart-modal [style*="modalPriceBox"] { border-color: rgba(89,179,126,.22) !important; background: linear-gradient(110deg,rgba(89,179,126,.11),rgba(89,179,126,.035)) !important; box-shadow: 0 0 28px rgba(89,179,126,.04),inset 0 1px rgba(255,255,255,.035); }
        .volt-cart-modal button, .volt-favorites-modal button { transition: transform .22s cubic-bezier(.2,.8,.2,1),box-shadow .22s,border-color .22s,background .22s !important; }
        .volt-cart-modal button:hover, .volt-favorites-modal button:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(89,179,126,.11); }
        .volt-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 235px; gap: 10px; border: 1px dashed rgba(89,179,126,.2); border-radius: 18px; background: radial-gradient(circle at 50% 20%,rgba(89,179,126,.08),transparent 65%); animation: voltItemEnter .5s ease both; }
        .volt-empty-state strong { color: #e8f2e9; font-size: 15px; }
        .volt-empty-state p { margin: 0; max-width: 300px; color: #788579; font-size: 12px; line-height: 1.7; }
        .volt-empty-icon { display: grid; place-items: center; width: 62px; height: 62px; margin-bottom: 5px; border: 1px solid rgba(89,179,126,.23); border-radius: 20px; background: rgba(89,179,126,.065); color: #59B37E; font-size: 31px; text-shadow: 0 0 24px rgba(89,179,126,.3); animation: voltFloat 3s ease-in-out infinite; }
        @keyframes voltModalBeam { 0% { background-position: 100% 0; } 100% { background-position: -120% 0; } }
        @keyframes voltCartAura { 0%,100% { box-shadow: 0 35px 120px rgba(0,0,0,.76),0 0 35px rgba(89,179,126,.055),inset 0 1px rgba(255,255,255,.045); } 50% { box-shadow: 0 35px 120px rgba(0,0,0,.76),0 0 58px rgba(89,179,126,.12),inset 0 1px rgba(255,255,255,.045); } }
        @keyframes voltItemEnter { from { opacity: 0; transform: translateY(13px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes voltCountPop { from { opacity: 0; transform: scale(.55) rotate(-10deg); } to { opacity: 1; transform: scale(1) rotate(0); } }
        @keyframes voltHeartBeat { 0%,80%,100% { transform: scale(1); } 86% { transform: scale(1.14); } 92% { transform: scale(.96); } }
        @media (max-width: 600px) { .volt-cart-modal .volt-modal-content, .volt-favorites-modal .volt-modal-content { padding: 20px !important; } .volt-cart-item { align-items: flex-start; gap: 10px !important; padding: 10px !important; } .volt-cart-item img { width: 76px !important; height: 72px !important; } .volt-modal-subtitle { max-width: 260px; line-height: 1.6; } }
        @media (prefers-reduced-motion: reduce) { .volt-cart-modal, .volt-favorites-modal, .volt-cart-item, .volt-favorite-card, .volt-empty-icon, .volt-favorite-card::before { animation: none !important; transition: none !important; } }

        .volt-modal { position: relative; scrollbar-width: thin; scrollbar-color: #59B37E #0a100c; }
        .volt-modal::before { content: "🕷️"; position: sticky; top: 12px; float: right; margin-right: 10px; margin-bottom: -22px; z-index: 30; display: block; width: 18px; height: 22px; font-size: 16px; line-height: 22px; pointer-events: none; filter: drop-shadow(0 0 6px rgba(89,179,126,.85)); animation: voltModalSideSpider 4.2s ease-in-out infinite; }
        .volt-modal::-webkit-scrollbar { width: 10px; }
        .volt-modal::-webkit-scrollbar-track { background: #0a100c; border-left: 1px solid rgba(89,179,126,.18); }
        .volt-modal::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #337F58, #59B37E); border: 2px solid #0a100c; border-radius: 999px; }
        @keyframes voltModalSideSpider { 0%, 100% { transform: translateY(0) rotate(-9deg); } 48% { transform: translateY(min(58vh, 360px)) rotate(10deg); } 52% { transform: translateY(min(58vh, 360px)) rotate(-5deg); } }
        @media (max-width: 700px) { .volt-page-spider { right: 0; width: 15px; opacity: .72; } .volt-page-spider span { font-size: 14px; } .volt-modal::before { margin-right: 5px; } }
        @media (prefers-reduced-motion: reduce) { .volt-page-spider span, .volt-modal::before { animation: none !important; } }

        header img[alt*="VOLT"] { transition: transform .28s ease, filter .28s ease; }
        header img[alt*="VOLT"]:hover { transform: scale(1.035); filter: drop-shadow(0 0 22px rgba(89,179,126,.32)); }

        .volt-gameplay-section { position:relative; overflow:hidden; isolation:isolate; }
        .volt-gameplay-section::before { content:""; position:absolute; width:420px; height:420px; border-radius:50%; left:-180px; top:10%; background:rgba(51,127,88,.13); filter:blur(90px); z-index:-1; animation:voltAmbient 8s ease-in-out infinite alternate; pointer-events:none; }
        .volt-gameplay-section::after { content:""; position:absolute; width:360px; height:360px; border-radius:50%; right:-150px; bottom:-60px; background:rgba(89,179,126,.09); filter:blur(90px); z-index:-1; animation:voltAmbient 10s ease-in-out infinite alternate-reverse; pointer-events:none; }
        .volt-gameplay-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:24px; animation:voltHeadingIn .8s both; }
        .volt-gameplay-kicker { color:#59B37E; font-size:10px; font-weight:900; letter-spacing:.22em; text-transform:uppercase; display:flex; align-items:center; gap:9px; }
        .volt-gameplay-kicker::before { content:""; display:block; width:22px; height:2px; background:#59B37E; box-shadow:0 0 12px #59B37E; }
        .volt-gameplay-title { margin:9px 0 0; color:#f4f7f1; font:900 clamp(25px,4vw,42px)/1.1 'Orbitron','Space Grotesk',sans-serif; letter-spacing:-.04em; }
        .volt-gameplay-title span { color:#59B37E; text-shadow:0 0 24px rgba(89,179,126,.22); }
        .volt-gameplay-desc { margin:10px 0 0; max-width:540px; color:#929b91; font-size:13px; line-height:1.7; }
        .volt-gameplay-layout { display:grid; grid-template-columns:minmax(0,1.65fr) minmax(250px,.85fr); gap:18px; align-items:stretch; }
        .volt-feature-video { position:relative; min-width:0; overflow:hidden; border:1px solid rgba(89,179,126,.25); border-radius:20px; background:#0b120e; box-shadow:0 22px 65px rgba(0,0,0,.24); animation:voltVideoReveal .85s .08s both; transition:transform .35s,border-color .35s,box-shadow .35s; }
        .volt-feature-video:hover { transform:translateY(-5px); border-color:rgba(89,179,126,.62); box-shadow:0 28px 70px rgba(0,0,0,.34),0 0 32px rgba(89,179,126,.08); }
        .volt-video-frame { position:relative; aspect-ratio:16/9; background:#050806; overflow:hidden; }
        .volt-video-frame iframe { position:absolute; inset:0; width:100%; height:100%; border:0; }
        .volt-video-caption { display:flex; justify-content:space-between; align-items:center; gap:16px; padding:17px 19px 19px; }
        .volt-video-caption h3 { margin:0; color:#f4f7f1; font-size:15px; font-weight:900; }
        .volt-video-caption p { margin:6px 0 0; color:#899287; font-size:11px; line-height:1.5; }
        .volt-video-live { flex-shrink:0; color:#59B37E; border:1px solid rgba(89,179,126,.24); background:rgba(89,179,126,.07); border-radius:99px; padding:7px 9px; font-size:9px; font-weight:900; letter-spacing:.1em; }
        .volt-gameplay-list { display:grid; grid-template-rows:repeat(3,minmax(0,1fr)); gap:12px; }
        .volt-gameplay-link { position:relative; display:flex; align-items:center; gap:14px; min-width:0; text-decoration:none; color:inherit; border:1px solid rgba(255,255,255,.075); border-radius:16px; padding:13px; background:linear-gradient(115deg,rgba(255,255,255,.045),rgba(255,255,255,.012)); overflow:hidden; transition:transform .28s,border-color .28s,background .28s,box-shadow .28s; animation:voltVideoReveal .7s both; }
        .volt-gameplay-link:nth-child(2) { animation-delay:.12s; } .volt-gameplay-link:nth-child(3) { animation-delay:.24s; }
        .volt-gameplay-link:hover { transform:translateX(5px); border-color:rgba(89,179,126,.42); background:rgba(89,179,126,.055); box-shadow:0 12px 30px rgba(0,0,0,.18); }
        .volt-gameplay-art { flex-shrink:0; width:82px; height:78px; display:grid; place-items:center; border-radius:11px; color:#59B37E; font:900 24px 'Orbitron',sans-serif; background:radial-gradient(circle at 70% 20%,rgba(89,179,126,.28),transparent 40%),linear-gradient(135deg,#14251a,#090e0b 70%); border:1px solid rgba(89,179,126,.15); position:relative; overflow:hidden; }
        .volt-gameplay-art::after { content:""; position:absolute; inset:-60% -100%; background:linear-gradient(110deg,transparent 42%,rgba(255,255,255,.12),transparent 55%); transform:translateX(-70%); transition:transform .6s; }
        .volt-gameplay-link:hover .volt-gameplay-art::after { transform:translateX(70%); }
        .volt-gameplay-meta { min-width:0; flex:1; }
        .volt-gameplay-meta strong { display:block; color:#e8eee6; font-size:12px; line-height:1.45; }
        .volt-gameplay-meta small { display:block; margin-top:6px; color:#7f8a7f; font-size:10px; line-height:1.5; }
        .volt-gameplay-arrow { color:#59B37E; font-size:18px; transition:transform .25s; }
        .volt-gameplay-link:hover .volt-gameplay-arrow { transform:translate(3px,-3px); }
        @keyframes voltAmbient { from { transform:translate3d(0,-10px,0) scale(.9); opacity:.6; } to { transform:translate3d(30px,20px,0) scale(1.12); opacity:1; } }
        @keyframes voltVideoReveal { from { opacity:0; transform:translateY(20px) scale(.985); } to { opacity:1; transform:translateY(0) scale(1); } }
        @media (max-width:900px) { .volt-gameplay-layout { grid-template-columns:1fr; } .volt-gameplay-list { grid-template-columns:repeat(3,minmax(0,1fr)); grid-template-rows:auto; } .volt-gameplay-link { flex-direction:column; align-items:flex-start; } .volt-gameplay-art { width:100%; height:92px; } .volt-gameplay-arrow { display:none; } }
        @media (max-width:600px) { .volt-gameplay-heading { align-items:flex-start; flex-direction:column; } .volt-gameplay-list { grid-template-columns:1fr; } .volt-gameplay-link { flex-direction:row; align-items:center; } .volt-gameplay-art { width:76px; height:70px; } .volt-video-caption { align-items:flex-start; flex-direction:column; } }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: .01ms !important;
          }
        }

        @media (max-width: 700px) {
          .volt-nav {
            display: none !important;
          }

          .volt-form-grid {
            grid-template-columns: 1fr !important;
          }

          .volt-modal-wallpaper {
            height: 270px !important;
          }

          .volt-modal-content {
            padding: 20px !important;
          }

          .volt-hero {
            min-height: 560px !important;
            background-position: center, 58% center, 58% center !important;
          }
        }
      `}</style>

      <div className="volt-page-spider" aria-hidden="true">
        <span>🕷️</span>
      </div>

      {/* ===================================================
          HEADER
      =================================================== */}

      <header style={styles.header}>
        <div
          style={styles.logo}
          onClick={irInicio}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") irInicio(); }}
          title="VOLT — voltar ao início e mostrar todos os produtos"
        >
          <img
            src="/logo.jpg"
            alt="VOLT — Power Your Game"
            style={styles.logoImage}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              if (e.currentTarget.nextElementSibling) {
                e.currentTarget.nextElementSibling.style.display = "flex";
              }
            }}
          />

          <div style={{ display: "none", ...styles.logoFallback }}>
            <div style={styles.logoBox}>V</div>
            <div>
              <div style={styles.logoTitle}>VOLT</div>
              <div style={styles.logoSub}>Power Your Game</div>
            </div>
          </div>
        </div>

        <nav className="volt-nav" style={styles.nav}>
          <button
            style={styles.navButton}
            onClick={irInicio}
          >
            Início
          </button>

          <button
            style={styles.navButton}
            onClick={() => {
              setCategoriaSelecionada("Todas as categorias");
              setBusca("");
              document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Produtos
          </button>

          <button
            style={styles.navButton}
            onClick={() => {
              setCategoriaSelecionada("Todas as categorias");
              setBusca("");
              document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Ofertas
          </button>

          <button
            style={styles.navButton}
            onClick={() => document.getElementById("gameplays")?.scrollIntoView({ behavior: "smooth" })}
          >
            Gameplays
          </button>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="volt-user-chip" title={user?.email || "Usuário conectado"}>
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Avatar" />
            ) : (
              <span className="volt-user-initial">{(user?.user_metadata?.full_name || user?.email || "V").slice(0, 1).toUpperCase()}</span>
            )}
            <span className="volt-user-name">{user?.user_metadata?.full_name || user?.email || "Conta"}</span>
          </div>
          <button className="volt-logout" onClick={signOut} title="Sair da conta">Sair ↗</button>
          <button
            style={styles.secondaryButton}
            onClick={() => setMostrarFavoritos(true)}
            aria-label={`Abrir favoritos, ${favoritos.length} itens`}
          >
            ♥ {favoritos.length}
          </button>

          <button
            style={styles.primaryButton}
            onClick={() => setMostrarCarrinho(true)}
          >
            Carrinho ({quantidadeCarrinho})
          </button>
        </div>
      </header>

      {/* ===================================================
          HERO
      =================================================== */}

      <section style={styles.hero} className="volt-hero">
        <div style={styles.heroGlow} />
        <div style={styles.heroLogoMark} aria-hidden="true">
          <img src="/logo.jpg" alt="" style={{ width: "100%", height: "auto", objectFit: "contain" }} />
        </div>

        <div style={styles.heroContent}>
          <span style={styles.eyebrow}>
            <span>●</span>
            Gaming Store
          </span>

          <h1 style={styles.heroTitle}>
            POWER
            <br />
            <span style={styles.heroHighlight}>YOUR GAME.</span>
          </h1>

          <p style={styles.heroText}>
            Games, consoles, controles e acessórios para quem leva o
            gameplay a sério.
          </p>

          <div style={styles.heroButtons}>
            <button
              style={styles.primaryButton}
              onClick={() =>
                document
                  .getElementById("catalogo")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Explorar produtos
            </button>

            <button
              style={styles.secondaryButton}
              onClick={() =>
                document
                  .getElementById("catalogo")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Ver catálogo
            </button>
          </div>

          <div style={styles.stats}>
            <div>
              <div style={styles.statNumber}>{produtos.length || 39}+</div>
              <div style={styles.statLabel}>produtos</div>
            </div>

            <div>
              <div style={styles.statNumber}>{categorias.length || 6}</div>
              <div style={styles.statLabel}>categorias</div>
            </div>

            <div>
              <div style={{ ...styles.statNumber, color: "#59B37E", fontSize: 15 }}>
                ONLINE
              </div>
              <div style={styles.statLabel}>Supabase</div>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="volt-spider-scroll"
          aria-label="Descer para explorar os produtos"
          title="Descer para explorar"
          onClick={() => document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" })}
        >
          <span className="volt-spider-thread" aria-hidden="true">
            <span className="volt-spider">🕷</span>
          </span>
          <span>ROLE PARA EXPLORAR</span>
        </button>
      </section>

      {/* ===================================================
          GAMEPLAYS EM DESTAQUE
      =================================================== */}

      <section className="volt-gameplay-section" style={{ ...styles.section, paddingTop: 46, paddingBottom: 46 }} id="gameplays">
        <div className="volt-gameplay-heading">
          <div>
            <div className="volt-gameplay-kicker">VOLT / PLAY</div>
            <h2 className="volt-gameplay-title">Entre no <span>game.</span></h2>
            <p className="volt-gameplay-desc">Veja trailers, momentos de gameplay e novidades do universo gamer antes de escolher sua próxima aventura.</p>
          </div>
          <a href="https://www.youtube.com/gaming" target="_blank" rel="noreferrer" style={{ color: "#59B37E", textDecoration: "none", fontSize: 11, fontWeight: 900, letterSpacing: ".06em", paddingBottom: 5, whiteSpace: "nowrap" }}>
            MAIS VÍDEOS ↗
          </a>
        </div>

        <div className="volt-gameplay-layout">
          <article className="volt-feature-video">
            <div className="volt-video-frame">
              <iframe
                src="https://www.youtube-nocookie.com/embed/ZRhJT2nmvA4?rel=0&modestbranding=1"
                title="Marvel's Spider-Man 2 — Gameplay Reveal oficial"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <div className="volt-video-caption">
              <div>
                <h3>Gameplay & próximos lançamentos</h3>
                <p>Gameplay oficial de Marvel's Spider-Man 2, publicado pelo canal verificado PlayStation.</p>
              </div>
              <span className="volt-video-live">VOLT SELECT</span>
            </div>
          </article>

          <div className="volt-gameplay-list">
            <a className="volt-gameplay-link" href="https://www.youtube.com/watch?v=ZRhJT2nmvA4" target="_blank" rel="noreferrer">
              <div className="volt-gameplay-art" aria-hidden="true">SP</div>
              <div className="volt-gameplay-meta"><strong>Marvel's Spider-Man 2</strong><small>Combate, exploração e ação em Nova York</small></div>
              <span className="volt-gameplay-arrow" aria-hidden="true">↗</span>
            </a>
            <a className="volt-gameplay-link" href="https://www.youtube.com/watch?v=g1wr0DfV73E" target="_blank" rel="noreferrer">
              <div className="volt-gameplay-art" aria-hidden="true">GOW</div>
              <div className="volt-gameplay-meta"><strong>God of War Ragnarök</strong><small>Combates intensos e aventura épica</small></div>
              <span className="volt-gameplay-arrow" aria-hidden="true">↗</span>
            </a>
            <a className="volt-gameplay-link" href="https://www.youtube.com/watch?v=TSi0iJYSQ24" target="_blank" rel="noreferrer">
              <div className="volt-gameplay-art" aria-hidden="true">FC26</div>
              <div className="volt-gameplay-meta"><strong>EA SPORTS FC 26</strong><small>Jogadas, partidas e futebol virtual</small></div>
              <span className="volt-gameplay-arrow" aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* ===================================================
          CATEGORIAS
      =================================================== */}

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div className="volt-section-heading">
            <h2 style={styles.sectionTitle}>VOLT</h2>
            <div className="volt-explore-word" style={styles.sectionSubtitle}>Explore</div>
          </div>

          <div style={{ color: "#777", fontSize: 12 }}>
            {categorias.length} categorias
          </div>
        </div>

        <div style={styles.categories}>
          {categorias.map((categoria) => (
            <div
              className="volt-category"
              key={categoria.id}
              style={styles.categoryCard}
              onClick={() => {
                setCategoriaSelecionada(nomeCategoria(categoria));
                document
                  .getElementById("catalogo")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <img
                src={imagemCategoria(categoria)}
                alt={nomeCategoria(categoria)}
                loading="lazy"
                style={styles.categoryImage}
                onError={(event) => {
                  const img = event.currentTarget;
                  const fallbacks = imagensFallbackCategoria(categoria);
                  const currentIndex = Number(img.dataset.fallbackIndex || "0");
                  if (currentIndex < fallbacks.length) {
                    img.dataset.fallbackIndex = String(currentIndex + 1);
                    img.src = fallbacks[currentIndex];
                  } else {
                    img.onerror = null;
                    img.src = svgCategoriaFallback(categoria);
                  }
                }}
              />

              <div style={styles.categoryOverlay}>
                <div>
                  <div style={styles.categoryName}>{nomeCategoria(categoria)}</div>
                  <div
                    style={{
                      color: "#59B37E",
                      fontSize: 9,
                      marginTop: 5,
                      fontWeight: 800,
                    }}
                  >
                    EXPLORAR →
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================================================
          CATÁLOGO
      =================================================== */}

      <section style={styles.section} id="catalogo">
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Catálogo</h2>
            <div style={styles.sectionSubtitle}>
              Produtos
              <br />
              Dados carregados diretamente do Supabase.
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#59B37E", fontSize: 11, fontWeight: 900 }}>
              Banco de dados conectado
            </div>
            <div style={{ color: "#666", fontSize: 10, marginTop: 4 }}>
              {produtos.length} produtos sincronizados
            </div>
          </div>
        </div>

        <div style={styles.toolbar}>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto..."
            style={styles.search}
          />

          <select
            value={categoriaSelecionada}
            onChange={(e) => setCategoriaSelecionada(e.target.value)}
            style={styles.select}
          >
            <option>Todas as categorias</option>

            {categorias.map((categoria) => (
              <option key={categoria.id} value={nomeCategoria(categoria)}>
                {nomeCategoria(categoria)}
              </option>
            ))}
          </select>

          <button style={styles.primaryButton} onClick={abrirNovoProduto}>
            + Novo produto
          </button>
        </div>

        {erro && (
          <div
            style={{
              padding: 16,
              borderRadius: 13,
              marginBottom: 20,
              background: "rgba(255,60,60,.08)",
              border: "1px solid rgba(255,60,60,.18)",
              color: "#ff8585",
              fontSize: 12,
            }}
          >
            Erro ao carregar dados do Supabase: {erro}
          </div>
        )}

        {carregando ? (
          <div
            className="volt-loading"
            style={{
              padding: 80,
              textAlign: "center",
              color: "#777",
            }}
          >
            <div
              style={{
                color: "#59B37E",
                fontWeight: 900,
                fontSize: 20,
              }}
            >
              VOLT
            </div>

            <div style={{ marginTop: 8 }}>
              Carregando produtos do Supabase...
            </div>
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div
            style={{
              padding: 70,
              textAlign: "center",
              borderRadius: 18,
              border: "1px dashed rgba(255,255,255,.1)",
              color: "#777",
            }}
          >
            Nenhum produto encontrado.
          </div>
        ) : (
          <div style={styles.productGrid}>
            {produtosFiltrados.map((produto) => {
              const estoque = produtoEstoque(produto);
              const favorito = favoritoExiste(produto.id);

              return (
                <article
                  key={produto.id}
                  className="volt-card"
                  style={styles.productCard}
                >
                  <div style={styles.productImageWrap}>
                    <img
                      src={imagemCard(produto)}
                      alt={produto.nome}
                      style={styles.productImage}
                    />

                    <button
                      style={{
                        ...styles.heart,
                        color: favorito ? "#59B37E" : "#fff",
                      }}
                      onClick={() => alternarFavorito(produto)}
                      title="Favoritar"
                    >
                      {favorito ? "♥" : "♡"}
                    </button>
                  </div>

                  <div style={styles.productBody}>
                    <span style={styles.badge}>
                      {produto.categoria || categoriaFallback(produto)}
                    </span>

                    <h3 style={styles.productName}>{produto.nome}</h3>

                    <div style={styles.developer}>
                      {produto.desenvolvedora || "Desenvolvedora não informada"}
                    </div>

                    <div style={styles.productBottom}>
                      <div>
                        <div style={styles.price}>
                          {formatarPreco(produto.preco)}
                        </div>

                        <div style={styles.stock}>
                          Estoque: {estoque}
                        </div>
                      </div>

                      <div
                        style={{
                          color: "#59B37E",
                          fontSize: 12,
                          fontWeight: 900,
                        }}
                      >
                        ★ {produtoAvaliacao(produto)}
                      </div>
                    </div>

                    <div style={styles.cardActions}>
                      <button
                        style={styles.smallButton}
                        onClick={() => setProdutoSelecionado(produto)}
                      >
                        Ver detalhes
                      </button>

                      <button
                        style={{
                          ...styles.addButton,
                          opacity: estoque <= 0 ? 0.4 : 1,
                        }}
                        disabled={estoque <= 0}
                        onClick={() => adicionarCarrinho(produto)}
                      >
                        {estoque > 0 ? "Adicionar" : "Esgotado"}
                      </button>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 7,
                        marginTop: 7,
                      }}
                    >
                      <button
                        style={styles.smallButton}
                        onClick={() => abrirEditarProduto(produto)}
                      >
                        Editar
                      </button>

                      <button
                        style={{
                          ...styles.smallButton,
                          color: "#ff7070",
                        }}
                        onClick={() => excluirProduto(produto)}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ===================================================
          BOTÕES FLUTUANTES
      =================================================== */}

      <div style={styles.floatingButtons}>
        <button
          style={styles.floatingButton}
          onClick={() => setMostrarFavoritos(true)}
          title="Favoritos"
        >
          ♥
          {favoritos.length > 0 && (
            <span style={styles.count}>{favoritos.length}</span>
          )}
        </button>

        <button
          style={{
            ...styles.floatingButton,
            color: "#59B37E",
          }}
          onClick={() => setMostrarCarrinho(true)}
          title="Carrinho"
        >
          🛒
          {quantidadeCarrinho > 0 && (
            <span style={styles.count}>{quantidadeCarrinho}</span>
          )}
        </button>
      </div>

      {/* ===================================================
          MODAL DE PRODUTO
      =================================================== */}

      {produtoSelecionado && (
        <div
          style={styles.overlay}
          onClick={() => setProdutoSelecionado(null)}
        >
          <div
            className="volt-modal"
            style={styles.modal}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="volt-modal-wallpaper"
              style={styles.modalWallpaper}
            >
              <img
                src={imagemProduto(produtoSelecionado)}
                alt={produtoSelecionado.nome}
                style={styles.modalWallpaperImage}
              />

              <div style={styles.modalGradient} />

              <button
                style={styles.closeButton}
                onClick={() => setProdutoSelecionado(null)}
              >
                ×
              </button>

              <div
                style={{
                  position: "absolute",
                  left: 30,
                  bottom: 25,
                  zIndex: 3,
                }}
              >
                <span style={styles.badge}>
                  {produtoSelecionado.categoria ||
                    categoriaFallback(produtoSelecionado)}
                </span>
              </div>
            </div>

            <div
              className="volt-modal-content"
              style={styles.modalContent}
            >
              <h2 style={styles.modalTitle}>
                {produtoSelecionado.nome}
              </h2>

              <p style={styles.modalDescription}>
                {produtoSelecionado.descricao ||
                  "Este produto faz parte do catálogo VOLT. Confira todas as informações antes de adicionar ao carrinho."}
              </p>

              <div style={styles.detailGrid}>
                <div style={styles.detailBox}>
                  <span style={styles.detailLabel}>
                    Desenvolvedora
                  </span>

                  <span style={styles.detailValue}>
                    {produtoSelecionado.desenvolvedora ||
                      "Não informado"}
                  </span>
                </div>

                <div style={styles.detailBox}>
                  <span style={styles.detailLabel}>
                    Classificação
                  </span>

                  <span style={styles.detailValue}>
                    {produtoSelecionado.classificacao ||
                      "Não informado"}
                  </span>
                </div>

                <div style={styles.detailBox}>
                  <span style={styles.detailLabel}>
                    Lançamento
                  </span>

                  <span style={styles.detailValue}>
                    {formatarData(produtoSelecionado.lancamento)}
                  </span>
                </div>

                <div style={styles.detailBox}>
                  <span style={styles.detailLabel}>
                    Avaliação
                  </span>

                  <span style={styles.detailValue}>
                    ★ {produtoAvaliacao(produtoSelecionado)}
                  </span>
                </div>

                <div style={styles.detailBox}>
                  <span style={styles.detailLabel}>
                    Estoque
                  </span>

                  <span style={styles.detailValue}>
                    {produtoEstoque(produtoSelecionado)} unidades
                  </span>
                </div>

                <div style={styles.detailBox}>
                  <span style={styles.detailLabel}>
                    Categoria
                  </span>

                  <span style={styles.detailValue}>
                    {produtoSelecionado.categoria ||
                      categoriaFallback(produtoSelecionado)}
                  </span>
                </div>
              </div>

              <div style={styles.modalPriceBox}>
                <div>
                  <div
                    style={{
                      color: "#777",
                      fontSize: 10,
                      textTransform: "uppercase",
                      fontWeight: 900,
                    }}
                  >
                    Preço
                  </div>

                  <div
                    style={{
                      color: "#59B37E",
                      fontSize: 31,
                      fontWeight: 950,
                      marginTop: 4,
                    }}
                  >
                    {formatarPreco(produtoSelecionado.preco)}
                  </div>
                </div>

                <button
                  style={{
                    ...styles.primaryButton,
                    padding: "15px 24px",
                    opacity:
                      produtoEstoque(produtoSelecionado) > 0 ? 1 : 0.45,
                  }}
                  disabled={produtoEstoque(produtoSelecionado) <= 0}
                  onClick={() => {
                    adicionarCarrinho(produtoSelecionado);
                    setProdutoSelecionado(null);
                  }}
                >
                  {produtoEstoque(produtoSelecionado) > 0
                    ? "Adicionar ao carrinho"
                    : "Fora de estoque"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          MODAL CARRINHO
      =================================================== */}

      {mostrarCarrinho && (
        <div
          style={styles.overlay}
          onClick={() => setMostrarCarrinho(false)}
        >
          <div
            className="volt-modal volt-cart-modal"
            style={{
              ...styles.modal,
              maxWidth: 650,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={styles.modalContent}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 20,
                }}
              >
                <div className="volt-modal-heading"><span className="volt-modal-kicker">VOLT / CHECKOUT</span><h2 style={styles.modalTitle}>Seu carrinho</h2><p className="volt-modal-subtitle">Seu próximo upgrade começa aqui.</p></div>

                <button
                  style={styles.closeButton}
                  onClick={() => setMostrarCarrinho(false)}
                >
                  ×
                </button>
              </div>

              <div style={{ marginTop: 25 }}>
                {carrinho.length === 0 ? (
                  <div
                    className="volt-empty-state"
                    style={{
                      padding: 50,
                      textAlign: "center",
                      color: "#777",
                    }}
                  >
                    <span className="volt-empty-icon">🛒</span><strong>Seu carrinho está vazio</strong><p>Explore a loja e adicione seus próximos favoritos.</p>
                  </div>
                ) : (
                  carrinho.map((item) => (
                    <div className="volt-cart-item" style={styles.cartItem} key={item.id}>
                      <img
                        src={imagemCard(item)}
                        alt={item.nome}
                        style={styles.cartImage}
                      />

                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 900,
                            fontSize: 13,
                          }}
                        >
                          {item.nome}
                        </div>

                        <div
                          style={{
                            color: "#59B37E",
                            fontWeight: 900,
                            marginTop: 5,
                          }}
                        >
                          {formatarPreco(item.preco)}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            marginTop: 9,
                          }}
                        >
                          <button
                            style={styles.smallButton}
                            onClick={() =>
                              alterarQuantidade(
                                item.id,
                                item.quantidade - 1
                              )
                            }
                          >
                            −
                          </button>

                          <span>{item.quantidade}</span>

                          <button
                            style={styles.smallButton}
                            onClick={() =>
                              alterarQuantidade(
                                item.id,
                                item.quantidade + 1
                              )
                            }
                          >
                            +
                          </button>

                          <button
                            style={{
                              ...styles.smallButton,
                              color: "#ff7070",
                            }}
                            onClick={() => removerCarrinho(item.id)}
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {carrinho.length > 0 && (
                <div style={styles.modalPriceBox}>
                  <div>
                    <div style={{ color: "#777", fontSize: 10 }}>
                      TOTAL
                    </div>

                    <div style={styles.price}>
                      {formatarPreco(totalCarrinho)}
                    </div>
                  </div>

                  <button
                    style={styles.primaryButton}
                    onClick={() =>
                      alert(
                        "Checkout demonstrativo da VOLT. O pagamento ainda não está conectado."
                      )
                    }
                  >
                    Finalizar compra
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          MODAL FAVORITOS
      =================================================== */}

      {mostrarFavoritos && (
        <div
          style={styles.overlay}
          onClick={() => setMostrarFavoritos(false)}
        >
          <div
            className="volt-modal volt-favorites-modal"
            style={{
              ...styles.modal,
              maxWidth: 750,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={styles.modalContent}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div className="volt-modal-heading"><span className="volt-modal-kicker">SUA LISTA PESSOAL</span><h2 style={styles.modalTitle}>Favoritos <span className="volt-heading-count">{favoritos.length}</span></h2><p className="volt-modal-subtitle">Os equipamentos e jogos que ganharam seu coração.</p></div>

                <button
                  style={styles.closeButton}
                  onClick={() => setMostrarFavoritos(false)}
                >
                  ×
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 13,
                  marginTop: 25,
                }}
              >
                {favoritos.length === 0 ? (
                  <div
                    className="volt-empty-state"
                    style={{
                      gridColumn: "1 / -1",
                      textAlign: "center",
                      padding: 50,
                      color: "#777",
                    }}
                  >
                    <span className="volt-empty-icon">♡</span><strong>Sua lista ainda está vazia</strong><p>Toque no coração de um produto para guardá-lo aqui.</p>
                  </div>
                ) : (
                  favoritos.map((produto) => (
                    <div
                      className="volt-favorite-card"
                      key={produto.id}
                      style={{
                        borderRadius: 15,
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,.08)",
                        background: "rgba(255,255,255,.03)",
                      }}
                    >
                      <img
                        src={imagemCard(produto)}
                        alt={produto.nome}
                        style={{
                          width: "100%",
                          height: 130,
                          objectFit: "cover",
                        }}
                      />

                      <div style={{ padding: 14 }}>
                        <strong>{produto.nome}</strong>

                        <div
                          style={{
                            color: "#59B37E",
                            marginTop: 7,
                            fontWeight: 900,
                          }}
                        >
                          {formatarPreco(produto.preco)}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: 7,
                            marginTop: 12,
                          }}
                        >
                          <button
                            style={styles.smallButton}
                            onClick={() => {
                              setProdutoSelecionado(produto);
                              setMostrarFavoritos(false);
                            }}
                          >
                            Detalhes
                          </button>

                          <button
                            style={styles.addButton}
                            onClick={() => adicionarCarrinho(produto)}
                          >
                            Comprar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          MODAL NOVO / EDITAR
      =================================================== */}

      {mostrarFormulario && (
        <div
          style={styles.overlay}
          onClick={() => setMostrarFormulario(false)}
        >
          <div
            className="volt-modal"
            style={{
              ...styles.modal,
              maxWidth: 900,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={styles.modalContent}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 25,
                }}
              >
                <div>
                  <h2 style={styles.modalTitle}>
                    {produtoEditando
                      ? "Editar produto"
                      : "Novo produto"}
                  </h2>

                  <p style={{ color: "#666", fontSize: 12 }}>
                    Dados sincronizados com o Supabase.
                  </p>
                </div>

                <button
                  style={styles.closeButton}
                  onClick={() => setMostrarFormulario(false)}
                >
                  ×
                </button>
              </div>

              <form onSubmit={salvarProduto}>
                <div
                  className="volt-form-grid"
                  style={styles.formGrid}
                >
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Nome</label>
                    <input
                      style={styles.input}
                      value={formulario.nome}
                      onChange={(e) =>
                        atualizarCampo("nome", e.target.value)
                      }
                      placeholder="Nome do produto"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Categoria</label>

                    <select
                      style={styles.select}
                      value={formulario.categoria_id}
                      onChange={(e) => {
                        const id = e.target.value;
                        const categoria = categorias.find(
                          (item) => String(item.id) === String(id)
                        );
                        setFormulario((anterior) => ({
                          ...anterior,
                          categoria_id: id,
                          categoria: categoria?.nome || "",
                        }));
                      }}
                      required
                    >
                      <option value="">Selecione uma categoria</option>
                      {categorias.map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      Preço
                    </label>

                    <input
                      style={styles.input}
                      type="number"
                      step="0.01"
                      value={formulario.preco}
                      onChange={(e) =>
                        atualizarCampo("preco", e.target.value)
                      }
                      placeholder="299.90"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      Estoque
                    </label>

                    <input
                      style={styles.input}
                      type="number"
                      value={formulario.estoque}
                      onChange={(e) =>
                        atualizarCampo(
                          "estoque",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      Avaliação
                    </label>

                    <input
                      style={styles.input}
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={formulario.avaliacao}
                      onChange={(e) =>
                        atualizarCampo(
                          "avaliacao",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      Classificação
                    </label>

                    <select
                      style={styles.select}
                      value={formulario.classificacao}
                      onChange={(e) =>
                        atualizarCampo(
                          "classificacao",
                          e.target.value
                        )
                      }
                    >
                      <option>Livre</option>
                      <option>10 anos</option>
                      <option>12 anos</option>
                      <option>14 anos</option>
                      <option>16 anos</option>
                      <option>18 anos</option>
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      Desenvolvedora
                    </label>

                    <input
                      style={styles.input}
                      value={formulario.desenvolvedora}
                      onChange={(e) =>
                        atualizarCampo(
                          "desenvolvedora",
                          e.target.value
                        )
                      }
                      placeholder="Rockstar Games"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      Lançamento
                    </label>

                    <input
                      style={styles.input}
                      type="date"
                      value={formulario.lancamento}
                      onChange={(e) =>
                        atualizarCampo(
                          "lancamento",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      URL da imagem principal
                    </label>

                    <input
                      style={styles.input}
                      value={formulario.imagem}
                      onChange={(e) =>
                        atualizarCampo(
                          "imagem",
                          e.target.value
                        )
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      URL da imagem de detalhe
                    </label>

                    <input
                      style={styles.input}
                      value={formulario.imagem_detalhe}
                      onChange={(e) =>
                        atualizarCampo(
                          "imagem_detalhe",
                          e.target.value
                        )
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div
                    style={{
                      ...styles.formGroup,
                      gridColumn: "1 / -1",
                    }}
                  >
                    <label style={styles.formLabel}>
                      Descrição
                    </label>

                    <textarea
                      style={styles.textarea}
                      value={formulario.descricao}
                      onChange={(e) =>
                        atualizarCampo(
                          "descricao",
                          e.target.value
                        )
                      }
                      placeholder="Descrição completa do produto..."
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 10,
                    marginTop: 25,
                  }}
                >
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() => setMostrarFormulario(false)}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    style={styles.primaryButton}
                    disabled={salvando}
                  >
                    {salvando
                      ? "Salvando..."
                      : produtoEditando
                      ? "Salvar alterações"
                      : "Criar produto"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer style={styles.footer}>
        <div
          style={{
            color: "#59B37E",
            fontWeight: 950,
            fontSize: 18,
            letterSpacing: ".1em",
          }}
        >
          VOLT
        </div>

        <div style={{ marginTop: 8 }}>
          Power Your Game
        </div>

        <div style={{ marginTop: 20 }}>
          Dados sincronizados com Supabase • {produtos.length} produtos
        </div>
      </footer>
    </div>
  );
}


/* =========================================================
   AUTENTICAÇÃO VOLT — Supabase Auth + React Context API
========================================================= */
const AuthContext = createContext(null);

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return context;
}

function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let ativo = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!ativo) return;
      if (error) console.error("Erro ao recuperar sessão:", error);
      setSession(data?.session ?? null);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!ativo) return;
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => {
      ativo = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    authLoading,
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  }), [session, authLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function GoogleMark() {
  return <span aria-hidden="true" style={{ display: "inline-grid", placeItems: "center", width: 19, height: 19, borderRadius: "50%", background: "#fff", color: "#4285F4", fontWeight: 950, fontSize: 13 }}>G</span>;
}

function VoltAuthScreen() {
  const [modo, setModo] = useState("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function entrarComGoogle() {
    setErro(""); setSucesso(""); setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (e) {
      setErro(e?.message || "Não foi possível iniciar o login com Google.");
      setLoading(false);
    }
  }

  async function enviarFormulario(event) {
    event.preventDefault(); setErro(""); setSucesso(""); setLoading(true);
    try {
      if (modo === "cadastro") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: { data: { full_name: nome.trim() }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data?.session) {
          setSucesso("Cadastro realizado! Sua conta já está conectada.");
        } else {
          setSucesso("Cadastro realizado! Confira seu e-mail para confirmar a conta antes de entrar.");
          setModo("login");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
        if (error) throw error;
      }
    } catch (e) {
      setErro(e?.message || "Não foi possível autenticar. Confira os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .volt-user-chip { display:flex; align-items:center; gap:8px; min-width:0; max-width:220px; color:#f5f7ef; font-size:11px; font-weight:700; }
        .volt-user-chip img, .volt-user-initial { width:30px; height:30px; border-radius:50%; object-fit:cover; border:1px solid rgba(89,179,126,.55); }
        .volt-user-initial { display:grid; place-items:center; background:#59B37E; color:#080D0A; font-weight:950; }
        .volt-user-name { overflow:hidden; white-space:nowrap; text-overflow:ellipsis; max-width:145px; }
        .volt-logout { border:1px solid rgba(89,179,126,.28); border-radius:10px; background:rgba(89,179,126,.06); color:#59B37E; padding:9px 11px; cursor:pointer; font-weight:800; font-size:11px; }
        .volt-logout:hover { background:rgba(89,179,126,.14); box-shadow:0 0 24px rgba(89,179,126,.08); }
        .volt-auth-shell { min-height:100vh; display:grid; grid-template-columns:minmax(0,1.08fr) minmax(360px,.92fr); background:#080D0A; color:#f6f7f2; font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif; overflow:hidden; }
        .volt-auth-visual { position:relative; min-height:100vh; display:flex; flex-direction:column; justify-content:space-between; padding:clamp(28px,5vw,72px); background:linear-gradient(90deg,rgba(8,13,10,.93),rgba(8,13,10,.55)),linear-gradient(0deg,rgba(8,13,10,.78),transparent 60%),url('/banner-volt.jpg') center/cover; isolation:isolate; }
        .volt-auth-visual::before { content:''; position:absolute; inset:0; z-index:-1; background:radial-gradient(circle at 75% 45%,rgba(89,179,126,.16),transparent 32%); animation:voltAuthGlow 7s ease-in-out infinite alternate; }
        .volt-auth-logo { width:min(210px,65%); max-height:76px; object-fit:contain; object-position:left center; filter:drop-shadow(0 0 22px rgba(89,179,126,.13)); }
        .volt-auth-copy { max-width:620px; animation:voltAuthIn .75s cubic-bezier(.2,.8,.2,1) both; }
        .volt-auth-copy h1 { margin:18px 0; font-size:clamp(42px,6.5vw,88px); line-height:.92; letter-spacing:-.075em; font-weight:950; }
        .volt-auth-copy h1 span { color:#59B37E; text-shadow:0 0 38px rgba(89,179,126,.12); }
        .volt-auth-copy p { max-width:440px; color:#a9afa2; font-size:15px; line-height:1.8; }
        .volt-auth-tag { display:inline-flex; align-items:center; gap:9px; border:1px solid rgba(89,179,126,.24); background:rgba(89,179,126,.06); border-radius:99px; padding:9px 13px; color:#59B37E; font-size:10px; font-weight:900; letter-spacing:.16em; text-transform:uppercase; }
        .volt-auth-tag i { width:6px; height:6px; border-radius:50%; background:#59B37E; box-shadow:0 0 12px #59B37E; }
        .volt-auth-side { display:grid; place-items:center; padding:34px; background:radial-gradient(circle at 50% 0%,rgba(89,179,126,.065),transparent 38%),#0A120D; }
        .volt-auth-card { width:min(100%,430px); padding:clamp(24px,4vw,42px); border:1px solid rgba(255,255,255,.09); border-radius:24px; background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.015)); box-shadow:0 30px 100px rgba(0,0,0,.32); animation:voltAuthIn .65s cubic-bezier(.2,.8,.2,1) both; }
        .volt-auth-card h2 { margin:0; font-size:29px; letter-spacing:-.05em; font-weight:900; }
        .volt-auth-muted { color:#92998e; font-size:13px; line-height:1.65; margin:10px 0 25px; }
        .volt-auth-label { display:block; margin:15px 0 7px; color:#c8cdc2; font-size:11px; font-weight:800; letter-spacing:.04em; }
        .volt-auth-input { width:100%; border:1px solid rgba(255,255,255,.11); border-radius:12px; outline:none; background:#0C1510; color:#fff; padding:14px 15px; font:inherit; font-size:13px; transition:border .2s,box-shadow .2s; }
        .volt-auth-input:focus { border-color:rgba(89,179,126,.65); box-shadow:0 0 0 3px rgba(89,179,126,.08); }
        .volt-auth-primary,.volt-auth-google { width:100%; display:flex; align-items:center; justify-content:center; gap:10px; border-radius:12px; padding:14px 16px; font:inherit; font-size:12px; font-weight:900; cursor:pointer; transition:transform .2s,box-shadow .2s,background .2s; }
        .volt-auth-primary { margin-top:18px; border:0; background:#59B37E; color:#090b0e; box-shadow:0 8px 26px rgba(89,179,126,.09); }
        .volt-auth-primary:hover { transform:translateY(-2px); box-shadow:0 12px 34px rgba(89,179,126,.19); }
        .volt-auth-primary:disabled,.volt-auth-google:disabled { opacity:.6; cursor:wait; }
        .volt-auth-google { border:1px solid rgba(255,255,255,.13); background:rgba(255,255,255,.035); color:#f6f7f2; }
        .volt-auth-google:hover { background:rgba(255,255,255,.07); transform:translateY(-1px); }
        .volt-auth-divider { display:flex; align-items:center; gap:12px; margin:21px 0; color:#666e63; font-size:10px; text-transform:uppercase; letter-spacing:.13em; }
        .volt-auth-divider::before,.volt-auth-divider::after { content:''; height:1px; flex:1; background:rgba(255,255,255,.09); }
        .volt-auth-switch { width:100%; border:0; background:transparent; color:#b4bbac; padding:18px 0 0; font:inherit; font-size:12px; cursor:pointer; }
        .volt-auth-switch strong { color:#59B37E; }
        .volt-auth-error,.volt-auth-success { margin-top:15px; padding:12px 13px; border-radius:10px; font-size:12px; line-height:1.55; }
        .volt-auth-error { color:#ff9c9c; background:rgba(255,77,77,.08); border:1px solid rgba(255,77,77,.2); }
        .volt-auth-success { color:#59B37E; background:rgba(89,179,126,.06); border:1px solid rgba(89,179,126,.18); }
        .volt-auth-small { margin-top:24px; color:#5e655b; font-size:10px; line-height:1.6; text-align:center; }
        @keyframes voltAuthIn { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes voltAuthGlow { from { opacity:.45; transform:scale(1); } to { opacity:1; transform:scale(1.04); } }
        @media (max-width:850px) { .volt-auth-shell { grid-template-columns:1fr; } .volt-auth-visual { display:none; } .volt-auth-side { min-height:100vh; padding:20px; } }
        @media (max-width:760px) { .volt-user-name { display:none; } .volt-user-chip { max-width:35px; } }

        button,
        input,
        textarea,
        select {
          font-family: inherit;
        }

        button {
          transition: transform .18s ease, opacity .18s ease, border-color .18s ease, background .18s ease;
        }

        button:hover {
          transform: translateY(-1px);
        }

        ::selection {
          background: #59B37E;
          color: #080D0A;
        }


      `}</style>
      <main className="volt-auth-shell">
      <section className="volt-auth-visual" aria-label="VOLT gaming store">
        <img className="volt-auth-logo" src="/logo.jpg" alt="VOLT — Power Your Game" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        <div className="volt-auth-copy">
          <span className="volt-auth-tag"><i /> POWER YOUR GAME</span>
          <h1>YOUR NEXT<br /><span>LEVEL.</span></h1>
          <p>Seu universo gamer começa aqui. Entre para explorar a loja, gerenciar produtos e manter tudo sincronizado com segurança.</p>
        </div>
        <div style={{ color: "#697063", fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase" }}>VOLT / GAMING STORE / SECURE ACCESS</div>
      </section>
      <section className="volt-auth-side">
        <div className="volt-auth-card">
          <div style={{ color: "#59B37E", fontSize: 10, fontWeight: 900, letterSpacing: ".18em", marginBottom: 15 }}>VOLT ACCOUNT</div>
          <h2>{modo === "login" ? "Bem-vindo de volta." : "Crie sua conta."}</h2>
          <p className="volt-auth-muted">{modo === "login" ? "Entre para continuar sua experiência gamer." : "Cadastre-se para acessar sua conta VOLT."}</p>
          <button className="volt-auth-google" type="button" onClick={entrarComGoogle} disabled={loading}>
            <GoogleMark /> {loading ? "Aguarde..." : "Continuar com Google"}
          </button>
          <div className="volt-auth-divider">ou use seu e-mail</div>
          <form onSubmit={enviarFormulario}>
            {modo === "cadastro" && <>
              <label className="volt-auth-label" htmlFor="volt-name">Nome completo</label>
              <input id="volt-name" className="volt-auth-input" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como podemos te chamar?" required minLength={2} />
            </>}
            <label className="volt-auth-label" htmlFor="volt-email">E-mail</label>
            <input id="volt-email" className="volt-auth-input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" required />
            <label className="volt-auth-label" htmlFor="volt-password">Senha</label>
            <input id="volt-password" className="volt-auth-input" type="password" autoComplete={modo === "login" ? "current-password" : "new-password"} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo de 6 caracteres" required minLength={6} />
            <button className="volt-auth-primary" type="submit" disabled={loading}>{loading ? "Processando..." : modo === "login" ? "Entrar na VOLT  →" : "Criar minha conta  →"}</button>
          </form>
          {erro && <div className="volt-auth-error" role="alert">{erro}</div>}
          {sucesso && <div className="volt-auth-success" role="status">{sucesso}</div>}
          <button className="volt-auth-switch" type="button" onClick={() => { setModo(modo === "login" ? "cadastro" : "login"); setErro(""); setSucesso(""); }}>
            {modo === "login" ? <>Ainda não tem conta? <strong>Cadastre-se</strong></> : <>Já tem uma conta? <strong>Fazer login</strong></>}
          </button>
          <div className="volt-auth-small">A autenticação é protegida pelo Supabase Auth.<br />Ao continuar, você concorda com os termos de uso da aplicação educacional.</div>
        </div>
      </section>
      </main>
    </>
  );
}

function VoltAuthLoading() {
  return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#080D0A", color: "#59B37E", fontFamily: "Inter,system-ui,sans-serif" }}><div style={{ textAlign: "center" }}><img src="/logo.jpg" alt="VOLT" style={{ width: 150, maxHeight: 70, objectFit: "contain", marginBottom: 20 }} /><div style={{ fontSize: 11, letterSpacing: ".2em" }}>VERIFICANDO SESSÃO...</div><div style={{ width: 150, height: 2, background: "#252a1c", margin: "18px auto", overflow: "hidden" }}><div style={{ width: "45%", height: "100%", background: "#59B37E", animation: "voltAuthLoad 1.2s ease-in-out infinite alternate" }} /></div><style>{"@keyframes voltAuthLoad { from { transform:translateX(-10%); } to { transform:translateX(135%); } }"}</style></div></div>;
}

export default function App() {
  return <AuthProvider><AppGate /></AuthProvider>;
}

function AppGate() {
  const { user, authLoading } = useAuth();
  if (authLoading) return <VoltAuthLoading />;
  if (!user) return <VoltAuthScreen />;
  return <StoreApp />;
}
