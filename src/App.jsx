
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import {
  AlertTriangle, BarChart3, Boxes, Camera, CheckCircle2, ClipboardList, Clock, Construction,
  Download, Edit, FileText, ImagePlus, MapPin, Menu, Plus, Search, Trash2, Truck, Users, X
} from "lucide-react";
import "./style.css";

const supabaseUrl = "https://vmonidaluhgnkjpjykxb.supabase.co";
const supabaseAnonKey = "sb_publishable_xyjBrjGD9XAGOArGUu-GfA_LsTqpNha";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const equipesFixas = [
  { id: 1, nome: "Equipe Pavimentação", responsavel: "Encarregado 1", status: "Disponível", servicos: 4 },
  { id: 2, nome: "Equipe Limpeza Urbana", responsavel: "Encarregado 2", status: "Em campo", servicos: 6 },
  { id: 3, nome: "Equipe Manutenção Predial", responsavel: "Encarregado 3", status: "Disponível", servicos: 2 },
];

const fallbackDemandas = [];
const fallbackOrdens = [];
const fallbackMateriais = [];

function badgeTone(status) {
  if (["Concluída", "Aprovada", "Disponível", "Atendida"].includes(status)) return "success";
  if (["Em execução", "Em análise", "Encaminhada", "Em campo", "Em andamento"].includes(status)) return "info";
  if (["Aguardando material", "Aberta", "Recebida", "Pendente"].includes(status)) return "warning";
  if (["Cancelada", "Recusada", "Crítico", "Urgente"].includes(status)) return "danger";
  return "";
}

function Badge({ children, tone = "" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function Header({ title, subtitle, children }) {
  return (
    <div className="header">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="btnRow">{children}</div>
    </div>
  );
}

function Sidebar({ active, setActive }) {
  const groups = [
    ["", [["dashboard", BarChart3, "Dashboard"]]],
    ["Demandas", [["demandas", ClipboardList, "Demandas completas"]]],
    ["Ordens de serviço", [["ordens", Construction, "Ordens de Serviço"]]],
    ["Estoque", [["estoque", Boxes, "Materiais"]]],
    ["Relatórios", [["relatorios", FileText, "Relatórios"]]],
    ["Configurações", [["equipes", Users, "Equipes"], ["frota", Truck, "Frota"], ["sair", X, "Sair"]]],
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logoBox"><img src="/logo-obras.png" alt="Brasão Carmo da Cachoeira" /></div>
        <div>
          <h1>Obras Gestor</h1>
          <p>Carmo da Cachoeira - MG</p>
        </div>
      </div>

      <nav className="nav">
        {groups.map(([group, items]) => (
          <React.Fragment key={group || "principal"}>
            {group && <div className="navGroup">{group}</div>}
            {items.map(([key, Icon, label]) => (
              <button key={key} onClick={() => key === "sair" ? supabase.auth.signOut() : setActive(key)} className={active === key ? "active" : ""}>
                <Icon size={18} /> {label}
              </button>
            ))}
          </React.Fragment>
        ))}
      </nav>
    </aside>
  );
}

function Metric({ icon: Icon, label, value, helper, tone }) {
  return (
    <div className="card metric">
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
      <div className="iconBox" style={{ background: tone || "#e2e8f0" }}><Icon size={22} /></div>
    </div>
  );
}

function SearchBox({ value, setValue, placeholder }) {
  return <div className="search"><Search size={18} /><input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} /></div>;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function exportCSV(filename, rows) {
  if (!rows.length) return alert("Não há dados para exportar.");
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(";"),
    ...rows.map(row => keys.map(k => `"${String(row[k] ?? "").replaceAll('"', '""')}"`).join(";"))
  ].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function printReport(title) {
  document.title = title;
  window.print();
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modalOverlay">
      <div className="modal">
        <div className="modalHeader">
          <h3>{title}</h3>
          <button className="btn secondary small" onClick={onClose}><X size={16} /> Fechar</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Dashboard({ demandas, ordens, materiais }) {
  const abertas = demandas.filter(d => d.status !== "Concluída").length;
  const andamento = ordens.filter(o => ["Aberta", "Em execução", "Em andamento"].includes(o.status)).length;
  const concluidas = ordens.filter(o => o.status === "Concluída").length;
  const baixoEstoque = materiais.filter((i) => Number(i.saldo) < Number(i.minimo)).length;

  return (
    <>
      <Header title="Dashboard" subtitle="Painel geral da Secretaria de Obras." />
      <div className="grid5">
        <Metric icon={ClipboardList} label="Demandas abertas" value={abertas} helper="Pendentes de atendimento" tone="#dbeafe" />
        <Metric icon={Construction} label="Ordens em andamento" value={andamento} helper="OS abertas/em execução" tone="#dcfce7" />
        <Metric icon={CheckCircle2} label="OS concluídas" value={concluidas} helper="Serviços finalizados" tone="#ede9fe" />
        <Metric icon={Boxes} label="Materiais em estoque" value={materiais.length} helper={`${baixoEstoque} críticos`} tone="#fef3c7" />
        <Metric icon={Users} label="Equipes ativas" value={equipesFixas.length} helper="Equipes cadastradas" tone="#ffe4e6" />
      </div>

      <div className="grid2" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="sectionTitle"><h3>Demandas recentes</h3><Badge tone="info">Ver todas</Badge></div>
          <div className="list">
            {demandas.slice(0, 6).map((d) => (
              <div className="item" key={d.id}>
                <div className="itemTop">
                  <h3>{d.categoria}</h3>
                  <Badge tone={badgeTone(d.status)}>{d.status}</Badge>
                </div>
                <p className="muted">{d.protocolo} • {d.endereco}, {d.bairro}</p>
              </div>
            ))}
            {!demandas.length && <p className="muted">Nenhuma demanda cadastrada.</p>}
          </div>
        </div>

        <div className="card">
          <div className="sectionTitle"><h3>Estoque crítico</h3><Badge tone="danger">{baixoEstoque} itens</Badge></div>
          <div className="tableWrap">
            <table>
              <thead><tr><th>Material</th><th>Estoque</th><th>Mínimo</th></tr></thead>
              <tbody>
                {materiais.filter(m => Number(m.saldo) < Number(m.minimo)).map(m => (
                  <tr key={m.id}><td>{m.item}</td><td>{m.saldo} {m.unidade}</td><td>{m.minimo} {m.unidade}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="sectionTitle"><h3>Ordens de Serviço em Andamento</h3><Badge tone="info">Ver todas</Badge></div>
        <div className="tableWrap">
          <table>
            <thead><tr><th>OS</th><th>Serviço</th><th>Equipe</th><th>Prazo</th><th>Status</th></tr></thead>
            <tbody>
              {ordens.filter(o => o.status !== "Concluída").slice(0, 6).map(o => (
                <tr key={o.id}><td>{o.numero}</td><td>{o.tipo}</td><td>{o.equipe}</td><td>{o.prazo}</td><td><Badge tone={badgeTone(o.status)}>{o.status}</Badge></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Demandas({ demandas, novaDemanda, setNovaDemanda, criarDemanda, atualizarDemanda, excluirDemanda, gerarOS }) {
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState(null);

  const filtradas = demandas.filter(d => JSON.stringify(d).toLowerCase().includes(busca.toLowerCase()));

  function abrirEdicao(d) {
    setEditando({ ...d });
  }

  return (
    <>
      <Header title="Demandas completas" subtitle="Criar, editar, alterar status, filtrar, anexar fotos e gerar OS.">
        <button className="btn secondary" onClick={() => exportCSV("demandas.csv", demandas)}><Download size={16}/> Exportar Excel/CSV</button>
      </Header>

      <div className="form">
        <div className="formGrid3">
          <input placeholder="Categoria" value={novaDemanda.categoria} onChange={(e) => setNovaDemanda({ ...novaDemanda, categoria: e.target.value })} />
          <input placeholder="Bairro" value={novaDemanda.bairro} onChange={(e) => setNovaDemanda({ ...novaDemanda, bairro: e.target.value })} />
          <input placeholder="Endereço" value={novaDemanda.endereco} onChange={(e) => setNovaDemanda({ ...novaDemanda, endereco: e.target.value })} />
          <select value={novaDemanda.status} onChange={(e) => setNovaDemanda({ ...novaDemanda, status: e.target.value })}>
            <option>Recebida</option><option>Em análise</option><option>Encaminhada</option><option>Em execução</option><option>Concluída</option><option>Cancelada</option>
          </select>
          <select value={novaDemanda.prioridade} onChange={(e) => setNovaDemanda({ ...novaDemanda, prioridade: e.target.value })}>
            <option>Normal</option><option>Alta</option><option>Urgente</option>
          </select>
          <input type="file" accept="image/*" onChange={(e) => setNovaDemanda({ ...novaDemanda, fotoFile: e.target.files?.[0] })} />
        </div>
        <textarea placeholder="Descrição" value={novaDemanda.descricao} onChange={(e) => setNovaDemanda({ ...novaDemanda, descricao: e.target.value })} />
        <button className="btn primary" onClick={criarDemanda}><Plus size={16} /> Salvar demanda</button>
      </div>

      <SearchBox value={busca} setValue={setBusca} placeholder="Buscar por protocolo, bairro, categoria, endereço ou status" />
      <div className="list">
        {filtradas.map((d) => (
          <div className="card" key={d.id}>
            <div className="itemTop">
              <div>
                <h3>{d.protocolo} — {d.categoria}</h3>
                <p className="muted">{d.descricao}</p>
                <p className="muted"><MapPin size={14} /> {d.endereco}, {d.bairro}</p>
                {d.foto_url && <div className="gallery"><img src={d.foto_url} alt="Foto da demanda" /></div>}
              </div>
              <div className="btnRow">
                <Badge tone={badgeTone(d.status)}>{d.status}</Badge>
                <Badge tone={d.prioridade === "Alta" || d.prioridade === "Urgente" ? "danger" : ""}>{d.prioridade}</Badge>
                <button className="btn secondary small" onClick={() => abrirEdicao(d)}><Edit size={14}/> Editar</button>
                <button className="btn success small" onClick={() => gerarOS(d)}><Construction size={14}/> Gerar OS</button>
                <button className="btn danger small" onClick={() => excluirDemanda(d.id)}><Trash2 size={14}/> Excluir</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editando && (
        <Modal title={`Editar demanda ${editando.protocolo}`} onClose={() => setEditando(null)}>
          <div className="form">
            <div className="formGrid3">
              <input value={editando.categoria || ""} onChange={(e) => setEditando({ ...editando, categoria: e.target.value })} />
              <input value={editando.bairro || ""} onChange={(e) => setEditando({ ...editando, bairro: e.target.value })} />
              <input value={editando.endereco || ""} onChange={(e) => setEditando({ ...editando, endereco: e.target.value })} />
              <select value={editando.status || "Recebida"} onChange={(e) => setEditando({ ...editando, status: e.target.value })}>
                <option>Recebida</option><option>Em análise</option><option>Encaminhada</option><option>Em execução</option><option>Concluída</option><option>Cancelada</option>
              </select>
              <select value={editando.prioridade || "Normal"} onChange={(e) => setEditando({ ...editando, prioridade: e.target.value })}>
                <option>Normal</option><option>Alta</option><option>Urgente</option>
              </select>
              <input type="file" accept="image/*" onChange={(e) => setEditando({ ...editando, fotoFile: e.target.files?.[0] })} />
            </div>
            <textarea value={editando.descricao || ""} onChange={(e) => setEditando({ ...editando, descricao: e.target.value })} />
            <button className="btn primary" onClick={async () => { await atualizarDemanda(editando); setEditando(null); }}>Salvar alterações</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function Ordens({ ordens, criarOSManual, atualizarOS, excluirOS }) {
  const [busca, setBusca] = useState("");
  const [novaOS, setNovaOS] = useState({ tipo: "", local: "", bairro: "", equipe: "Equipe Pavimentação", prioridade: "Normal", prazo: "", descricao: "" });
  const [editando, setEditando] = useState(null);
  const filtradas = ordens.filter(o => JSON.stringify(o).toLowerCase().includes(busca.toLowerCase()));

  return (
    <>
      <Header title="Ordens de serviço" subtitle="Criar OS, atribuir equipe, iniciar, concluir, registrar observações e fotos.">
        <button className="btn secondary" onClick={() => exportCSV("ordens_servico.csv", ordens)}><Download size={16}/> Exportar</button>
      </Header>

      <div className="form">
        <div className="formGrid3">
          <input placeholder="Tipo de serviço" value={novaOS.tipo} onChange={(e) => setNovaOS({ ...novaOS, tipo: e.target.value })} />
          <input placeholder="Local / endereço" value={novaOS.local} onChange={(e) => setNovaOS({ ...novaOS, local: e.target.value })} />
          <input placeholder="Bairro" value={novaOS.bairro} onChange={(e) => setNovaOS({ ...novaOS, bairro: e.target.value })} />
          <select value={novaOS.equipe} onChange={(e) => setNovaOS({ ...novaOS, equipe: e.target.value })}>
            {equipesFixas.map(e => <option key={e.id}>{e.nome}</option>)}
          </select>
          <select value={novaOS.prioridade} onChange={(e) => setNovaOS({ ...novaOS, prioridade: e.target.value })}>
            <option>Normal</option><option>Alta</option><option>Urgente</option>
          </select>
          <input type="date" value={novaOS.prazo} onChange={(e) => setNovaOS({ ...novaOS, prazo: e.target.value })} />
        </div>
        <textarea placeholder="Descrição/observação" value={novaOS.descricao} onChange={(e) => setNovaOS({ ...novaOS, descricao: e.target.value })} />
        <button className="btn primary" onClick={async () => { await criarOSManual(novaOS); setNovaOS({ tipo: "", local: "", bairro: "", equipe: "Equipe Pavimentação", prioridade: "Normal", prazo: "", descricao: "" }); }}><Plus size={16}/> Criar OS</button>
      </div>

      <SearchBox value={busca} setValue={setBusca} placeholder="Buscar OS por número, equipe, bairro ou tipo de serviço" />
      <div className="list">
        {filtradas.map((o) => (
          <div className="card" key={o.id}>
            <div className="itemTop">
              <div>
                <h3>{o.numero} — {o.tipo}</h3>
                <p className="muted">{o.local}</p>
                <p className="muted">Equipe: {o.equipe} • Prazo: {o.prazo}</p>
                {o.observacao && <p className="muted">Obs.: {o.observacao}</p>}
                {o.fotos?.length > 0 && <div className="gallery">{o.fotos.map((f, idx) => <img key={idx} src={f.foto_url} alt="Foto OS" />)}</div>}
              </div>
              <div className="btnRow">
                <Badge tone={badgeTone(o.status)}>{o.status}</Badge>
                <button className="btn secondary small" onClick={() => setEditando({ ...o })}><Edit size={14}/> Editar</button>
                <button className="btn success small" onClick={() => atualizarOS({ ...o, status: "Em execução" })}>Iniciar</button>
                <button className="btn primary small" onClick={() => setEditando({ ...o, status: "Concluída" })}>Concluir</button>
                <button className="btn danger small" onClick={() => excluirOS(o.id)}><Trash2 size={14}/> Excluir</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editando && (
        <Modal title={`Editar OS ${editando.numero}`} onClose={() => setEditando(null)}>
          <div className="form">
            <div className="formGrid3">
              <input value={editando.tipo || ""} onChange={(e) => setEditando({ ...editando, tipo: e.target.value })} />
              <input value={editando.local || ""} onChange={(e) => setEditando({ ...editando, local: e.target.value })} />
              <input value={editando.bairro || ""} onChange={(e) => setEditando({ ...editando, bairro: e.target.value })} />
              <select value={editando.equipe || ""} onChange={(e) => setEditando({ ...editando, equipe: e.target.value })}>
                {equipesFixas.map(e => <option key={e.id}>{e.nome}</option>)}
              </select>
              <select value={editando.status || "Aberta"} onChange={(e) => setEditando({ ...editando, status: e.target.value })}>
                <option>Aberta</option><option>Em execução</option><option>Aguardando material</option><option>Concluída</option><option>Cancelada</option>
              </select>
              <input type="date" value={editando.prazoRaw || ""} onChange={(e) => setEditando({ ...editando, prazoRaw: e.target.value })} />
            </div>
            <textarea placeholder="Observação/conclusão" value={editando.observacao || ""} onChange={(e) => setEditando({ ...editando, observacao: e.target.value })} />
            <div className="formGrid">
              <label>Foto antes <input type="file" accept="image/*" onChange={(e) => setEditando({ ...editando, fotoAntes: e.target.files?.[0] })} /></label>
              <label>Foto depois <input type="file" accept="image/*" onChange={(e) => setEditando({ ...editando, fotoDepois: e.target.files?.[0] })} /></label>
            </div>
            <button className="btn primary" onClick={async () => { await atualizarOS(editando); setEditando(null); }}>Salvar OS</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function Estoque({ materiais }) {
  const [busca, setBusca] = useState("");
  const filtrados = materiais.filter(i => JSON.stringify(i).toLowerCase().includes(busca.toLowerCase()));
  return (
    <>
      <Header title="Estoque e almoxarifado" subtitle="Controle saldos, entradas, saídas e materiais críticos.">
        <button className="btn secondary" onClick={() => exportCSV("estoque.csv", materiais)}><Download size={16}/> Exportar</button>
      </Header>
      <SearchBox value={busca} setValue={setBusca} placeholder="Buscar material, categoria ou unidade" />
      <div className="grid2">
        {filtrados.map((i) => {
          const critico = Number(i.saldo) < Number(i.minimo);
          return (
            <div className="card" key={i.id}>
              <div className="itemTop">
                <div>
                  <h3>{i.item}</h3>
                  <p className="muted">{i.categoria}</p>
                  <strong style={{ fontSize: 30 }}>{i.saldo} <span style={{ fontSize: 16, color: "#64748b" }}>{i.unidade}</span></strong>
                  <p className="muted">Estoque mínimo: {i.minimo}</p>
                </div>
                <Badge tone={critico ? "danger" : "success"}>{critico ? "Crítico" : "Regular"}</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Relatorios({ demandas, ordens, materiais }) {
  const porBairro = demandas.reduce((acc, d) => ({ ...acc, [d.bairro || "Sem bairro"]: (acc[d.bairro || "Sem bairro"] || 0) + 1 }), {});
  const osConcluidas = ordens.filter(o => o.status === "Concluída");
  const criticos = materiais.filter(m => Number(m.saldo) < Number(m.minimo));
  const maxBairro = Math.max(1, ...Object.values(porBairro));

  return (
    <>
      <Header title="Relatórios" subtitle="Demandas por bairro, OS concluídas, estoque crítico e produtividade.">
        <button className="btn secondary" onClick={() => printReport("Relatório Obras Gestor")}><FileText size={16}/> Imprimir/PDF</button>
        <button className="btn secondary" onClick={() => exportCSV("relatorio_demandas.csv", demandas)}><Download size={16}/> Exportar CSV</button>
      </Header>

      <div className="grid2">
        <div className="card reportBox">
          <h3>Demandas por bairro</h3>
          {Object.entries(porBairro).map(([bairro, total]) => (
            <div key={bairro}>
              <div className="itemTop"><span>{bairro}</span><strong>{total}</strong></div>
              <div className="chartBar"><span style={{ width: `${(total / maxBairro) * 100}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="card">
          <h3>Resumo geral</h3>
          <p className="muted">Demandas cadastradas: <strong>{demandas.length}</strong></p>
          <p className="muted">Ordens concluídas: <strong>{osConcluidas.length}</strong></p>
          <p className="muted">Itens em estoque crítico: <strong>{criticos.length}</strong></p>
          <p className="muted">Equipes ativas: <strong>{equipesFixas.length}</strong></p>
        </div>
      </div>

      <div className="grid2" style={{ marginTop: 14 }}>
        <div className="card">
          <h3>OS concluídas</h3>
          <div className="tableWrap">
            <table><thead><tr><th>OS</th><th>Serviço</th><th>Equipe</th></tr></thead><tbody>
              {osConcluidas.map(o => <tr key={o.id}><td>{o.numero}</td><td>{o.tipo}</td><td>{o.equipe}</td></tr>)}
            </tbody></table>
          </div>
        </div>
        <div className="card">
          <h3>Estoque crítico</h3>
          <div className="tableWrap">
            <table><thead><tr><th>Material</th><th>Saldo</th><th>Mínimo</th></tr></thead><tbody>
              {criticos.map(m => <tr key={m.id}><td>{m.item}</td><td>{m.saldo} {m.unidade}</td><td>{m.minimo} {m.unidade}</td></tr>)}
            </tbody></table>
          </div>
        </div>
      </div>
    </>
  );
}

function Equipes() {
  return (
    <>
      <Header title="Equipes de campo" subtitle="Organize equipes, responsáveis e serviços atribuídos." />
      <div className="grid3">
        {equipesFixas.map((e) => (
          <div className="card" key={e.id}>
            <div className="itemTop"><Users /><Badge tone={badgeTone(e.status)}>{e.status}</Badge></div>
            <h3>{e.nome}</h3>
            <p className="muted">Responsável: {e.responsavel}</p>
            <p>{e.servicos} serviços atribuídos</p>
          </div>
        ))}
      </div>
    </>
  );
}

function Placeholder({ title, subtitle, icon: Icon }) {
  return (
    <>
      <Header title={title} subtitle={subtitle} />
      <div className="card" style={{ minHeight: 280, display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <Icon size={44} />
          <h3>Módulo preparado para expansão</h3>
          <p className="muted">Este módulo pode ser conectado ao mesmo banco de dados depois.</p>
        </div>
      </div>
    </>
  );
}

function LoginScreen() {
  const [modo, setModo] = useState("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setMensagem("");
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setMensagem("Não foi possível entrar. Confira e-mail e senha.");
    setCarregando(false);
  }

  async function cadastrar(e) {
    e.preventDefault();
    setMensagem("");
    setCarregando(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome, perfil: "administrador", setor: "Secretaria de Obras" } },
    });
    if (error) setMensagem(error.message);
    else {
      setMensagem("Cadastro criado. Se a confirmação por e-mail estiver ativada, confirme no e-mail antes de entrar.");
      setModo("login");
    }
    setCarregando(false);
  }

  return (
    <div className="loginPage">
      <div className="loginCard">
        <div className="loginLogo"><img src="/logo-obras.png" alt="Brasão Carmo da Cachoeira" /></div>
        <h1>Obras Gestor</h1>
        <p>Área restrita da Secretaria de Obras</p>
        <div className="loginTabs">
          <button className={modo === "login" ? "active" : ""} onClick={() => setModo("login")}>Entrar</button>
          <button className={modo === "cadastro" ? "active" : ""} onClick={() => setModo("cadastro")}>Criar acesso</button>
        </div>
        <form onSubmit={modo === "login" ? entrar : cadastrar} className="loginForm">
          {modo === "cadastro" && <input type="text" placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} required />}
          <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} minLength={6} required />
          {mensagem && <div className="loginMessage">{mensagem}</div>}
          <button className="btn primary" type="submit" disabled={carregando}>{carregando ? "Aguarde..." : modo === "login" ? "Entrar no sistema" : "Criar usuário"}</button>
        </form>
        <small>Após criar os usuários da secretaria, recomenda-se ocultar o cadastro público.</small>
      </div>
    </div>
  );
}

function App() {
  const [active, setActive] = useState("dashboard");
  const [session, setSession] = useState(null);
  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [demandas, setDemandas] = useState(fallbackDemandas);
  const [ordens, setOrdens] = useState(fallbackOrdens);
  const [materiais, setMateriais] = useState(fallbackMateriais);
  const [novaDemanda, setNovaDemanda] = useState({ categoria: "", bairro: "", endereco: "", descricao: "", prioridade: "Normal", status: "Recebida" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setVerificandoSessao(false);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, novaSessao) => {
      setSession(novaSessao);
      setVerificandoSessao(false);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  async function carregarDados() {
    const { data: demandasData } = await supabase.from("demandas").select("*").order("criado_em", { ascending: false });
    const { data: ordensData } = await supabase.from("ordens_servico").select("*").order("criado_em", { ascending: false });
    const { data: materiaisData } = await supabase.from("materiais").select("*").order("nome", { ascending: true });
    const { data: fotosData } = await supabase.from("os_fotos").select("*").order("criado_em", { ascending: false });

    if (demandasData) {
      setDemandas(demandasData.map((d) => ({
        id: d.id, protocolo: d.protocolo, categoria: d.categoria, bairro: d.bairro, endereco: d.endereco,
        status: d.status, prioridade: d.prioridade, descricao: d.descricao, foto_url: d.foto_url,
        data: d.criado_em ? new Date(d.criado_em).toLocaleDateString("pt-BR") : ""
      })));
    }

    if (ordensData) {
      setOrdens(ordensData.map((o) => ({
        id: o.id, numero: o.numero_os, tipo: o.tipo_servico, local: o.endereco, bairro: o.bairro,
        equipe: o.equipe_nome || "Não definida", status: o.status, prioridade: o.prioridade,
        observacao: o.observacao_conclusao || o.descricao,
        prazoRaw: o.prazo_previsto || "",
        prazo: o.prazo_previsto ? new Date(o.prazo_previsto).toLocaleDateString("pt-BR") : "Sem prazo",
        fotos: fotosData?.filter(f => f.ordem_servico_id === o.id) || []
      })));
    }

    if (materiaisData) {
      setMateriais(materiaisData.map((m) => ({
        id: m.id, item: m.nome, categoria: m.categoria, unidade: m.unidade_medida,
        saldo: Number(m.quantidade_atual || 0), minimo: Number(m.estoque_minimo || 0)
      })));
    }
  }

  useEffect(() => { if (session) carregarDados(); }, [session]);

  async function criarDemanda() {
    if (!novaDemanda.categoria || !novaDemanda.endereco) return alert("Informe pelo menos categoria e endereço.");
    const fotoUrl = await fileToDataUrl(novaDemanda.fotoFile);
    const protocolo = `DEM-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const { error } = await supabase.from("demandas").insert({
      protocolo,
      categoria: novaDemanda.categoria,
      bairro: novaDemanda.bairro,
      endereco: novaDemanda.endereco,
      descricao: novaDemanda.descricao,
      prioridade: novaDemanda.prioridade,
      status: novaDemanda.status || "Recebida",
      foto_url: fotoUrl || null
    });
    if (error) return alert("Erro ao salvar demanda: " + error.message);
    setNovaDemanda({ categoria: "", bairro: "", endereco: "", descricao: "", prioridade: "Normal", status: "Recebida" });
    carregarDados();
  }

  async function atualizarDemanda(d) {
    const fotoUrl = d.fotoFile ? await fileToDataUrl(d.fotoFile) : d.foto_url;
    const { error } = await supabase.from("demandas").update({
      categoria: d.categoria,
      bairro: d.bairro,
      endereco: d.endereco,
      descricao: d.descricao,
      prioridade: d.prioridade,
      status: d.status,
      foto_url: fotoUrl || null,
      atualizado_em: new Date().toISOString()
    }).eq("id", d.id);
    if (error) return alert("Erro ao atualizar demanda: " + error.message);
    carregarDados();
  }

  async function excluirDemanda(id) {
    if (!confirm("Deseja excluir esta demanda?")) return;
    const { error } = await supabase.from("demandas").delete().eq("id", id);
    if (error) return alert("Erro ao excluir: " + error.message);
    carregarDados();
  }

  async function gerarOS(d) {
    const numero_os = `OS-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const { error } = await supabase.from("ordens_servico").insert({
      demanda_id: d.id,
      numero_os,
      titulo: d.categoria,
      tipo_servico: d.categoria,
      descricao: d.descricao,
      endereco: `${d.endereco || ""}${d.bairro ? " - " + d.bairro : ""}`,
      bairro: d.bairro,
      prioridade: d.prioridade,
      status: "Aberta",
      equipe_nome: "Equipe Pavimentação"
    });
    if (error) return alert("Erro ao gerar OS: " + error.message);
    await supabase.from("demandas").update({ status: "Encaminhada", atualizado_em: new Date().toISOString() }).eq("id", d.id);
    alert("Ordem de Serviço gerada com sucesso.");
    carregarDados();
    setActive("ordens");
  }

  async function criarOSManual(o) {
    if (!o.tipo || !o.local) return alert("Informe tipo de serviço e local.");
    const numero_os = `OS-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const { error } = await supabase.from("ordens_servico").insert({
      numero_os,
      titulo: o.tipo,
      tipo_servico: o.tipo,
      descricao: o.descricao,
      endereco: o.local,
      bairro: o.bairro,
      prioridade: o.prioridade,
      status: "Aberta",
      equipe_nome: o.equipe,
      prazo_previsto: o.prazo || null
    });
    if (error) return alert("Erro ao criar OS: " + error.message);
    carregarDados();
  }

  async function atualizarOS(o) {
    const { error } = await supabase.from("ordens_servico").update({
      tipo_servico: o.tipo,
      endereco: o.local,
      bairro: o.bairro,
      equipe_nome: o.equipe,
      status: o.status,
      prioridade: o.prioridade || "Normal",
      prazo_previsto: o.prazoRaw || null,
      observacao_conclusao: o.observacao || null,
      data_inicio: o.status === "Em execução" ? new Date().toISOString() : undefined,
      data_conclusao: o.status === "Concluída" ? new Date().toISOString() : undefined,
      atualizado_em: new Date().toISOString()
    }).eq("id", o.id);
    if (error) return alert("Erro ao atualizar OS: " + error.message);

    const fotoAntes = await fileToDataUrl(o.fotoAntes);
    const fotoDepois = await fileToDataUrl(o.fotoDepois);
    const fotos = [];
    if (fotoAntes) fotos.push({ ordem_servico_id: o.id, tipo_foto: "Antes", foto_url: fotoAntes, legenda: "Foto antes" });
    if (fotoDepois) fotos.push({ ordem_servico_id: o.id, tipo_foto: "Depois", foto_url: fotoDepois, legenda: "Foto depois" });
    if (fotos.length) await supabase.from("os_fotos").insert(fotos);

    carregarDados();
  }

  async function excluirOS(id) {
    if (!confirm("Deseja excluir esta OS?")) return;
    const { error } = await supabase.from("ordens_servico").delete().eq("id", id);
    if (error) return alert("Erro ao excluir OS: " + error.message);
    carregarDados();
  }

  const page = useMemo(() => {
    switch (active) {
      case "dashboard": return <Dashboard demandas={demandas} ordens={ordens} materiais={materiais} />;
      case "demandas": return <Demandas demandas={demandas} novaDemanda={novaDemanda} setNovaDemanda={setNovaDemanda} criarDemanda={criarDemanda} atualizarDemanda={atualizarDemanda} excluirDemanda={excluirDemanda} gerarOS={gerarOS} />;
      case "ordens": return <Ordens ordens={ordens} criarOSManual={criarOSManual} atualizarOS={atualizarOS} excluirOS={excluirOS} />;
      case "estoque": return <Estoque materiais={materiais} />;
      case "relatorios": return <Relatorios demandas={demandas} ordens={ordens} materiais={materiais} />;
      case "equipes": return <Equipes />;
      case "frota": return <Placeholder title="Frota e manutenção" subtitle="Controle veículos, máquinas, manutenção e abastecimentos." icon={Truck} />;
      default: return <Dashboard demandas={demandas} ordens={ordens} materiais={materiais} />;
    }
  }, [active, demandas, ordens, materiais, novaDemanda]);

  if (verificandoSessao) return <div className="loadingScreen">Carregando Obras Gestor...</div>;
  if (!session) return <LoginScreen />;

  const usuarioEmail = session?.user?.email || "Usuário";

  return (
    <div className="app">
      <Sidebar active={active} setActive={setActive} />
      <main className="main">
        <div className="topUserBar">
          <span>Conectado como <strong>{usuarioEmail}</strong></span>
          <button className="btn secondary" onClick={() => supabase.auth.signOut()}>Sair</button>
        </div>
        <div className="mobileTop">
          <div className="brand" style={{ margin: 0 }}>
            <div className="logoBox"><img src="/logo-obras.png" alt="Brasão Carmo da Cachoeira" style={{ height: 44, width: 44 }} /></div>
            <div><h1>Obras Gestor</h1><p>Secretaria de Obras</p></div>
          </div>
          <Menu />
        </div>
        {page}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
