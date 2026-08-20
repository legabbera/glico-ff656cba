import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/termos')({
  component: TermosComponent,
})

function TermosComponent() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link to="/" className="text-blue-600 hover:underline mb-4 inline-block">
          &larr; Voltar para a página inicial
        </Link>
        <h1 className="text-3xl font-bold mb-4">Termos de Serviço</h1>
        <p className="text-gray-600">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <div className="prose max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-3">1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e usar o aplicativo gllico, você concorda em cumprir e ficar vinculado a estes Termos de Serviço. 
            Se você não concordar com qualquer parte destes termos, não deverá usar nossos serviços.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">2. Descrição do Serviço</h2>
          <p>
            O gllico é um diário digital de glicemia projetado para ajudar os usuários a registrar, monitorar e 
            visualizar seus níveis de glicose. O aplicativo fornece ferramentas para gerar relatórios e gráficos baseados nos dados fornecidos pelo usuário.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">3. Isenção de Responsabilidade Médica</h2>
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded text-amber-900 my-4">
            <p className="font-semibold">Importante:</p>
            <p>
              O gllico <strong>NÃO</strong> fornece aconselhamento médico, diagnóstico ou tratamento. 
              As informações e ferramentas disponíveis no aplicativo têm finalidade estritamente informativa e de organização pessoal. 
              Você deve sempre consultar um médico ou profissional de saúde qualificado para qualquer decisão relacionada à sua saúde ou tratamento.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">4. Contas de Usuário</h2>
          <p>
            Para utilizar os recursos completos do aplicativo, você precisará criar uma conta (por exemplo, via Google Login). 
            Você é responsável por manter a confidencialidade de sua conta e é totalmente responsável por todas as atividades 
            que ocorram sob ela.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">5. Uso Aceitável</h2>
          <p>
            Você concorda em não utilizar o serviço para qualquer fim ilegal ou não autorizado. Você não deve violar 
            quaisquer leis de sua jurisdição (incluindo, mas não se limitando a, leis de direitos autorais ou privacidade).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">6. Modificações no Serviço e Preços</h2>
          <p>
            Reservamo-nos o direito de modificar ou descontinuar o serviço (ou qualquer parte dele) a qualquer momento. 
            Os preços de nossos planos premium (se aplicável) estão sujeitos a alterações com aviso prévio.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">7. Cancelamento e Reembolso</h2>
          <p>
            O usuário pode cancelar sua assinatura premium a qualquer momento através do painel da sua conta. O cancelamento interromperá 
            futuras cobranças, e o acesso premium continuará até o final do período já pago.
          </p>
        </section>
      </div>
    </div>
  )
}
