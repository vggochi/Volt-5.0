
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
      fontSize: 30,
      letterSpacing: "-.04em",
    },

    sectionSubtitle: {
      color: "#777",
      fontSize: 13,
      marginTop: 7,
    },

    categories: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: 13,
    },

    categoryCard: {
      position: "relative",
      height: 150,
      overflow: "hidden",
      borderRadius: 17,
      border: "1px solid rgba(255,255,255,.08)",
      background: "#0c1016",
      cursor: "pointer",
    },

    categoryImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
    },

    categoryOverlay: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(0deg, rgba(0,0,0,.88), rgba(0,0,0,.08) 75%)",
      display: "flex",
      alignItems: "end",
      padding: 17,
    },

    categoryName: {
      fontWeight: 900,
      fontSize: 14,
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
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #080D0A;
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

        .volt-category:hover {
          transform: translateY(-5px);
          border-color: rgba(89,179,126,.25) !important;
        }

        .volt-category img {
          transition: transform .5s ease;
        }

        .volt-category:hover img {
          transform: scale(1.06);
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
        header img[alt*="VOLT"] { transition: transform .28s ease, filter .28s ease; }
        header img[alt*="VOLT"]:hover { transform: scale(1.035); filter: drop-shadow(0 0 22px rgba(89,179,126,.32)); }

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

      {/* ===================================================
          HEADER
      =================================================== */}

      <header style={styles.header}>
        <div
          style={styles.logo}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          title="VOLT — Power Your Game"
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
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Início
          </button>

          <button
            style={styles.navButton}
            onClick={() =>
              document
                .getElementById("catalogo")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Produtos
          </button>

          <button
            style={styles.navButton}
            onClick={() =>
              document
                .getElementById("catalogo")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Ofertas
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
      </section>

      {/* ===================================================
          CATEGORIAS
      =================================================== */}

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>VOLT</h2>
            <div style={styles.sectionSubtitle}>Explore</div>
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
                setCategoriaSelecionada(categoria.nome);
                document
                  .getElementById("catalogo")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {categoria.imagem ? (
                <img
                  src={categoria.imagem}
                  alt={categoria.nome}
                  style={styles.categoryImage}
                />
              ) : (
                <div
                  style={{
                    ...styles.categoryImage,
                    background:
                      "linear-gradient(135deg, #141a22, #080b10)",
                  }}
                />
              )}

              <div style={styles.categoryOverlay}>
                <div>
                  <div style={styles.categoryName}>{categoria.nome}</div>
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
              <option key={categoria.id} value={categoria.nome}>
                {categoria.nome}
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
                <h2 style={styles.modalTitle}>Seu carrinho</h2>

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
                    style={{
                      padding: 50,
                      textAlign: "center",
                      color: "#777",
                    }}
                  >
                    Seu carrinho está vazio.
                  </div>
                ) : (
                  carrinho.map((item) => (
                    <div style={styles.cartItem} key={item.id}>
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
                <h2 style={styles.modalTitle}>Favoritos</h2>

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
                    style={{
                      gridColumn: "1 / -1",
                      textAlign: "center",
                      padding: 50,
                      color: "#777",
                    }}
                  >
                    Você ainda não possui produtos favoritos.
                  </div>
                ) : (
                  favoritos.map((produto) => (
                    <div
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
