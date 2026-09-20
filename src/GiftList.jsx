import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowLeft, Gift, Heart, Check, X } from 'lucide-react';
import { gifts } from './content';
import { reserveGift, watchReservations } from './data';
const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function GiftList() {
  const [category, setCategory] = useState('Todos');
  const [reserved, setReserved] = useState([]);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => watchReservations(
    ids => { setReserved(ids); setReady(true); setNotice(''); },
    () => { setReady(false); setNotice('Não foi possível consultar as reservas. Confira sua conexão ou fale com Isadora ou Matheus antes de comprar.'); }
  ), []);
  async function reserve(e) {
    e.preventDefault(); setSaving(true); setError('');
    const form = new FormData(e.currentTarget);
    try {
      await reserveGift({ id: selected.id, name: form.get('name'), phone: form.get('phone'), website: form.get('website') });
      setReserved(current => [...new Set([...current, selected.id])]); setSuccess(true);
    } catch (err) { setError(err.message || 'Não foi possível reservar. Tente novamente.'); }
    finally { setSaving(false); }
  }
  return <main className="gifts-page"><a className="text-link" href="/"><ArrowLeft size={16}/>Voltar ao convite</a><div className="gifts-heading"><p className="eyebrow">UM POUQUINHO DE VOCÊ NO NOSSO LAR</p><h1>Nossa lista de <em>presentes.</em></h1><p>Escolha um presente, reserve aqui e depois compre na loja.<br/>Assim, cada carinho chega sem repetir.</p><span className="gift-note">Reserve antes de comprar para evitar presentes repetidos ♡</span></div>
    <p className="price-note">Valores enviados pelo casal. O preço final e a disponibilidade são os da loja.</p>
    {notice && <p className="reservation-notice" role="status">{notice}</p>}
    <div className="gift-filters" role="group" aria-label="Filtrar presentes">{['Todos', ...new Set(gifts.map(g => g.category))].map(item => <button key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <div className="gift-grid compact-gifts">{gifts.filter(g => category === 'Todos' || g.category === category).map(gift => {
      const taken = reserved.includes(gift.id);
      return <article className={'gift-card' + (taken ? ' gift-reserved' : '')} key={gift.id}><div className="compact-gift-top"><Gift size={26} strokeWidth={1.2}/><span className={'availability' + (taken ? ' taken' : '')}>{taken ? 'Reservado ♡' : ready ? 'Disponível' : 'A confirmar'}</span></div><div className="gift-content"><p className="eyebrow">{gift.category}</p><h2>{gift.name}</h2><p>{gift.description}</p><p className="gift-price">{gift.price ? money(gift.price) + (gift.maxPrice ? ' – ' + money(gift.maxPrice) : '') : 'Valor na loja'}</p><a className="text-link" href={gift.url} target="_blank" rel="noopener noreferrer">{gift.store} <ArrowUpRight size={15}/></a><button className="button primary reserve-button" disabled={taken || !ready} onClick={() => { setSelected(gift); setSuccess(false); setError(''); }}>{taken ? 'Já escolhido' : 'Quero presentear'}</button></div></article>;
    })}</div><p className="gift-bottom"><Heart size={17}/>Obrigado por fazer parte do nosso novo lar!</p>
    {selected && <div className="reservation-overlay"><section className="reservation-dialog rsvp-card" role="dialog" aria-modal="true" aria-labelledby="reservation-title" onKeyDown={e => { if (e.key === 'Escape' && !saving) setSelected(null); if (e.key === 'Tab') { const nodes = e.currentTarget.querySelectorAll('button:not(:disabled), input:not([tabindex="-1"]), a'); const first = nodes[0]; const last = nodes[nodes.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } } }}><button className="close-reservation" disabled={saving} aria-label="Fechar reserva" onClick={() => setSelected(null)}><X/></button>{success ? <div className="success"><Check size={36}/><h3 id="reservation-title">Presente reservado!</h3><p>{selected.name} ficou reservado para você. Agora é só concluir a compra na loja.</p><a autoFocus className="button primary" href={selected.url} target="_blank" rel="noopener noreferrer">Comprar · {selected.store}<ArrowUpRight size={16}/></a><p>Se mudar de ideia, fale com Isadora ou Matheus para liberar o presente.</p></div> : <form onSubmit={reserve}><h3 id="reservation-title">Reservar com carinho</h3><p className="reservation-product">{selected.name}</p><label>Seu nome<input autoFocus name="name" required minLength={2} maxLength={100} autoComplete="name"/></label><label>WhatsApp com DDD<input name="phone" type="tel" required pattern="[0-9 ()+\-]{10,20}" maxLength={20} autoComplete="tel"/></label><div className="honeypot" aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off"/></div><p className="privacy">Seus dados ficam apenas com o casal. Reservar aqui não realiza a compra.</p>{error && <p className="form-error" role="alert">{error}</p>}<button className="button primary reserve-button" disabled={saving || reserved.includes(selected.id)}>{saving ? 'Reservando…' : 'Confirmar reserva'}</button></form>}</section></div>}
  </main>;
}
