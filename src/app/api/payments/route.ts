import { NextResponse } from 'next/server'
import { criarCobrancaAsaas } from '@/services/asaas'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const dados = await request.json()
    const { aluno_id, tipo_taxa, valor, data_vencimento, observacao, responsavel_nome, responsavel_cpf } = dados

    // 1. Tenta criar no Asaas
    const resultadoAsaas = await criarCobrancaAsaas({
      valor,
      dataVencimento: data_vencimento,
      descricao: `CGD Ágape - ${tipo_taxa}`,
      nomeCliente: responsavel_nome,
      cpfCliente: responsavel_cpf
    })

    if (!resultadoAsaas.sucesso) {
      return NextResponse.json({ error: `Erro Asaas: ${resultadoAsaas.erro}` }, { status: 400 })
    }

    // 2. Se deu certo lá, salva no nosso banco com o link gerado
    const { error } = await supabase
      .from('cobrancas')
      .insert([{
        aluno_id,
        tipo_taxa,
        valor,
        data_vencimento,
        observacao,
        status_pagamento: 'pendente',
        link_pagamento: resultadoAsaas.linkPagamento, // <--- O LINK DE OURO
        id_transacao_externa: resultadoAsaas.idTransacao
      }])

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, link: resultadoAsaas.linkPagamento })

  } catch (err) {
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}