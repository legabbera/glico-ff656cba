import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/privacidade')({
  component: PrivacidadeComponent,
})

function PrivacidadeComponent() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link to="/" className="text-blue-600 hover:underline mb-4 inline-block">
          &larr; Voltar para a página inicial
        </Link>
        <h1 className="text-3xl font-bold mb-4">Política de Privacidade</h1>
        <p className="text-gray-600">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <div className="prose max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-3">1. Introdução</h2>
          <p>
            Bem-vindo ao gllico. Nós respeitamos a sua privacidade e estamos comprometidos em proteger os seus dados pessoais. 
            Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações quando você 
            usa o nosso aplicativo e site.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">2. Dados que Coletamos</h2>
          <p>Podemos coletar os seguintes tipos de informações:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Dados de Identificação:</strong> Nome, endereço de e-mail e foto de perfil (fornecidos via Google Login).</li>
            <li><strong>Dados de Saúde:</strong> Registros de glicemia e horários de medição que você insere no aplicativo.</li>
            <li><strong>Dados Técnicos:</strong> Informações sobre o dispositivo, navegador e endereço IP utilizados para acessar o sistema.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">3. Como Usamos Seus Dados</h2>
          <p>Utilizamos as informações coletadas para:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Fornecer e manter o serviço de diário de glicemia.</li>
            <li>Permitir o seu acesso à conta através de autenticação segura.</li>
            <li>Gerar gráficos, relatórios e estatísticas pessoais para você.</li>
            <li>Melhorar nosso aplicativo e a experiência do usuário.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">4. Compartilhamento de Dados</h2>
          <p>
            Os seus dados de saúde são estritamente confidenciais. Nós não vendemos, alugamos ou compartilhamos 
            suas informações pessoais com terceiros para fins de marketing. O compartilhamento ocorre apenas quando 
            exigido por lei ou com provedores de infraestrutura estritamente necessários para o funcionamento do app (ex: Supabase, Vercel).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">5. Segurança</h2>
          <p>
            Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado. 
            No entanto, nenhum método de transmissão pela internet é 100% seguro.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">6. Seus Direitos</h2>
          <p>
            Você tem o direito de solicitar acesso, correção ou exclusão dos seus dados pessoais a qualquer momento. 
            Para exercer esses direitos, basta excluir sua conta pelo próprio painel do aplicativo ou entrar em contato conosco.
          </p>
        </section>
      </div>
    </div>
  )
}
