import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Gift, Heart, LogIn, LogOut, MessageCircle, Plus, RefreshCw, ShieldCheck, Trash2, Users } from 'lucide-react';
import { addAdmin, currentAdminUser, loadAdminDashboard, releaseGift, removeAdmin, signInAdmin, signOutAdmin } from './adminData';
import AdminGiftCatalog from './AdminGiftCatalog';
import { mergeGiftCatalog } from './catalog';

const bootstrapEmail = 'matheusevaristo10@gmail.com';
const formatDate = value => value?.toDate ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(value.toDate()) : '—';
const whatsApp = phone => `https://wa.me/${String(phone).length <= 11 ? '55' : ''}${phone}`;

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ reservations: [], rsvps: [], admins: [], catalog: [] });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const catalog = useMemo(() => mergeGiftCatalog(data.catalog), [data.catalog]);
  const giftMap = useMemo(() => Object.fromEntries(catalog.map(gift => [gift.id, gift])), [catalog]);

  async function refresh(activeUser = user) {
    if (!activeUser || activeUser.isAnonymous) { setLoading(false); return; }
    setLoading(true); setError('');
    try { setData(await loadAdminDashboard()); }
    catch (err) { setError(err.code === 'permission-denied' ? 'Esta conta Google ainda não tem acesso ao painel.' : err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { currentAdminUser().then(current => { setUser(current); return refresh(current); }).catch(err => { setError(err.message); setLoading(false); }); }, []);

  async function login() {
    setBusy(true); setError('');
    try { const current = await signInAdmin(); setUser(current); await refresh(current); }
    catch (err) { setError(err.code === 'auth/operation-not-allowed' ? 'Ative o provedor Google no Firebase Authentication.' : 'Não foi possível entrar com o Google. Tente novamente.'); }
    finally { setBusy(false); }
  }
  async function logout() { await signOutAdmin(); setUser(null); setData({ reservations: [], rsvps: [], admins: [], catalog: [] }); setError(''); }
  async function createAdmin(event) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try { await addAdmin({ name: form.get('name'), email: form.get('email') }); event.currentTarget.reset(); setNotice('Acesso adicionado. A Isadora já pode entrar com esse Google.'); await refresh(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  async function release(id) {
    const gift = giftMap[id];
    if (!window.confirm(`Liberar “${gift?.name || id}” para outras pessoas?`)) return;
    setBusy(true); setError('');
    try { await releaseGift(id); setNotice('Presente liberado novamente.'); await refresh(); }
    catch { setError('Não foi possível liberar o presente. Tente novamente.'); }
    finally { setBusy(false); }
  }
  async function revoke(email) {
    if (!window.confirm(`Remover o acesso administrativo de ${email}?`)) return;
    setBusy(true); setError('');
    try { await removeAdmin(email); setNotice('Acesso removido.'); await refresh(); }
    catch { setError('Não foi possível remover este acesso.'); }
    finally { setBusy(false); }
  }

  const confirmed = data.rsvps.filter(item => item.attendance === 'yes');
  const guests = confirmed.reduce((total, item) => total + item.guests, 0);
  if (!user || user.isAnonymous) return <main className="admin-login"><a href="/" className="text-link"><ArrowLeft size={16}/>Voltar ao convite</a><section><ShieldCheck size={42}/><p className="eyebrow">ÁREA PRIVATIVA</p><h1>Painel do <em>casal.</em></h1><p>Acompanhe presentes e confirmações em um só lugar.</p>{error && <p className="form-error" role="alert">{error}</p>}<button className="button primary" onClick={login} disabled={busy}><LogIn size={18}/>{busy ? 'Entrando…' : 'Entrar com Google'}</button></section></main>;

  return <main className="admin-page"><header className="admin-header"><div><p className="eyebrow">ISADORA & MATHEUS</p><h1>Painel do casal</h1><span>{user.email}</span></div><div><a className="button outline" href="/"><ArrowLeft size={16}/>Ver site</a><button className="button ghost-button" onClick={logout}><LogOut size={16}/>Sair</button></div></header>
    {notice && <p className="admin-notice" role="status">{notice}</p>}{error && <p className="admin-error" role="alert">{error}</p>}
    <div className="admin-toolbar"><button className="button outline" onClick={() => refresh()} disabled={loading || busy}><RefreshCw size={16}/>{loading ? 'Atualizando…' : 'Atualizar dados'}</button></div>
    <section className="admin-stats"><article><Gift/><div><strong>{data.reservations.length}</strong><span>presentes reservados</span></div></article><article><CheckCircle2/><div><strong>{confirmed.length}</strong><span>confirmações</span></div></article><article><Users/><div><strong>{guests}</strong><span>pessoas confirmadas</span></div></article><article><Heart/><div><strong>{data.rsvps.filter(item => item.attendance === 'no').length}</strong><span>não poderão ir</span></div></article></section>
    <AdminGiftCatalog catalog={catalog} reservations={data.reservations} onRefresh={() => refresh()} onNotice={setNotice} onError={setError}/>
    <section className="admin-section"><div className="admin-section-title"><div><p className="eyebrow">RESERVAS</p><h2>Quem escolheu o quê</h2></div><span>{data.reservations.length} de {catalog.filter(gift => !gift.deleted).length}</span></div>{data.reservations.length ? <div className="admin-table-wrap"><table><thead><tr><th>Presente</th><th>Convidado</th><th>Contato</th><th>Reserva</th><th/></tr></thead><tbody>{data.reservations.map(item => <tr key={item.id}><td><strong>#{String(giftMap[item.id]?.number || 0).padStart(2, '0')} · {giftMap[item.id]?.name || item.id}</strong><span>{giftMap[item.id]?.store}</span></td><td>{item.name}</td><td><a href={whatsApp(item.phone)} target="_blank" rel="noreferrer"><MessageCircle size={14}/>{item.phone}</a></td><td>{formatDate(item.createdAt)}</td><td><button className="icon-button danger" title="Liberar presente" onClick={() => release(item.id)} disabled={busy}><Trash2 size={16}/></button></td></tr>)}</tbody></table></div> : <div className="admin-empty"><Gift/><p>Nenhum presente reservado ainda.</p></div>}</section>
    <section className="admin-section"><div className="admin-section-title"><div><p className="eyebrow">PRESENÇAS</p><h2>Respostas dos convidados</h2></div><span>{data.rsvps.length} respostas</span></div>{data.rsvps.length ? <div className="rsvp-admin-grid">{data.rsvps.map(item => <article key={item.id}><div><span className={item.attendance === 'yes' ? 'yes' : 'no'}>{item.attendance === 'yes' ? 'Confirmado' : 'Não poderá ir'}</span><time>{formatDate(item.createdAt)}</time></div><h3>{item.name}</h3><a href={whatsApp(item.phone)} target="_blank" rel="noreferrer"><MessageCircle size={14}/>{item.phone}</a>{item.attendance === 'yes' && <p>{item.guests} {item.guests === 1 ? 'pessoa' : 'pessoas'}</p>}{item.message && <blockquote>“{item.message}”</blockquote>}</article>)}</div> : <div className="admin-empty"><Users/><p>Nenhuma confirmação recebida ainda.</p></div>}</section>
    <section className="admin-section admin-access"><div><p className="eyebrow">ACESSO</p><h2>Administradores</h2><p>Você é o administrador principal. Adicione o e-mail Google da Isadora.</p><div className="admin-users"><span><ShieldCheck size={15}/>{bootstrapEmail}<small>principal</small></span>{data.admins.map(item => <span key={item.id}><ShieldCheck size={15}/>{item.name} · {item.email}<button aria-label={`Remover ${item.email}`} onClick={() => revoke(item.email)} disabled={busy}><Trash2 size={14}/></button></span>)}</div></div><form onSubmit={createAdmin}><label>Nome<input name="name" required minLength={2} maxLength={80} placeholder="Isadora"/></label><label>E-mail Google<input name="email" type="email" required maxLength={254} placeholder="isadora@gmail.com"/></label><button className="button primary" disabled={busy}><Plus size={16}/>Adicionar acesso</button></form></section>
  </main>;
}
