// src/services/asaas.ts

// --- CONFIGURAÇÃO DIRETA (HARDCODED) ---
// Estamos colocando as chaves aqui direto para garantir que funcione.
const ASAAS_URL = 'https://sandbox.asaas.com/api/v3'
const ASAAS_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmY4YTBkNmI0LWU3OTctNDRiZC05NDA4LWU0ZWZlMTIyZmM1ZTo6JGFhY2hfNDQ5NWZhYTktMTY3MS00NmFjLTk5MGMtMWY4MGVkODdlOWNi'

interface CriarCobrancaProps {
  valor: number
  dataVencimento: string
  descricao: string
  nomeCliente: string
  cpfCliente: string
}

export async function criarCobrancaAsaas({ valor, dataVencimento, descricao, nomeCliente, cpfCliente }: CriarCobrancaProps) {
  try {
    console.log("Iniciando integração com Asaas...")

    // 1. Cria ou Busca o Cliente no Asaas
    // O Asaas precisa que o cliente exista antes de gerar a cobrança
    const clienteResponse = await fetch(`${ASAAS_URL}/customers`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'access_token': ASAAS_KEY 
      },
      body: JSON.stringify({ name: nomeCliente, cpfCnpj: cpfCliente })
    })
    
    const clienteDados = await clienteResponse.json()
    
    // Se der erro ao criar cliente (ex: CPF inválido), joga um erro para o catch
    if (clienteDados.errors) {
        throw new Error(`Erro ao criar cliente no Asaas: ${clienteDados.errors[0].description}`)
    }

    const asaasId = clienteDados.id

    // 2. Cria a Cobrança para esse Cliente
    const cobrancaResponse = await fetch(`${ASAAS_URL}/payments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'access_token': ASAAS_KEY 
      },
      body: JSON.stringify({
        customer: asaasId,
        billingType: 'UNDEFINED', // UNDEFINED permite que o pai escolha entre PIX e Boleto na tela de pagamento
        value: valor,
        dueDate: dataVencimento,
        description: descricao,
        externalReference: 'cgd_agape_sistema'
      })
    })

    const cobranca = await cobrancaResponse.json()

    if (cobranca.errors) {
        throw new Error(`Erro ao criar cobrança: ${cobranca.errors[0].description}`)
    }
    
    // Sucesso! Retorna o link para o nosso sistema salvar
    return {
      sucesso: true,
      linkPagamento: cobranca.invoiceUrl,
      idTransacao: cobranca.id
    }

  } catch (error) {
    console.error('Falha na integração Asaas:', error)
    
    let mensagemErro = 'Erro desconhecido na comunicação com o Asaas'
    if (error instanceof Error) {
        mensagemErro = error.message
    }
    
    return { sucesso: false, erro: mensagemErro }
  }
}