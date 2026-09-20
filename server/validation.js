export function validateRsvp(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Resposta inválida.');
  if (body.website) throw new Error('Não foi possível enviar a resposta.');
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.replace(/\D/g, '') : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (name.length < 2 || name.length > 100) throw new Error('Informe seu nome (de 2 a 100 caracteres).');
  if (!/^\d{10,13}$/.test(phone)) throw new Error('Confira o WhatsApp, incluindo o DDD.');
  if (!['yes', 'no'].includes(body.attendance)) throw new Error('Selecione se você poderá ir.');
  if (!Number.isInteger(body.guests) || (body.attendance === 'yes' ? body.guests < 1 || body.guests > 4 : body.guests !== 0)) throw new Error('Selecione uma quantidade válida de pessoas.');
  if (message.length > 500) throw new Error('O recadinho pode ter até 500 caracteres.');
  return { name, phone, attendance: body.attendance, guests: body.guests, message };
}
