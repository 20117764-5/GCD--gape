/* eslint-disable jsx-a11y/alt-text */
'use client'
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'

// Estilos parecidos com CSS, mas para PDF
const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 10, alignItems: 'center' },
  logo: { width: 60, height: 30, marginRight: 10 }, // Ajuste conforme sua logo
  schoolName: { fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase' },
  schoolInfo: { fontSize: 8, color: '#555' },
  title: { fontSize: 20, textAlign: 'center', marginVertical: 20, fontWeight: 'bold', textTransform: 'uppercase' },
  box: { border: '1px solid #000', padding: 15, marginVertical: 10, borderRadius: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label: { fontWeight: 'bold', fontSize: 10, color: '#555', textTransform: 'uppercase' },
  value: { fontSize: 12, fontWeight: 'bold' },
  bodyText: { lineHeight: 1.5, marginVertical: 20, textAlign: 'justify' },
  signature: { marginTop: 50, borderTopWidth: 1, borderTopColor: '#000', width: 250, alignSelf: 'center', textAlign: 'center', paddingTop: 5, fontSize: 10 },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', fontSize: 8, color: '#aaa' }
})

// Tipagem dos dados que o recibo precisa receber
interface ReciboProps {
  dados: {
    id_transacao: string
    aluno: string
    responsavel: string
    cpf_responsavel: string
    valor: number
    data_pagamento: string
    referente_a: string // Ex: Mensalidade Maio
    forma_pagamento: string // Pix, Boleto
  }
}

export function ReciboDoc({ dados }: ReciboProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* CABEÇALHO */}
        <View style={styles.header}>
            {/* Se der erro na imagem em produção, remova essa linha ou use URL absoluta */}
            {/* <Image src="/logo.png" style={styles.logo} /> */}
            <View>
                <Text style={styles.schoolName}>Centro Educacional CGD Ágape</Text>
                <Text style={styles.schoolInfo}>CNPJ: 00.000.000/0001-00 | Rua da Escola, 123 - Olinda/PE</Text>
                <Text style={styles.schoolInfo}>Tel: (81) 99999-9999 | Email: contato@cgd-agape.com</Text>
            </View>
        </View>

        {/* TÍTULO */}
        <Text style={styles.title}>Recibo de Pagamento</Text>

        {/* VALOR EM DESTAQUE */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <View style={[styles.box, { backgroundColor: '#f0f0f0', width: 150 }]}>
                <Text style={styles.label}>Valor Pago</Text>
                <Text style={[styles.value, { fontSize: 16 }]}>
                    {dados.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Text>
            </View>
        </View>

        {/* TEXTO DO RECIBO */}
        <Text style={styles.bodyText}>
            Recebemos de <Text style={{ fontWeight: 'bold' }}>{dados.responsavel}</Text> 
            {dados.cpf_responsavel ? `, CPF nº ${dados.cpf_responsavel}` : ''}, 
            a importância supra de {dados.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, 
            referente ao pagamento de <Text style={{ fontWeight: 'bold' }}>{dados.referente_a}</Text> 
            do(a) aluno(a) <Text style={{ fontWeight: 'bold' }}>{dados.aluno}</Text>.
        </Text>

        {/* DETALHES TÉCNICOS */}
        <View style={styles.box}>
            <View style={styles.row}>
                <Text style={styles.label}>Data do Pagamento</Text>
                <Text style={styles.value}>{dados.data_pagamento}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Forma de Pagamento</Text>
                <Text style={styles.value}>{dados.forma_pagamento}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>ID Transação</Text>
                <Text style={styles.value}>{dados.id_transacao.slice(0, 8).toUpperCase()}</Text>
            </View>
        </View>

        {/* ASSINATURA */}
        <View style={styles.signature}>
            <Text>CGD Ágape - Tesouraria</Text>
        </View>

        {/* RODAPÉ */}
        <Text style={styles.footer}>
            Recibo gerado eletronicamente em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}. 
            Este documento tem valor legal para comprovação de pagamento.
        </Text>

      </Page>
    </Document>
  )
}