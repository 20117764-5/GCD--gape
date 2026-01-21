import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

// --- DEFINIÇÃO DE ESTILOS ---
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 20, 
    borderBottom: 1, 
    borderColor: '#e2e8f0', 
    paddingBottom: 10 
  },
  logo: { width: 100, height: 50, objectFit: 'contain' },
  schoolInfo: { textAlign: 'right' },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginVertical: 20, 
    textTransform: 'uppercase',
    color: '#1e293b'
  },
  studentBox: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 8, marginBottom: 20 },
  studentLabel: { fontSize: 10, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 },
  studentValue: { fontSize: 12, fontWeight: 'bold', color: '#1e293b' },
  
  // Tabela de Notas
  table: { width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e2e8f0', minHeight: 25, alignItems: 'center' },
  tableHeader: { backgroundColor: '#f1f5f9' },
  colDisciplina: { width: '40%', paddingLeft: 10, fontSize: 10 },
  colUnid: { width: '20%', textAlign: 'center', fontSize: 10 },
  colNota: { width: '20%', textAlign: 'center', fontSize: 10 },
  colFaltas: { width: '20%', textAlign: 'center', fontSize: 10 },
  
  footer: { marginTop: 50, textAlign: 'center', fontSize: 10, color: '#94a3b8' },
  signature: { 
    marginTop: 40, 
    borderTopWidth: 1, 
    borderColor: '#000', 
    width: 200, 
    alignSelf: 'center', 
    textAlign: 'center', 
    paddingTop: 5, 
    fontSize: 10 
  }
})

// --- INTERFACES DE TIPAGEM (CORREÇÃO DO ERRO ANY) ---
interface Nota {
  id: string
  disciplina: string
  unidade: number
  nota: number
  faltas: number
}

interface Aluno {
  nome_completo: string
  turma: string
}

interface BoletimPDFProps {
  aluno: Aluno
  notas: Nota[] // Agora o TypeScript sabe exatamente o que esperar
}

export const BoletimPDF = ({ aluno, notas }: BoletimPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Image src="/logo.png" style={styles.logo} />
        <View style={styles.schoolInfo}>
          <Text style={{ fontSize: 12 }}>CGD Ágape</Text>
          <Text style={{ fontSize: 9, color: '#64748b' }}>Centro Educacional Ágape</Text>
          <Text style={{ fontSize: 9, color: '#64748b' }}>Ano Letivo 2026</Text>
        </View>
      </View>

      <Text style={styles.title}>Boletim de Desempenho Escolar</Text>

      {/* Dados do Aluno */}
      <View style={styles.studentBox}>
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.studentLabel}>Estudante</Text>
          <Text style={styles.studentValue}>{aluno.nome_completo}</Text>
        </View>
        <View>
          <Text style={styles.studentLabel}>Turma</Text>
          <Text style={styles.studentValue}>{aluno.turma}</Text>
        </View>
      </View>

      {/* Tabela de Notas */}
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.colDisciplina}>Disciplina</Text>
          <Text style={styles.colUnid}>Unidade</Text>
          <Text style={styles.colNota}>Média</Text>
          <Text style={styles.colFaltas}>Faltas</Text>
        </View>

        {notas.map((n) => (
          <View key={n.id} style={styles.tableRow}>
            <Text style={styles.colDisciplina}>{n.disciplina}</Text>
            <Text style={styles.colUnid}>{n.unidade}ª</Text>
            <Text style={[styles.colNota, { color: n.nota >= 7 ? '#2563eb' : '#dc2626' }]}>
              {Number(n.nota).toFixed(1)}
            </Text>
            <Text style={styles.colFaltas}>{n.faltas}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.footer}>Documento gerado digitalmente pelo Portal do Aluno CGD Ágape em {new Date().toLocaleDateString('pt-BR')}.</Text>
      
      <View style={styles.signature}>
        <Text>Coordenação Pedagógica</Text>
      </View>
    </Page>
  </Document>
)