import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, Gift, Pencil, Plus, Power, PowerOff, RotateCcw, Trash2, X } from 'lucide-react';
import { releaseGift, reserveGiftAsAdmin, saveGift } from './adminData';

const money = value => value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : 'Valor na loja';
const PAGE_SIZE = 15;

export default function AdminGiftCatalog({ catalog, reservations, onRefresh, onNotice, onError }) {
  const [editing, setEditing] = useState(null);
  const [reserving, setReserving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(0);
  const reservedIds = useMemo(() => new Set(reservations.map(item => item.id)), [reservations]);
  const nextNumber = Math.max(0, ...catalog.map(item => item.number || 0)) + 1;
  const totalPages = Math.max(1, Math.ceil(catalog.length / PAGE_SIZE));
  const firstItem = page * PAGE_SIZE;
  const pageItems = catalog.slice(firstItem, firstItem + PAGE_SIZE);
  useEffect(() => { setPage(current => Math.min(current, totalPages - 1)); }, [totalPages]);

  async function run(action, success) {
    setBusy(true); onError('');
    try { await action(); onNotice(success); await onRefresh(); return true; }
    catch (error) { onError(error.message || 'Não foi possível concluir esta ação.'); return false; }
    finally { setBusy(false); }
  }

  async function submitGift(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const saved = await run(() => saveGift({
      ...editing,
      number: Number(form.get('number')),
      name: form.get('name'),
      category: form.get('category'),
      description: form.get('description'),
      url: form.get('url'),
      store: form.get('store'),
      price: form.get('price'),
      maxPrice: form.get('maxPrice'),
      active: form.get('active') === 'on',
      deleted: false,
    }), editing?.id ? 'Presente atualizado no site.' : 'Presente criado e publicado na lista.');
    if (saved) setEditing(null);
  }

  async function toggle(gift) {
    await run(() => saveGift({ ...gift, active: !gift.active, deleted: false }), gift.active ? 'Presente ocultado da lista.' : 'Presente ativado na lista.');
  }

  async function archive(gift) {
    if (gift.deleted) return run(() => saveGift({ ...gift, deleted: false, active: true }), 'Presente restaurado.');
    if (reservedIds.has(gift.id)) { onError('Libere a reserva antes de excluir este presente.'); return; }
    if (!window.confirm(`Excluir “${gift.name}” da lista? Você poderá restaurá-lo depois.`)) return;
    await run(() => saveGift({ ...gift, active: false, deleted: true }), 'Presente excluído da lista.');
  }

  async function reserve(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const saved = await run(() => reserveGiftAsAdmin({ id: reserving.id, name: form.get('name'), phone: form.get('phone') }), 'Presente reservado pelo painel.');
    if (saved) setReserving(null);
  }

  async function release(gift) {
    if (!window.confirm(`Liberar “${gift.name}” para os convidados?`)) return;
    await run(() => releaseGift(gift.id), 'Presente liberado novamente.');
  }

  return <section className="admin-section admin-catalog"><div className="admin-section-title"><div><p className="eyebrow">CATÁLOGO</p><h2>Gerenciar presentes</h2><p>Edite títulos e links, controle a visibilidade e faça reservas manuais.</p></div><button className="button primary" onClick={() => setEditing({ number: nextNumber, category: 'Nosso cantinho', store: 'Shopee', active: true, deleted: false })}><Plus size={16}/>Novo presente</button></div>
    <div className="catalog-admin-list">{pageItems.map(gift => {
      const reserved = reservedIds.has(gift.id);
      return <article className={gift.deleted ? 'is-deleted' : !gift.active ? 'is-inactive' : ''} key={gift.id}><div className="catalog-admin-number">#{String(gift.number).padStart(2, '0')}</div><div className="catalog-admin-info"><strong>{gift.name}</strong><span>{gift.category} · {gift.store} · {money(gift.price)}</span><a href={gift.url} target="_blank" rel="noreferrer">Abrir link <ExternalLink size={13}/></a></div><div className="catalog-admin-state"><span className={gift.deleted ? 'deleted' : reserved ? 'reserved' : gift.active ? 'active' : 'inactive'}>{gift.deleted ? 'Excluído' : reserved ? 'Reservado' : gift.active ? 'Ativo' : 'Oculto'}</span></div><div className="catalog-admin-actions"><button onClick={() => setEditing(gift)} disabled={busy || gift.deleted}><Pencil size={14}/>Editar</button><button onClick={() => toggle(gift)} disabled={busy || gift.deleted}>{gift.active ? <PowerOff size={14}/> : <Power size={14}/>} {gift.active ? 'Ocultar' : 'Ativar'}</button><button onClick={() => reserved ? release(gift) : setReserving(gift)} disabled={busy || gift.deleted || !gift.active}><Gift size={14}/>{reserved ? 'Liberar' : 'Reservar'}</button><button className={gift.deleted ? '' : 'danger'} onClick={() => archive(gift)} disabled={busy}>{gift.deleted ? <RotateCcw size={14}/> : <Trash2 size={14}/>} {gift.deleted ? 'Restaurar' : 'Excluir'}</button></div></article>;
    })}</div>
    {catalog.length > PAGE_SIZE && <nav className="catalog-pagination" aria-label="Paginação do catálogo"><span>Mostrando {firstItem + 1}–{Math.min(firstItem + PAGE_SIZE, catalog.length)} de {catalog.length} · Página {page + 1} de {totalPages}</span><div><button aria-label="Página anterior" onClick={() => setPage(current => Math.max(0, current - 1))} disabled={page === 0}><ArrowLeft size={16}/>Anterior</button><button aria-label="Próxima página" onClick={() => setPage(current => Math.min(totalPages - 1, current + 1))} disabled={page === totalPages - 1}>Próxima<ArrowRight size={16}/></button></div></nav>}
    {editing && <div className="reservation-overlay"><section className="reservation-dialog admin-gift-dialog" role="dialog" aria-modal="true" aria-labelledby="gift-editor-title"><button className="close-reservation" aria-label="Fechar" onClick={() => setEditing(null)} disabled={busy}><X/></button><form onSubmit={submitGift}><h3 id="gift-editor-title">{editing.id ? 'Editar presente' : 'Novo presente'}</h3><div className="admin-form-grid"><label>Número<input name="number" type="number" min="1" max="999" defaultValue={editing.number} required/></label><label>Loja<input name="store" defaultValue={editing.store} minLength={2} maxLength={50} required/></label><label className="full">Título<input name="name" defaultValue={editing.name || ''} minLength={2} maxLength={120} required/></label><label>Categoria<input name="category" list="gift-categories" defaultValue={editing.category} minLength={2} maxLength={50} required/><datalist id="gift-categories"><option value="Nosso cantinho"/><option value="Na cozinha"/><option value="À mesa"/><option value="Lavanderia"/></datalist></label><label>Preço<input name="price" type="number" min="0" step="0.01" defaultValue={editing.price || ''} placeholder="0,00"/></label><label className="full">Descrição<textarea name="description" maxLength={300} rows={3} defaultValue={editing.description || ''}/></label><label className="full">Link HTTPS<input name="url" type="url" defaultValue={editing.url || ''} required/></label><label>Preço máximo <span>(se houver faixa)</span><input name="maxPrice" type="number" min="0" step="0.01" defaultValue={editing.maxPrice || ''}/></label><label className="admin-checkbox"><input name="active" type="checkbox" defaultChecked={editing.active !== false}/>Visível para os convidados</label></div><button className="button primary w-full justify-center" disabled={busy}>{busy ? 'Salvando…' : 'Salvar presente'}</button></form></section></div>}
    {reserving && <div className="reservation-overlay"><section className="reservation-dialog rsvp-card admin-reserve-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-reserve-title"><button className="close-reservation" aria-label="Fechar" onClick={() => setReserving(null)} disabled={busy}><X/></button><form onSubmit={reserve}><p className="eyebrow">RESERVA MANUAL</p><h3 id="admin-reserve-title">Reservar pelo painel</h3><p className="reservation-product">#{String(reserving.number).padStart(2, '0')} · {reserving.name}</p><label>Nome do convidado<input autoFocus name="name" minLength={2} maxLength={100} placeholder="Nome de quem escolheu o presente" required/></label><label>WhatsApp com DDD<input name="phone" type="tel" pattern="[0-9 ()+\-]{10,20}" maxLength={20} placeholder="(00) 00000-0000" required/></label><button className="button primary w-full justify-center" disabled={busy}>{busy ? 'Reservando…' : 'Confirmar reserva'}</button></form></section></div>}
  </section>;
}
