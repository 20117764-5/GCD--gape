import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    // 1. Recebe o pacote do Asaas
    const body = await request.json()
    
    // O Asaas manda um evento. Queremos saber se foi PAGO.
    // Os eventos de sucesso são: PAYMENT_RECEIVED ou PAYMENT_CONFIRMED
    const evento = body.event
    const pagamento = body.payment

    console.log(`🔔 Webhook recebido: ${evento} para o ID ${pagamento.id}`)

    if (evento === 'PAYMENT_RECEIVED' || evento === 'PAYMENT_CONFIRMED') {
      
      // 2. Busca a cobrança no nosso banco pelo ID do Asaas
      // Lembra que salvamos o "id_transacao_externa"? É agora que ele brilha.
      const { error } = await supabase
        .from('cobrancas')
        .update({ 
          status_pagamento: 'pago', 
          pago_em: new Date().toISOString() 
        })
        .eq('id_transacao_externa', pagamento.id)

      if (error) {
        console.error('Erro ao atualizar Supabase:', error)
        return NextResponse.json({ error: 'Erro no banco' }, { status: 500 })
      }
      
      console.log('✅ Pagamento atualizado com sucesso no sistema!')
    }

    // 3. Responde pro Asaas que recebemos (se não responder 200, eles ficam tentando enviar de novo)
    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('Erro no Webhook:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}