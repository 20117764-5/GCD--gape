export default function DashboardHome() {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-800">Bem-vindo, Gestor!</h1>
        <p className="text-slate-500">Selecione uma opção no menu lateral para começar o gerenciamento.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition cursor-pointer">
            <h3 className="text-lg font-bold text-blue-600 mb-2">Acesso Rápido: Alunos</h3>
            <p className="text-slate-500 text-sm">Cadastre novos alunos, consulte turmas e gere cobranças manuais.</p>
          </div>
  
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition cursor-pointer">
            <h3 className="text-lg font-bold text-green-600 mb-2">Acesso Rápido: Financeiro</h3>
            <p className="text-slate-500 text-sm">Visualize o fluxo de caixa, inadimplência e dê baixa em pagamentos.</p>
          </div>
        </div>
      </div>
    )
  }